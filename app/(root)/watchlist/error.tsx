'use client';

export default function WatchlistError({
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
            <h2 className="text-2xl font-bold text-white">自选股加载失败</h2>
            <p className="text-gray-400">请重试</p>
            <button
                onClick={() => reset()}
                className="rounded-lg bg-teal-500 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-teal-600"
            >
                重试
            </button>
        </div>
    );
}
