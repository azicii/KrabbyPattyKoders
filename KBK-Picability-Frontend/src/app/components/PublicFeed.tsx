import { ArrowLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export interface PublicFeedItem {
    id: number;
    habitName: string;
    habitIcon: string;
    color: string;
    currentCount: number;
    isActive: boolean;
    friendName: string;
    partnerName: string;
    completedToday: boolean;
    failedToday: boolean;
    killedBy?: string;
}

interface PublicFeedProps {
    isDark: boolean;
    items: PublicFeedItem[];
    onBack: () => void;
}

const getStreakReward = (count: number) => {
    if (count >= 1000) return "🚀🌟";
    if (count >= 500) return "🌋";
    if (count >= 400) return "🐉";
    if (count >= 300) return "💎";
    if (count >= 200) return "👑";
    if (count >= 150) return "🏆";
    if (count >= 100) return "☄️";
    if (count >= 80) return "🌶️";
    if (count >= 50) return "💥";
    if (count >= 30) return "⚡";
    if (count >= 20) return "🔥";
    if (count >= 10) return "✨";
    if (count >= 5) return "💨";
    if (count >= 3) return "💧";
    if (count >= 1) return "🧊";

    return null;
};

export function PublicFeed({ isDark, items, onBack }: PublicFeedProps) {
    return (
        <div className={`min-h-screen p-6 transition-colors duration-300 ${isDark
                ? 'bg-gradient-to-br from-slate-900 to-slate-800'
                : 'bg-gradient-to-br from-slate-50 to-slate-100'
            }`}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className={`text-2xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'
                        }`}>
                        Friend Flex Feed
                    </h1>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                        Public streaks completed or broken today
                    </p>
                </div>

                <button
                    onClick={onBack}
                    className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white'
                        }`}
                >
                    <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-700'
                        }`} />
                </button>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
                {items.length === 0 && (
                    <div className={`rounded-3xl p-8 text-center shadow-sm ${isDark ? 'bg-slate-800/50 text-slate-300' : 'bg-white text-slate-700'
                        }`}>
                        <div className="text-5xl mb-4">👀</div>
                        <h2 className="text-xl font-bold mb-2">Nothing to flex yet</h2>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                            When your friends complete public streaks today, they’ll show up here.
                        </p>
                    </div>
                )}

                {items.map((item, index) => {
                    const IconComponent = (LucideIcons as any)[item.habitIcon] || LucideIcons.Target;
                    const rewardEmoji = getStreakReward(item.currentCount);

                    return (
                        <div
                            key={`${item.id}-${item.friendName}-${index}`}
                            className={`relative w-full rounded-3xl p-6 shadow-sm border transition-all ${isDark
                                    ? 'bg-slate-800/50 border-slate-700/60'
                                    : 'bg-white border-slate-200'
                                }`}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${item.failedToday ? 'from-slate-500 to-slate-700' : item.color
                                        } shadow-lg`}>
                                        <IconComponent className="w-8 h-8 text-white" />
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'
                                                }`}>
                                                {item.habitName}
                                            </h3>

                                            {rewardEmoji && (
                                                <span className={`px-2 py-1 rounded-full text-sm ${isDark ? 'bg-slate-700/60' : 'bg-slate-100'
                                                    }`}>
                                                    {rewardEmoji}
                                                </span>
                                            )}
                                        </div>

                                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'
                                            }`}>
                                            {item.friendName} with {item.partnerName}
                                        </p>

                                        <p className={`text-sm font-bold mt-2 ${item.failedToday ? 'text-rose-400' : 'text-emerald-400'
                                            }`}>
                                            {item.failedToday
                                                ? `Streak died${item.killedBy ? ` — killed by ${item.killedBy}` : ''}`
                                                : 'Completed today'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className={`text-3xl font-bold ${item.failedToday
                                            ? 'text-slate-500'
                                            : `bg-gradient-to-br ${item.color} bg-clip-text text-transparent`
                                        }`}>
                                        {item.currentCount}
                                    </div>
                                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'
                                        }`}>
                                        {item.currentCount === 1 ? 'day' : 'days'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}