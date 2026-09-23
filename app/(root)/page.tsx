import TradingViewWidget from "@/components/TradingViewWidget";
import HomeNews from "@/components/news/HomeNews";
import { getNews } from "@/lib/actions/finnhub.actions";
import { translateNewsBatch } from "@/lib/news/translate-news";
import {
    HEATMAP_WIDGET_CONFIG,
    MARKET_DATA_WIDGET_CONFIG,
    MARKET_OVERVIEW_WIDGET_CONFIG
} from "@/lib/constants";

const Home = async () => {
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    // 新闻是可选增强：Finnhub / Gemini 任一失败都降级为空或英文原文，绝不影响页面主体
    let news: MarketNewsArticle[] = [];
    try {
        news = await getNews();
        news = await translateNewsBatch(news);
    } catch (error) {
        console.error('首页新闻加载失败，已降级:', error);
        news = [];
    }

    return (
        <div className="flex min-h-screen home-wrapper">
            <section className="grid w-full gap-8 home-section">
                <div className="md:col-span-1 xl:col-span-1">
                    <TradingViewWidget
                        title="市场概览"
                        scriptUrl={`${scriptUrl}market-overview.js`}
                        config={MARKET_OVERVIEW_WIDGET_CONFIG}
                        className="custom-chart"
                        height={600}
                    />
                </div>
                <div className="md-col-span xl:col-span-2">
                    <TradingViewWidget
                        title="股票热力图"
                        scriptUrl={`${scriptUrl}stock-heatmap.js`}
                        config={HEATMAP_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
            </section>
            <section className="grid w-full gap-8 home-section">
                <div className="h-full md:col-span-1 xl:col-span-2">
                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}market-quotes.js`}
                        config={MARKET_DATA_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
                <div className="h-full md:col-span-1 xl:col-span-1">
                    <HomeNews news={news} />
                </div>

            </section>
        </div>
    )
}

export default Home;
