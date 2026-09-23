import { describe, it, expect } from "vitest";
import {
    normalizeAccount,
    validateAccount,
    validatePassword,
    generateInternalEmail,
    ACCOUNT_MIN_LENGTH,
    ACCOUNT_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH,
} from "@/lib/auth/account";

describe("normalizeAccount", () => {
    it("英文转小写", () => {
        expect(normalizeAccount("Alice")).toBe("alice");
        expect(normalizeAccount("ALICE")).toBe("alice");
        expect(normalizeAccount("AlIcE")).toBe("alice");
    });

    it("中文保持原样", () => {
        expect(normalizeAccount("测试账号")).toBe("测试账号");
        expect(normalizeAccount("用户01")).toBe("用户01");
    });

    it("数字保持原样", () => {
        expect(normalizeAccount("12345")).toBe("12345");
    });

    it("NFKC 归一化：全角字母转半角", () => {
        expect(normalizeAccount("ＡＬＩＣＥ")).toBe("alice");
        expect(normalizeAccount("ＡＢ")).toBe("ab");
    });

    it("混合账号：英文小写、中文与数字保持", () => {
        expect(normalizeAccount("用户AbC01")).toBe("用户abc01");
    });
});

describe("validateAccount", () => {
    it("1 位账号拒绝", () => {
        const result = validateAccount("A");
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain(`至少 ${ACCOUNT_MIN_LENGTH}`);
        }
    });

    it("2 位账号成功", () => {
        expect(validateAccount("ab").ok).toBe(true);
        expect(validateAccount("测试").ok).toBe(true);
        expect(validateAccount("12").ok).toBe(true);
    });

    it("32 位账号成功", () => {
        expect(validateAccount("a".repeat(ACCOUNT_MAX_LENGTH)).ok).toBe(true);
    });

    it("33 位账号拒绝", () => {
        const result = validateAccount("a".repeat(ACCOUNT_MAX_LENGTH + 1));
        expect(result.ok).toBe(false);
    });

    it("特殊字符账号拒绝", () => {
        for (const bad of ["Alice@", "abc_def", "张 三", "a-b", "a.b", "alice!", " ", "Ａ＠B"]) {
            expect(validateAccount(bad).ok, `应拒绝: ${bad}`).toBe(false);
        }
    });

    it("首尾空白被 trim", () => {
        const result = validateAccount("  Alice  ");
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.normalized).toBe("alice");
            expect(result.display).toBe("Alice");
        }
    });

    it("空账号拒绝", () => {
        expect(validateAccount("").ok).toBe(false);
        expect(validateAccount("   ").ok).toBe(false);
    });
});

describe("validatePassword", () => {
    it("1 位拒绝", () => {
        for (const pw of ["1", "a", "中"]) {
            const result = validatePassword(pw);
            expect(result.ok, `应拒绝: ${pw}`).toBe(false);
            if (!result.ok) {
                expect(result.error).toContain(`至少为 ${PASSWORD_MIN_LENGTH}`);
            }
        }
    });

    it("2 位接受（任意字符类型）", () => {
        for (const pw of ["12", "aa", "中文", "a1", "!@", "中1"]) {
            expect(validatePassword(pw).ok, `应接受: ${pw}`).toBe(true);
        }
    });

    it("超过 128 位拒绝", () => {
        const result = validatePassword("a".repeat(PASSWORD_MAX_LENGTH + 1));
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain(`最多为 ${PASSWORD_MAX_LENGTH}`);
        }
    });

    it("128 位接受", () => {
        expect(validatePassword("a".repeat(PASSWORD_MAX_LENGTH)).ok).toBe(true);
    });
});

describe("generateInternalEmail", () => {
    it("同一账号永远产生同一内部邮箱", () => {
        const first = generateInternalEmail(normalizeAccount("Alice"));
        const second = generateInternalEmail(normalizeAccount("Alice"));
        expect(first).toBe(second);
    });

    it("格式为 sha256@local.openstock.invalid", () => {
        const email = generateInternalEmail("alice");
        expect(email).toMatch(/^[0-9a-f]{64}@local\.openstock\.invalid$/);
    });

    it("不同账号产生不同邮箱", () => {
        expect(generateInternalEmail("alice")).not.toBe(generateInternalEmail("bob"));
    });

    it("大小写不同的同一账号产生同一邮箱", () => {
        expect(generateInternalEmail(normalizeAccount("Alice"))).toBe(
            generateInternalEmail(normalizeAccount("alice"))
        );
    });
});
