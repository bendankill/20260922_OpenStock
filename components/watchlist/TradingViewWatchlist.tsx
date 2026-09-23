"use client";

import React, { useEffect, useRef, memo } from 'react';
import { formatSymbolForTradingView } from '@/lib/utils';

interface TradingViewWatchlistProps {
    symbols: string[];
}

function TradingViewWatchlist({ symbols }: TradingViewWatchlistProps) {
    const container = useRef<HTMLDivElement>(null);
    const hasSymbols = symbols.length > 0;

    useEffect(() => {
        if (!container.current) return;

        // Clear previous widget if any (though React key usually handles this, safety check)
        container.current.innerHTML = "";

        // 空自选股时不加载 TradingView script，避免出现空白大黑块
        if (symbols.length === 0) return;

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js";
        script.type = "text/javascript";
        script.async = true;

        const symbolList = symbols.map(s => ({
            name: formatSymbolForTradingView(s),
            displayName: s
        }));

        script.innerHTML = JSON.stringify({
            "width": "100%",
            "height": 550,
            "symbolsGroups": [
                {
                    "name": "我的自选股",
                    "symbols": symbolList
                }
            ],
            "showSymbolLogo": true,
            "isTransparent": true,
            "colorTheme": "dark",
            "locale": "zh_CN"
        });

        container.current.appendChild(script);
    }, [symbols]);

    if (!hasSymbols) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 min-h-[220px] rounded-xl border border-white/10 bg-black/40 backdrop-blur-md px-6 text-center">
                <p className="text-lg font-medium text-gray-300">暂无自选股</p>
                <p className="text-sm text-gray-500">点击"添加股票"开始关注你感兴趣的股票。</p>
            </div>
        );
    }

    return (
        <div className="tradingview-widget-container border border-white/10 rounded-xl overflow-hidden shadow-2xl bg-black/40 backdrop-blur-md" ref={container}>
            <div className="tradingview-widget-container__widget"></div>
        </div>
    );
}

export default memo(TradingViewWatchlist);
