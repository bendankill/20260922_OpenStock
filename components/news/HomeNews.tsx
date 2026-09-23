import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ExternalLink } from "lucide-react";

const HomeNews = ({ news }: { news: MarketNewsArticle[] }) => {
    if (!news || news.length === 0) {
        return (
            <div className="flex h-full flex-col rounded-xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
                <h3 className="mb-4 text-2xl font-semibold text-gray-100">市场新闻</h3>
                <div className="flex flex-1 items-center justify-center rounded-lg border border-gray-800 bg-gray-900/30 py-10">
                    <p className="text-sm text-gray-500">暂无市场新闻</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col rounded-xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
            <h3 className="mb-4 text-2xl font-semibold text-gray-100">市场新闻</h3>
            <ul className="flex flex-col gap-4">
                {news.map((item, idx) => (
                    <li key={`${item.id}-${idx}`}>
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block rounded-lg border border-gray-800 bg-gray-900/30 p-4 transition-colors hover:border-gray-600"
                        >
                            <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-200 transition-colors group-hover:text-teal-400">
                                {item.translatedHeadline ?? item.headline}
                            </h4>
                            {item.summary ? (
                                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-gray-500">
                                    {item.translatedSummary ?? item.summary}
                                </p>
                            ) : null}
                            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-600">
                                <span>{item.source}</span>
                                <span className="flex items-center gap-1">
                                    {item.datetime
                                        ? formatDistanceToNow(item.datetime * 1000, {
                                              addSuffix: true,
                                              locale: zhCN,
                                          })
                                        : ""}
                                    <ExternalLink className="h-3 w-3" />
                                </span>
                            </div>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default HomeNews;
