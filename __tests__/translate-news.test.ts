import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    isMostlyChinese,
    parseTranslationResponse,
    mergeTranslations,
    translateNewsUncached,
} from "@/lib/news/translate-news";

const sampleNews: MarketNewsArticle[] = [
    {
        id: 1,
        headline: "Apple Shares Rise After Strong iPhone Demand",
        summary: "Apple stock climbed as iPhone demand beat expectations.",
        source: "Reuters",
        url: "https://example.com/1",
        datetime: 1750000000,
        category: "company",
        related: "AAPL",
    },
    {
        id: 2,
        headline: "Oil Prices Fall Amid Supply Concerns",
        summary: "Crude futures dropped on rising inventories.",
        source: "Yahoo",
        url: "https://example.com/2",
        datetime: 1750000100,
        category: "general",
        related: "",
    },
];

function mockGeminiResponse(text: string) {
    return new Response(
        JSON.stringify({
            candidates: [{ content: { parts: [{ text }] } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
    );
}

describe("isMostlyChinese", () => {
    it("英文返回 false", () => {
        expect(isMostlyChinese("Apple Shares Rise")).toBe(false);
    });

    it("中文为主返回 true", () => {
        expect(isMostlyChinese("苹果股价上涨，iPhone 需求强劲")).toBe(true);
    });

    it("空字符串返回 false", () => {
        expect(isMostlyChinese("")).toBe(false);
    });
});

describe("parseTranslationResponse", () => {
    it("解析严格 JSON 数组", () => {
        const result = parseTranslationResponse(
            '[{"id":"1","translatedHeadline":"中文标题","translatedSummary":"中文摘要"}]'
        );
        expect(result).toHaveLength(1);
        expect(result?.[0].translatedHeadline).toBe("中文标题");
    });

    it("剥离 markdown 围栏", () => {
        const result = parseTranslationResponse(
            '```json\n[{"id":"1","translatedHeadline":"中文标题","translatedSummary":"中文摘要"}]\n```'
        );
        expect(result?.[0].translatedHeadline).toBe("中文标题");
    });

    it("截取包裹文本中的数组", () => {
        const result = parseTranslationResponse(
            '好的，翻译结果如下：[{"id":"1","translatedHeadline":"中文标题","translatedSummary":"中文摘要"}] 希望对你有帮助'
        );
        expect(result?.[0].translatedSummary).toBe("中文摘要");
    });

    it("非法 JSON 返回 null", () => {
        expect(parseTranslationResponse("not json at all")).toBeNull();
        expect(parseTranslationResponse("")).toBeNull();
        expect(parseTranslationResponse('{"id":"1"}')).toBeNull();
    });

    it("非数组返回 null", () => {
        expect(parseTranslationResponse('{"id":"1","translatedHeadline":"x"}')).toBeNull();
    });
});

describe("mergeTranslations", () => {
    it("按 id 合并，缺失条目保留原文", () => {
        const merged = mergeTranslations(sampleNews, [
            { id: "1", translatedHeadline: "中文标题1", translatedSummary: "中文摘要1" },
        ]);
        expect(merged[0].translatedHeadline).toBe("中文标题1");
        expect(merged[0].headline).toBe("Apple Shares Rise After Strong iPhone Demand");
        expect(merged[1].translatedHeadline).toBeUndefined();
    });

    it("空翻译结果返回原文", () => {
        expect(mergeTranslations(sampleNews, [])).toEqual(sampleNews);
        expect(mergeTranslations(sampleNews, null)).toEqual(sampleNews);
    });

    it("不修改原始 url", () => {
        const merged = mergeTranslations(sampleNews, [
            { id: "1", translatedHeadline: "中文标题1", translatedSummary: "中文摘要1" },
        ]);
        expect(merged[0].url).toBe("https://example.com/1");
        expect(merged[1].url).toBe("https://example.com/2");
    });
});

describe("translateNewsUncached", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        delete process.env.GEMINI_API_KEY;
    });

    it("无 GEMINI_API_KEY：返回原文且不发起请求", async () => {
        delete process.env.GEMINI_API_KEY;
        const out = await translateNewsUncached(sampleNews);
        expect(out).toEqual(sampleNews);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("空新闻直接返回", async () => {
        process.env.GEMINI_API_KEY = "test-key";
        expect(await translateNewsUncached([])).toEqual([]);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("批量翻译：一次请求处理多条并合并", async () => {
        process.env.GEMINI_API_KEY = "test-key";
        const fetchMock = vi.mocked(fetch);
        fetchMock.mockResolvedValue(
            mockGeminiResponse(
                JSON.stringify([
                    { id: "1", translatedHeadline: "中文标题1", translatedSummary: "中文摘要1" },
                    { id: "2", translatedHeadline: "中文标题2", translatedSummary: "中文摘要2" },
                ])
            )
        );

        const out = await translateNewsUncached(sampleNews);
        expect(fetch).toHaveBeenCalledTimes(1);

        const [url, init] = fetchMock.mock.calls[0];
        expect(String(url)).toContain("generativelanguage.googleapis.com");
        const body = JSON.parse(String(init?.body));
        const promptText = body.contents[0].parts[0].text;
        expect(promptText).toContain('"1"');
        expect(promptText).toContain('"2"');

        expect(out[0].translatedHeadline).toBe("中文标题1");
        expect(out[1].translatedSummary).toBe("中文摘要2");
    });

    it("已以中文为主的新闻跳过翻译", async () => {
        process.env.GEMINI_API_KEY = "test-key";
        const chineseNews: MarketNewsArticle[] = [
            {
                ...sampleNews[0],
                headline: "苹果股价上涨",
                summary: "iPhone 需求强劲，苹果股价上涨。",
            },
        ];
        const out = await translateNewsUncached(chineseNews);
        expect(out).toEqual(chineseNews);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("Gemini 返回非法 JSON：全部回退原文", async () => {
        process.env.GEMINI_API_KEY = "test-key";
        vi.mocked(fetch).mockResolvedValue(mockGeminiResponse("这不是JSON"));

        const out = await translateNewsUncached(sampleNews);
        expect(out).toEqual(sampleNews);
    });

    it("部分条目缺失：缺失条目保留原文", async () => {
        process.env.GEMINI_API_KEY = "test-key";
        vi.mocked(fetch).mockResolvedValue(
            mockGeminiResponse(
                JSON.stringify([
                    { id: "1", translatedHeadline: "中文标题1", translatedSummary: "中文摘要1" },
                ])
            )
        );

        const out = await translateNewsUncached(sampleNews);
        expect(out[0].translatedHeadline).toBe("中文标题1");
        expect(out[1].translatedHeadline).toBeUndefined();
    });

    it("Gemini API 报错：回退原文", async () => {
        process.env.GEMINI_API_KEY = "test-key";
        vi.mocked(fetch).mockResolvedValue(
            new Response("unauthorized", { status: 403 })
        );

        const out = await translateNewsUncached(sampleNews);
        expect(out).toEqual(sampleNews);
    });
});
