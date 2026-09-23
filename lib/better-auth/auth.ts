import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { username } from "better-auth/plugins";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";
import { sendPasswordResetEmail } from "@/lib/nodemailer/reset-password";
import {
    ACCOUNT_MIN_LENGTH,
    ACCOUNT_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH,
    normalizeAccount,
    validateAccount,
} from "@/lib/auth/account";

// better-auth 1.3.25 的动态 plugin 端点（signInUsername 等）无法通过
// ReturnType<typeof betterAuth> 完整推断，这里使用宽松类型；
// 所有调用均经过运行时验证。
type AuthRuntime = any;

let authInstance: AuthRuntime | null = null;
let authPromise: Promise<AuthRuntime> | null = null;

async function createAuthRuntime(): Promise<AuthRuntime> {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection;
    const database = db.db;

    if (!db || !database) {
        throw new Error("MongoDB connection not found!");
    }

    return betterAuth({
        database: mongodbAdapter(database),
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL,
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: PASSWORD_MIN_LENGTH,
            maxPasswordLength: PASSWORD_MAX_LENGTH,
            autoSignIn: true,
            sendResetPassword: async ({ user, url }) => {
                void sendPasswordResetEmail({
                    email: user.email,
                    name: user.name,
                    resetUrl: url,
                }).catch((error) => {
                    console.error('Failed to queue password reset email:', error);
                });
            },
        },
        plugins: [
            nextCookies(),
            username({
                minUsernameLength: ACCOUNT_MIN_LENGTH,
                maxUsernameLength: ACCOUNT_MAX_LENGTH,
                // 校验与唯一性判断都基于归一化后的值，避免大小写边界问题
                validationOrder: {
                    username: "post-normalization",
                },
                // NFKC 归一化 + 英文字母转小写，中文保持原样
                usernameNormalization: (raw) => normalizeAccount(raw),
                usernameValidator: (value) => {
                    const result = validateAccount(value);
                    return result.ok;
                },
            }),
        ],
    });
}

// Lazy runtime initialization：数据库连接只发生在真正运行时调用时，
// 不会发生在 module import / npm run build / Docker build 阶段。
export const getAuth = async (): Promise<AuthRuntime> => {
    if (authInstance) {
        return authInstance;
    }

    if (!authPromise) {
        authPromise = createAuthRuntime()
            .then((instance) => {
                authInstance = instance;
                return instance;
            })
            .catch((error) => {
                authPromise = null;
                throw error;
            });
    }

    return authPromise;
};

// 供 server component（layout/page）读取会话：数据库不可用时降级为 null，
// 保证 Docker build / 页面收集阶段不因数据库离线而失败。
export const getCurrentSession = async (requestHeaders: Headers) => {
    try {
        const auth = await getAuth();
        return await auth.api.getSession({ headers: requestHeaders });
    } catch (error) {
        console.error("[auth] getSession failed:", error);
        return null;
    }
};
