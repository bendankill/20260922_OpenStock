import React, { Suspense } from 'react';
import { getCurrentSession } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserWatchlist } from '@/lib/actions/watchlist.actions';
import { getUserAlerts } from '@/lib/actions/alert.actions';
import { getNews, searchStocks } from '@/lib/actions/finnhub.actions';
import WatchlistManager from '@/components/watchlist/WatchlistManager';
import AlertsPanel from '@/components/watchlist/AlertsPanel';
import NewsGrid from '@/components/watchlist/NewsGrid';
import SearchCommand from '@/components/SearchCommand';
import { Loader2 } from 'lucide-react';

export default async function WatchlistPage() {
    const session = await getCurrentSession(await headers());

    if (!session) {
        redirect('/sign-in');
    }

    const userId = session.user.id;

    // 核心数据：本地数据库，必须正常获取
    const [watchlistItems, alerts] = await Promise.all([
        getUserWatchlist(userId),
        getUserAlerts(userId),
    ]);

    const watchlistSymbols = watchlistItems.map((item: any) => item.symbol);

    // 可选数据：新闻与搜索热股，任何失败都降级为空，不影响页面主体
    let news: MarketNewsArticle[] = [];
    try {
        news = watchlistSymbols.length > 0 ? await getNews(watchlistSymbols) : await getNews();
    } catch (error) {
        console.error('自选股页新闻加载失败，已降级为空:', error);
        news = [];
    }

    let initialStocks: StockWithWatchlistStatus[] = [];
    try {
        initialStocks = await searchStocks();
    } catch {
        initialStocks = [];
    }

    return (
        <div className="min-h-screen bg-black text-gray-100 p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                        自选股
                    </h1>
                    <p className="text-gray-500 mt-1">跟踪你关注的股票并管理提醒。</p>
                </div>
                <div className="flex items-center space-x-4">
                    <SearchCommand renderAs="button" label="添加股票" initialStocks={initialStocks} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content - Watchlist Table */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="space-y-6">
                        <WatchlistManager initialItems={watchlistItems} userId={userId} />
                    </div>

                    {/* News Section */}
                    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-500" /></div>}>
                        <NewsGrid news={news || []} />
                    </Suspense>
                </div>

                {/* Sidebar - Alerts */}
                <div className="lg:col-span-1">
                    <AlertsPanel alerts={alerts} />
                </div>
            </div>
        </div>
    );
}
