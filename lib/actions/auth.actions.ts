'use server';

import { getAuth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import {
    generateInternalEmail,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    validateAccount,
    validatePassword,
} from "@/lib/auth/account";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
    "User already exists.": "账号已存在",
    "User already exists. Use another email.": "账号已存在",
    "Username is already taken. Please try another.": "账号已存在",
    "Password is too short": `密码长度至少为 ${PASSWORD_MIN_LENGTH} 位`,
    "Password is too long": `密码长度最多为 ${PASSWORD_MAX_LENGTH} 位`,
    "Username is too short": "账号至少 2 个字符",
    "Username is too long": "账号最多 32 个字符",
    "Username is invalid": "账号格式不正确",
    "Invalid email": "账号格式不正确",
    "Invalid username or password": "账号或密码错误",
    "Invalid email or password": "账号或密码错误",
};

// 只把可理解的中文错误返回给浏览器；真实异常完整记录在服务端日志
function translateAuthError(error: unknown, fallback: string): string {
    const message = error instanceof Error ? error.message : "";
    return AUTH_ERROR_MESSAGES[message] ?? fallback;
}

export const signUpWithAccount = async ({ account, password }: SignUpFormData) => {
    try {
        const validation = validateAccount(account);
        if (!validation.ok) {
            return { success: false, error: validation.error };
        }
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.ok) {
            return { success: false, error: passwordCheck.error };
        }

        const internalEmail = generateInternalEmail(validation.normalized);

        const auth = await getAuth();
        const response = await auth.api.signUpEmail({
            body: {
                email: internalEmail,
                password,
                name: validation.display,
                // 登录唯一性判断永远使用归一化后的值
                username: validation.normalized,
                displayUsername: validation.display,
            },
        });

        return { success: true, data: response };
    } catch (error) {
        console.error("[signUpWithAccount] failed:", error);
        return { success: false, error: translateAuthError(error, "注册失败，请查看服务器日志") };
    }
};

export const signInWithAccount = async ({ account, password }: SignInFormData) => {
    try {
        const validation = validateAccount(account);
        if (!validation.ok) {
            return { success: false, error: validation.error };
        }

        const auth = await getAuth();
        const response = await auth.api.signInUsername({
            body: {
                username: validation.normalized,
                password,
            },
        });

        if (response?.user?.id) {
            try {
                const { connectToDatabase } = await import("@/database/mongoose");
                const { ObjectId } = await import("mongodb");
                const mongoose = await connectToDatabase();
                const db = mongoose.connection.db;
                if (db) {
                    // better-auth 的 user 集合以 ObjectId 作为 _id（适配器视图中的 id 字符串 = _id 的字符串形式）
                    await db.collection('user').updateOne(
                        { _id: new ObjectId(response.user.id) },
                        { $set: { lastActiveAt: new Date() } }
                    );
                }
            } catch (err) {
                console.error("Failed to update lastActiveAt", err);
            }
        }

        return { success: true, data: response };
    } catch (error) {
        console.error("[signInWithAccount] failed:", error);
        return { success: false, error: translateAuthError(error, "登录失败，请查看服务器日志") };
    }
};

export const signOut = async () => {
    try {
        const auth = await getAuth();
        await auth.api.signOut({ headers: await headers() });
    } catch (error) {
        console.error("[signOut] failed:", error);
        return { success: false, error: "退出登录失败，请重试" };
    }
};
