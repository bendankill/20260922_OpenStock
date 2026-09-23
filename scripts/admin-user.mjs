#!/usr/bin/env node
/**
 * OpenStock 本地开发者用户管理工具（仅限本机命令行使用，不提供 HTTP 接口）
 *
 * 用法（在 openstock 容器内执行）：
 *   node scripts/admin-user.mjs list
 *   node scripts/admin-user.mjs show <Account>
 *   node scripts/admin-user.mjs reset-password <Account> <新密码>
 *   node scripts/admin-user.mjs rename <Account> <新Account>
 *   node scripts/admin-user.mjs delete <Account> --yes
 */

import { MongoClient, ObjectId } from "mongodb";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { createHash } from "node:crypto";

const ACCOUNT_MIN_LENGTH = 2;
const ACCOUNT_MAX_LENGTH = 32;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const ACCOUNT_PATTERN = /^[\p{Script=Han}A-Za-z0-9]+$/u;

const USAGE = `用法（在 openstock 容器内执行）：
  node scripts/admin-user.mjs list
  node scripts/admin-user.mjs show <Account>
  node scripts/admin-user.mjs reset-password <Account> <新密码>
  node scripts/admin-user.mjs rename <Account> <新Account>
  node scripts/admin-user.mjs delete <Account> --yes`;

function normalizeAccount(raw) {
    return raw
        .normalize("NFKC")
        .replace(/[A-Z]/g, (char) => char.toLowerCase());
}

function validateAccount(raw) {
    if (typeof raw !== "string" || raw.trim().length === 0) {
        return { ok: false, error: "账号不能为空" };
    }
    const display = raw.trim();
    const normalized = normalizeAccount(display);
    if (normalized.length < ACCOUNT_MIN_LENGTH) {
        return { ok: false, error: `账号至少 ${ACCOUNT_MIN_LENGTH} 个字符` };
    }
    if (normalized.length > ACCOUNT_MAX_LENGTH) {
        return { ok: false, error: `账号最多 ${ACCOUNT_MAX_LENGTH} 个字符` };
    }
    if (!ACCOUNT_PATTERN.test(normalized)) {
        return { ok: false, error: "账号只能包含中文、字母和数字，不能包含空格或符号" };
    }
    return { ok: true, display, normalized };
}

function validatePassword(raw) {
    if (typeof raw !== "string" || raw.length < PASSWORD_MIN_LENGTH) {
        return { ok: false, error: `密码长度至少为 ${PASSWORD_MIN_LENGTH} 位` };
    }
    if (raw.length > PASSWORD_MAX_LENGTH) {
        return { ok: false, error: `密码长度最多为 ${PASSWORD_MAX_LENGTH} 位` };
    }
    return { ok: true };
}

function generateInternalEmail(normalizedAccount) {
    const digest = createHash("sha256")
        .update(normalizedAccount, "utf8")
        .digest("hex");
    return `${digest}@local.openstock.invalid`;
}

// better-auth 的 user/account/session 集合在原始文档中以 ObjectId 关联；
// 适配器视图中的 id 字符串 = _id 的字符串形式。
// watchlists/alerts 是 Mongoose 集合，userId 为字符串。
function userIdOf(user) {
    return String(user._id);
}

function userIdObjectId(user) {
    return new ObjectId(String(user._id));
}

function displayNameOf(user) {
    return user?.displayUsername ?? user?.username ?? user?.name ?? "-";
}

async function connect() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("未找到 MONGODB_URI 环境变量。请确认在 openstock 容器内执行（docker compose exec openstock node scripts/admin-user.mjs ...）。");
        process.exit(1);
    }
    let dbName = "openstock";
    try {
        const parsed = new URL(uri);
        if (parsed.pathname && parsed.pathname.length > 1) {
            dbName = parsed.pathname.slice(1);
        }
    } catch {
        // 保留默认库名
    }
    let client;
    try {
        client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        return { client, db: client.db(dbName) };
    } catch (error) {
        console.error("无法连接 MongoDB：", error?.message ?? error);
        if (client) {
            await client.close().catch(() => {});
        }
        process.exit(1);
    }
}

async function findUserByAccount(db, accountInput) {
    const validation = validateAccount(accountInput);
    if (!validation.ok) {
        console.error(`账号无效：${validation.error}`);
        return null;
    }
    const user = await db.collection("user").findOne({ username: validation.normalized });
    if (!user) {
        console.error(`未找到账号：${accountInput}`);
        return null;
    }
    return user;
}

async function commandList(db) {
    const users = await db.collection("user").find().sort({ createdAt: 1 }).toArray();
    if (users.length === 0) {
        console.log("（暂无用户）");
        return;
    }
    console.log("Account           Display Name      User ID                             Created At");
    console.log("-".repeat(110));
    for (const user of users) {
        const account = user.username ?? "-";
        const display = user.displayUsername ?? "-";
        const createdAt = user.createdAt ? new Date(user.createdAt).toISOString() : "-";
        console.log(
            `${account.padEnd(17)} ${String(display).padEnd(17)} ${userIdOf(user).padEnd(35)} ${createdAt}`
        );
    }
    console.log(`\n共 ${users.length} 个用户`);
}

async function commandShow(db, accountInput) {
    const user = await findUserByAccount(db, accountInput);
    if (!user) return;

    const userId = userIdOf(user);
    const userObjectId = userIdObjectId(user);

    console.log("\n== user collection ==");
    console.log(JSON.stringify({ ...user, id: userId }, null, 2));

    const accounts = await db.collection("account").find({ userId: userObjectId }).toArray();
    console.log("\n== account collection（credential 记录）==");
    for (const account of accounts) {
        const isCredential = account.providerId === "credential";
        const output = { ...account };
        if (isCredential && output.password) {
            output.password = {
                PASSWORD_HASH_NOT_PLAINTEXT: output.password,
            };
        }
        console.log(JSON.stringify(output, null, 2));
        if (isCredential) {
            console.log(`密码哈希存在：${account.password ? "是" : "否"}`);
            console.log("PASSWORD HASH - NOT PLAINTEXT（密码哈希 - 非明文）");
        }
    }
    if (accounts.length === 0) {
        console.log("（无 account 记录）");
    }

    const sessionCount = await db.collection("session").countDocuments({ userId: userObjectId });
    const watchlistCount = await db.collection("watchlists").countDocuments({ userId });
    const alertCount = await db.collection("alerts").countDocuments({ userId });
    console.log("\n== 关联数据统计 ==");
    console.log(`session 数量：${sessionCount}`);
    console.log(`watchlist 数量：${watchlistCount}`);
    console.log(`alert 数量：${alertCount}`);
}

async function commandResetPassword(db, accountInput, newPassword) {
    if (!newPassword) {
        console.error("缺少新密码参数。");
        console.log(USAGE);
        return;
    }
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.ok) {
        console.error(passwordCheck.error);
        return;
    }
    const user = await findUserByAccount(db, accountInput);
    if (!user) return;

    const userObjectId = userIdObjectId(user);
    const credential = await db.collection("account").findOne({
        userId: userObjectId,
        providerId: "credential",
    });
    if (!credential) {
        console.error("未找到该用户的 credential 记录（providerId=credential）。");
        return;
    }

    // 使用与 Better Auth 1.3.25 完全一致的 scrypt 哈希函数
    const hashed = await hashPassword(newPassword);

    await db.collection("account").updateOne(
        { _id: credential._id },
        { $set: { password: hashed, updatedAt: new Date() } }
    );
    await db.collection("user").updateOne(
        { _id: user._id },
        { $set: { updatedAt: new Date() } }
    );
    const sessionResult = await db.collection("session").deleteMany({ userId: userObjectId });

    // 验证新哈希可用
    const stored = await db.collection("account").findOne({ _id: credential._id });
    const verified = await verifyPassword({ hash: stored.password, password: newPassword });

    console.log(`已重置账号 [${displayNameOf(user)}] 的密码。`);
    console.log(`已删除 ${sessionResult.deletedCount} 条 session（旧密码立即失效）。`);
    console.log(`新密码哈希校验：${verified ? "通过" : "失败"}`);
    console.log("PASSWORD HASH - NOT PLAINTEXT");
}

async function commandRename(db, accountInput, newAccountInput) {
    if (!newAccountInput) {
        console.error("缺少新账号参数。");
        console.log(USAGE);
        return;
    }
    const user = await findUserByAccount(db, accountInput);
    if (!user) return;

    const validation = validateAccount(newAccountInput);
    if (!validation.ok) {
        console.error(`新账号无效：${validation.error}`);
        return;
    }

    const duplicate = await db.collection("user").findOne({
        username: validation.normalized,
        _id: { $ne: user._id },
    });
    if (duplicate) {
        console.error("新账号已存在，无法重命名。");
        return;
    }

    const newEmail = generateInternalEmail(validation.normalized);
    await db.collection("user").updateOne(
        { _id: user._id },
        {
            $set: {
                username: validation.normalized,
                displayUsername: validation.display,
                name: validation.display,
                email: newEmail,
                updatedAt: new Date(),
            },
        }
    );

    console.log(`已将账号 [${displayNameOf(user)}] 重命名为 [${validation.display}]。`);
    console.log(`新登录账号（规范化）：${validation.normalized}`);
    console.log(`新显示名称：${validation.display}`);
    console.log(`新内部邮箱：${newEmail}`);
}

async function commandDelete(db, accountInput, args) {
    if (!args.includes("--yes")) {
        console.error("删除账号是高危操作，请追加 --yes 确认：");
        console.error(`  node scripts/admin-user.mjs delete ${accountInput} --yes`);
        return;
    }
    const user = await findUserByAccount(db, accountInput);
    if (!user) return;

    const userId = userIdOf(user);
    const userObjectId = userIdObjectId(user);

    const deletedUser = await db.collection("user").deleteMany({ _id: user._id });
    const deletedAccounts = await db.collection("account").deleteMany({ userId: userObjectId });
    const deletedSessions = await db.collection("session").deleteMany({ userId: userObjectId });
    const deletedWatchlists = await db.collection("watchlists").deleteMany({ userId });
    const deletedAlerts = await db.collection("alerts").deleteMany({ userId });

    console.log(`已删除账号 [${displayNameOf(user)}]（User ID: ${userId}）。`);
    console.log(`user: ${deletedUser.deletedCount}，account: ${deletedAccounts.deletedCount}，session: ${deletedSessions.deletedCount}，watchlist: ${deletedWatchlists.deletedCount}，alert: ${deletedAlerts.deletedCount}`);
}

async function main() {
    const [command, ...args] = process.argv.slice(2);

    if (!command) {
        console.log(USAGE);
        process.exit(0);
    }

    const { client, db } = await connect();
    try {
        switch (command) {
            case "list":
                await commandList(db);
                break;
            case "show":
                await commandShow(db, args[0]);
                break;
            case "reset-password":
                await commandResetPassword(db, args[0], args[1]);
                break;
            case "rename":
                await commandRename(db, args[0], args[1]);
                break;
            case "delete":
                await commandDelete(db, args[0], args);
                break;
            default:
                console.error(`未知命令：${command}`);
                console.log(USAGE);
        }
    } finally {
        await client.close().catch(() => {});
    }
}

await main();
