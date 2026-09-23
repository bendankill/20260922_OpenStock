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

let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = async () => {
    if (authInstance) {
        return authInstance;
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection;
    const database = db.db;

    if (!db || !database) {
        throw new Error("MongoDB connection not found!");
    }

    authInstance = betterAuth({
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
                // NFKC 归一化 + 英文字母转小写，中文保持原样
                usernameNormalization: (raw) => normalizeAccount(raw),
                usernameValidator: (raw) => {
                    const result = validateAccount(raw);
                    return result.ok;
                },
            }),
        ],
    });

    return authInstance;
};

export const auth = await getAuth();
