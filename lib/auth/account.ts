import { createHash } from "crypto";

export const ACCOUNT_MIN_LENGTH = 2;
export const ACCOUNT_MAX_LENGTH = 32;
export const PASSWORD_MIN_LENGTH = 2;
export const PASSWORD_MAX_LENGTH = 128;

// 只允许：Unicode 汉字 + 英文字母 + 数字
const ACCOUNT_PATTERN = /^[\p{Script=Han}A-Za-z0-9]+$/u;

export type AccountValidation =
    | { ok: true; account: string; normalized: string; display: string }
    | { ok: false; error: string };

// NFKC 归一化 + 英文字母转小写（登录唯一性判断用），中文保持原样
export function normalizeAccount(raw: string): string {
    return raw
        .normalize("NFKC")
        .replace(/[A-Z]/g, (char) => char.toLowerCase());
}

export function validateAccount(raw: string): AccountValidation {
    if (typeof raw !== "string" || raw.trim().length === 0) {
        return { ok: false, error: "账号不能为空" };
    }
    const account = raw.trim();
    const normalized = normalizeAccount(account);
    if (normalized.length < ACCOUNT_MIN_LENGTH) {
        return { ok: false, error: `账号至少 ${ACCOUNT_MIN_LENGTH} 个字符` };
    }
    if (normalized.length > ACCOUNT_MAX_LENGTH) {
        return { ok: false, error: `账号最多 ${ACCOUNT_MAX_LENGTH} 个字符` };
    }
    if (!ACCOUNT_PATTERN.test(normalized)) {
        return { ok: false, error: "账号只能包含中文、字母和数字，不能包含空格或符号" };
    }
    return { ok: true, account, normalized, display: account };
}

// 内部 synthetic email：SHA-256(normalizedAccount)，同一账号永远得到同一个值，
// 不暴露在 UI，不作为真实邮件地址使用。
export function generateInternalEmail(normalizedAccount: string): string {
    const digest = createHash("sha256")
        .update(normalizedAccount, "utf8")
        .digest("hex");
    return `${digest}@local.openstock.invalid`;
}

export type PasswordValidation =
    | { ok: true }
    | { ok: false; error: string };

// 只校验长度（2-128 位），不限制字符类型
export function validatePassword(raw: string): PasswordValidation {
    if (typeof raw !== "string" || raw.length < PASSWORD_MIN_LENGTH) {
        return { ok: false, error: `密码长度至少为 ${PASSWORD_MIN_LENGTH} 位` };
    }
    if (raw.length > PASSWORD_MAX_LENGTH) {
        return { ok: false, error: `密码长度最多为 ${PASSWORD_MAX_LENGTH} 位` };
    }
    return { ok: true };
}
