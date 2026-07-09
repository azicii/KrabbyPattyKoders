import { ArrowLeft, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { createPortal } from 'react-dom';

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
    reactionType?: string;
    reactionEmoji?: string;
    reactionCount?: number;
    currentUserReacted?: boolean;
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
    const [feedItems, setFeedItems] = useState<PublicFeedItem[]>(items);
    const [reactionModal, setReactionModal] = useState<any | null>(null);

    const BASE_URL = 'https://kbk-picability-backend.onrender.com';

    const getToken = () => {
        const savedUser = localStorage.getItem('picabilityUser');
        return savedUser ? JSON.parse(savedUser).token : null;
    };

    useEffect(() => {
        setFeedItems(items);
    }, [items]);

    const handleReact = async (streakId: number) => {
        const token = getToken();

        const response = await fetch(`${BASE_URL}/api/Streaks/${streakId}/react`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) return;

        const data = await response.json();

        setFeedItems(prev =>
            prev.map(item =>
                item.id === streakId
                    ? {
                        ...item,
                        reactionCount: data.reactionCount,
                        currentUserReacted: data.reacted,
                        reactionType: data.reactionType,
                        reactionEmoji: data.reactionEmoji
                    }
                    : item
            )
        );
    };

    const openReactionList = async (streakId: number) => {
        const token = getToken();

        const response = await fetch(`${BASE_URL}/api/Streaks/${streakId}/reactions`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) return;

        const data = await response.json();
        setReactionModal(data);
    };

    return (
        <div className={`min-h-screen p-6 transition-colors duration-300 ${isDark
                ? 'bg-gradient-to-br from-slate-900 to-slate-800'
                : 'bg-gradient-to-br from-slate-50 to-slate-100'
            }`}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className={`text-2xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'
                        }`}>
                        Friend Feed
                    </h1>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                        Public streaks from friends!
                    </p>
                </div>

                <button
                    onClick={onBack}
                    className={`hidden md:flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white'
                        }`}
                >
                    <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-700'
                        }`} />
                </button>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
                {feedItems.length === 0 && (
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

                {feedItems.map((item, index) => {
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
                                <div className="flex items-start gap-4 min-w-0 flex-1">
                                    <div
                                        className={`flex items-center justify-center
                                            w-16 h-16
                                            min-w-[4rem]
                                            min-h-[4rem]
                                            shrink-0
                                            rounded-2xl
                                            bg-gradient-to-br
                                            ${item.failedToday ? 'from-slate-500 to-slate-700' : item.color}
                                            shadow-lg`}
                                    >
                                        <IconComponent className="w-8 h-8 text-white" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start gap-2 min-w-0">
                                            <h3
                                                className={`text-lg font-semibold
                                                    leading-tight
                                                    whitespace-normal
                                                    break-words
                                                    min-w-0
                                                    ${isDark ? 'text-slate-100' : 'text-slate-800'}`}
                                            >
                                                {item.habitName}
                                            </h3>

                                            {rewardEmoji && (
                                                <span className={`shrink-0 px-2 py-1 rounded-full text-sm leading-none ${isDark ? 'bg-slate-700/60' : 'bg-slate-100'
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

                                <div className="flex flex-col items-center shrink-0 w-[64px]">
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

                            <div className="mt-4 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleReact(item.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${item.currentUserReacted
                                            ? item.failedToday
                                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                                : 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                                            : isDark
                                                ? 'bg-slate-700/40 text-slate-300 border-slate-600 hover:bg-slate-700'
                                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                        }`}
                                >
                                    {item.failedToday
                                        ? item.currentUserReacted ? '💔 Heartbroken' : '💔 Heartbreak'
                                        : item.currentUserReacted ? '👊' : '👊'}
                                </button>

                                {(item.reactionCount || 0) > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => openReactionList(item.id)}
                                        className={`text-sm font-semibold underline-offset-4 hover:underline ${isDark ? 'text-slate-400' : 'text-slate-500'
                                            }`}
                                    >
                                        {item.reactionEmoji || (item.failedToday ? '💔' : '👊')} {item.reactionCount}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {reactionModal && createPortal(
                <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${isDark
                            ? 'bg-slate-900 border-slate-700 text-slate-100'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">
                                {reactionModal.reactionEmoji} Reactions
                            </h2>

                            <button
                                onClick={() => setReactionModal(null)}
                                className={`p-2 rounded-xl ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                                    }`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {reactionModal.users.length === 0 ? (
                                <p className="text-sm text-slate-500">No reactions yet.</p>
                            ) : (
                                reactionModal.users.map((user: any) => (
                                    <div
                                        key={user.userId}
                                        className={`p-3 rounded-2xl font-semibold ${isDark ? 'bg-slate-800' : 'bg-slate-100'
                                            }`}
                                    >
                                        {user.userName}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}