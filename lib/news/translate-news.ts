import { createHash } from "crypto";
import { callAIProvider } from "@/lib/ai-provider";

const TRANSLATION_TIMEOUT_MS = 10_000;
const MAX_BATCH_SIZE = 6;
const CACHE_REVALIDATE_SECONDS = 6 * 60 * 60; // 6 小时

// 只记录一次，避免反复刷日志
let unavailableLogged = false;

const TRANSLATION_PROMPT = `你是一名财经新闻翻译助手。
请将以下英文财经新闻翻译为简体中文。

要求：
- 保持原意
- 不添加信息
- 不做投资建议
- 公司名称可保留常用英文品牌名
- 股票代码不翻译
- 数字、百分比、货币保持原样
- headline 翻译成简洁中文标题
- summary 翻译成自然中文摘要

返回严格 JSON（不要 markdown 代码块），格式为数组：
[
  { "id": "原文id", "translatedHeadline": "中文标题", "translatedSummary": "中文摘要" }
]`;

type TranslationItem = {
    id: string;
    translatedHeadline?: string;
    translatedSummary?: string;
};

// 简单判断文本是否已以中文为主
export function isMostlyChinese(text: string): boolean {
    if (!text) return false;
    const han = (text.match(/[一-鿿]/g) || []).length;
    if (han === 0) return false;
    const latin = (text.match(/[A-Za-z]/g) || []).length;
    return han > latin;
}

// JSON 解析容错：剥离可能的 markdown 围栏，只提取数组部分
export function parseTranslationResponse(raw: string): TranslationItem[] | null {
    if (!raw) return null;

    let candidate = raw.trim();
    if (candidate.startsWith("```")) {
        const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fenced?.[1]) {
            candidate = fenced[1].trim();
        }
    }

    // 若模型包裹了额外说明，尝试截取第一个 [ 到最后一个 ]
    const arrayStart = candidate.indexOf("[");
    const arrayEnd = candidate.lastIndexOf("]");
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
        candidate = candidate.slice(arrayStart, arrayEnd + 1);
    }

    try {
        const parsed = JSON.parse(candidate);
        if (!Array.isArray(parsed)) return null;
        return parsed.filter(
            (item): item is TranslationItem =>
                item && typeof item === "object" && typeof item.id === "string"
        );
    } catch {
        return null;
    }
}

// 将翻译结果合并回原始新闻，逐条独立 fallback
export function mergeTranslations(
    news: MarketNewsArticle[],
    translations: TranslationItem[] | null
): MarketNewsArticle[] {
    if (!translations || translations.length === 0) return news;

    const map = new Map<string, TranslationItem>();
    for (const item of translations) {
        if (item.translatedHeadline || item.translatedSummary) {
            map.set(item.id, item);
        }
    }

    return news.map((article) => {
        const translated = map.get(String(article.id));
        if (!translated) return article;
        return {
            ...article,
            translatedHeadline: translated.translatedHeadline ?? article.translatedHeadline,
            translatedSummary: translated.translatedSummary ?? article.translatedSummary,
        };
    });
}

async function callGeminiTranslate(
    batch: Array<{ id: string; headline: string; summary: string }>
): Promise<TranslationItem[] | null> {
    const prompt = `${TRANSLATION_PROMPT}\n\n输入：\n${JSON.stringify(batch)}`;

    const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), TRANSLATION_TIMEOUT_MS);
    });

    const requestPromise = (async () => {
        try {
            const raw = await callAIProvider(prompt);
            return parseTranslationResponse(raw);
        } catch (error) {
            console.error("News translation request failed:", error);
            return null;
        }
    })();

    return await Promise.race([requestPromise, timeoutPromise]);
}

// 未缓存的核心翻译逻辑（导出以便单元测试）
export async function translateNewsUncached(news: MarketNewsArticle[]): Promise<MarketNewsArticle[]> {
    if (!news || news.length === 0) return news ?? [];

    if (!process.env.GEMINI_API_KEY) {
        if (!unavailableLogged) {
            unavailableLogged = true;
            console.log("News translation unavailable, using original text");
        }
        return news;
    }

    // 跳过空标题或已经以中文为主的新闻
    const targets = news.filter(
        (n) =>
            n.headline &&
            n.summary &&
            !isMostlyChinese(n.headline) &&
            !isMostlyChinese(n.summary)
    );
    if (targets.length === 0) return news;

    // 批量翻译：一次请求最多 MAX_BATCH_SIZE 条，避免逐条串行调用
    const batch = targets.slice(0, MAX_BATCH_SIZE).map((n) => ({
        id: String(n.id),
        headline: n.headline,
        summary: n.summary,
    }));

    const translations = await callGeminiTranslate(batch);
    if (!translations) {
        console.error("News translation failed, using original text");
        return news;
    }

    return mergeTranslations(news, translations);
}

function newsCacheKey(news: MarketNewsArticle[]): string {
    const payload = news
        .map((n) => [n.id, n.headline, n.summary, n.url].join("|"))
        .join("~~");
    return createHash("sha256").update(payload, "utf8").digest("hex");
}

// 统一新闻翻译入口：带 6 小时缓存，失败/超时/无 Key 时均安全降级为原文
export async function translateNewsBatch(
    news: MarketNewsArticle[]
): Promise<MarketNewsArticle[]> {
    if (!news || news.length === 0) return news ?? [];

    // 延迟加载 next/cache，避免在测试等非 Next 环境中 import 失败
    const { unstable_cache } = await import("next/cache");
    const cached = unstable_cache(
        async () => translateNewsUncached(news),
        ["news-translation", newsCacheKey(news)],
        { revalidate: CACHE_REVALIDATE_SECONDS }
    );
    return cached();
}
