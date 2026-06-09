import { Users, Sun, Moon, Plus, CheckCircle2, ChevronDown, LogOut, Mail, Check, X, Clock, Trash2, ImageIcon, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import * as LucideIcons from 'lucide-react';

interface Streak {
    id: number;
    habitName: string;
    habitIcon: string;
    userName: string;
    userAvatar: string;
    streakCount: number;
    color: string;
    lastCompletedAt?: string;
    lastFullyCompletedAt?: string;
    userOneLastCheckedInAt?: string;
    userTwoLastCheckedInAt?: string;
    userCheckedInToday?: boolean;
    partnerCheckedInToday?: boolean;
    bothCheckedInToday?: boolean;
    isActive?: boolean;
    canCheckInToday?: boolean;
    hoursUntilMidnight?: number;
    brokenMessage?: string;
    timeMessage?: string;
    hasUnreadMessage?: boolean;
    hasUnreadPhoto?: boolean;
    partnerId?: string;
}

export type { Streak };

interface StreakTrackerProps {
    isDark: boolean;
    user: any;
    onLogout: () => void;
    onToggleDark: () => void;
    onFriends?: () => void;
    onAddHabit?: () => void;
    onStreakTap?: (streakId: number) => void;
    onDismissStreak?: (streakId: number) => void;
    streaks: Streak[];
    streakInvites?: any[];
    sentStreakRequests?: any[];
    onAcceptInvite?: (id: number) => void;
    onRejectInvite?: (id: number) => void;
    onRestartStreak?: (streak: Streak) => void;
    pendingFriendRequestCount?: number;
}

export function StreakTracker({
    isDark,
    user,
    onLogout,
    onToggleDark,
    onFriends,
    onAddHabit,
    onStreakTap,
    onDismissStreak,
    streaks,
    streakInvites = [],
    sentStreakRequests = [],
    onAcceptInvite,
    onRestartStreak,
    pendingFriendRequestCount = 0,
    onRejectInvite
}: StreakTrackerProps) {
    const [expandedStreakId, setExpandedStreakId] = useState<number | null>(null);
    const [showInvites, setShowInvites] = useState(false);
    const [acceptedIds, setAcceptedIds] = useState<number[]>([]);
    const [checkInModalStreak, setCheckInModalStreak] = useState<Streak | null>(null);
    const [checkInMode, setCheckInMode] = useState<'options' | 'message' | 'photo'>('options');
    const [checkInMessage, setCheckInMessage] = useState('');
    const [selectedPhotoName, setSelectedPhotoName] = useState('');

    const handleStreakClick = (streakId: number) => {
        setExpandedStreakId(expandedStreakId === streakId ? null : streakId);
    };

    const openCheckInModal = (streak: Streak, e: React.MouseEvent) => {
        e.stopPropagation();
        setCheckInModalStreak(streak);
        setCheckInMode('options');
        setCheckInMessage('');
        setSelectedPhotoName('');
    };

    const closeCheckInModal = () => {
        setCheckInModalStreak(null);
        setCheckInMode('options');
        setCheckInMessage('');
        setSelectedPhotoName('');
    };

    const confirmSimpleCheckIn = () => {
        if (!checkInModalStreak) return;

        onStreakTap?.(checkInModalStreak.id);
        closeCheckInModal();
    };

    const getStreakVisualState = (streak: Streak) => {
        const userDone = streak.userCheckedInToday === true;
        const partnerDone = streak.partnerCheckedInToday === true;

        const canCheckInNow = streak.canCheckInToday === true;

        if (!canCheckInNow || (userDone && partnerDone)) {
            return {
                priority: 4,
                label: 'Completed today',
                detail: 'Both of you are good until the next check-in.',
                emoji: '🟢',
                cardClass: 'shadow-[0_0_18px_rgba(16,185,129,0.16)]',
                chipClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
                pulseStyle: undefined
            };
        }

        if (userDone && !partnerDone) {
            return {
                priority: 3,
                label: 'Waiting on partner',
                detail: 'You did your part.',
                emoji: '🔵',
                cardClass: 'shadow-[0_0_18px_rgba(59,130,246,0.20)]',
                chipClass: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
                pulseStyle: { animation: 'picabilityBluePulse 4s ease-in-out infinite' }
            };
        }

        if (!userDone && !partnerDone) {
            return {
                priority: 2,
                label: 'Ready to check in',
                detail: 'Both of you still need to check in.',
                emoji: '🟡',
                cardClass: 'shadow-[0_0_24px_rgba(245,158,11,0.30)]',
                chipClass: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
                pulseStyle: { animation: 'picabilityAmberPulse 3s ease-in-out infinite' }
            };
        }

        return {
            priority: 1,
            label: "Don't leave them hanging!",
            detail: 'Your partner already checked in.',
            emoji: '🔥',
            cardClass: 'shadow-[0_0_30px_rgba(249,115,22,0.38)] scale-[1.005]',
            chipClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            pulseStyle: { animation: 'picabilityFirePulse 2.4s ease-in-out infinite' }
        };
    };

    const sortedStreaks = [...streaks].sort((a, b) => {
        return getStreakVisualState(a).priority - getStreakVisualState(b).priority;
    });

    const activeStreaks = sortedStreaks.filter(s => s.isActive !== false);
    const brokenStreaks = streaks.filter(s => s.isActive === false);

    return (
        <>
            <style>
                {`
      @keyframes picabilityGreenPulse {
        0%, 100% { opacity: 0.85; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.01); }
      }

      @keyframes picabilityBluePulse {
        0%, 100% { opacity: 0.8; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.015); }
      }

      @keyframes picabilityAmberPulse {
        0%, 100% { opacity: 0.78; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.025); }
      }

      @keyframes picabilityFirePulse {
        0%, 100% { opacity: 0.82; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.035); }
      }
    `}
            </style>
            <div className={`min-h-screen p-6 transition-colors duration-300 ${isDark
                ? 'bg-gradient-to-br from-slate-900 to-slate-800'
                : 'bg-gradient-to-br from-slate-50 to-slate-100'
                }`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col">
                        <h1 className={`text-2xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                            My Streaks
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                Hi, <span className="font-semibold text-teal-500">{user?.userName}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 relative">
                        {/*<button*/}
                        {/*  onClick={() => setShowInvites(!showInvites)}*/}
                        {/*  className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 relative ${*/}
                        {/*    isDark ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white'*/}
                        {/*  }`}*/}
                        {/*>*/}
                        {/*  <Mail className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />*/}
                        {/*  {streakInvites.length > 0 && (*/}
                        {/*    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold">*/}
                        {/*      {streakInvites.length}*/}
                        {/*    </span>*/}
                        {/*  )}*/}
                        {/*</button>*/}

                        {showInvites && (
                            <div className={`absolute top-14 right-0 w-72 z-50 rounded-2xl shadow-2xl p-2 border animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'
                                }`}>
                                <div className="p-3 border-b border-slate-700/50 mb-1">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-teal-500">Streak Invitations</h3>
                                </div>
                                {streakInvites.length === 0 ? (
                                    <p className="text-xs p-4 text-center text-slate-500">No pending streak requests</p>
                                ) : (
                                    <div className="max-h-64 overflow-y-auto space-y-1">
                                        {streakInvites.map((invite) => {
                                            const isAccepted = acceptedIds.includes(invite.id);
                                            return (
                                                <div key={invite.id} className={`p-3 rounded-xl flex items-center justify-between transition-colors duration-300 ${isAccepted ? 'bg-emerald-500/20' : isDark ? 'bg-slate-700/50' : 'bg-slate-50'
                                                    }`}>
                                                    <div className="flex flex-col min-w-0 pr-2">
                                                        <span className="text-sm font-bold truncate">{invite.senderName}</span>
                                                        <span className="text-[10px] text-slate-400 truncate">Habit: {invite.habitName}</span>
                                                    </div>
                                                    <button
                                                        disabled={isAccepted}
                                                        onClick={() => {
                                                            setAcceptedIds(prev => [...prev, invite.id]);
                                                            onAcceptInvite?.(invite.id);
                                                        }}
                                                        className={`p-2 rounded-lg transition-all duration-300 ${isAccepted
                                                            ? 'bg-emerald-500 text-white scale-110'
                                                            : 'bg-teal-600 text-white hover:bg-teal-500'
                                                            }`}
                                                        title="Accept streak request"
                                                    >
                                                        {isAccepted ? <CheckCircle2 size={14} className="animate-in zoom-in" /> : <Check size={14} />}
                                                    </button>

                                                    <button
                                                        disabled={isAccepted}
                                                        onClick={() => {
                                                            onRejectInvite?.(invite.id);
                                                        }}
                                                        className="p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-all duration-300"
                                                        title="Reject streak request"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        <button onClick={onToggleDark} className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white'}`}>
                            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
                        </button>

                        <button onClick={onFriends} className={`relative flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white'}`}>
                            <Users className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
                            {pendingFriendRequestCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold">
                                    {pendingFriendRequestCount}
                                </span>
                            )}
                        </button>


                        <button onClick={onLogout} className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm transition-all border border-transparent hover:border-rose-500/30 ${isDark ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white'}`}>
                            <LogOut className="w-5 h-5 text-rose-500" />
                        </button>
                    </div>
                </div>

                {/* Streaks List */}
                <div className="max-w-2xl mx-auto space-y-4 mb-6 pr-16">
                    {streakInvites.length > 0 && (
                        <div className="space-y-3">
                            <h2 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                Incoming Streak Requests
                            </h2>

                            {streakInvites.map((invite) => {
                                const IconComponent = (LucideIcons as any)[invite.habitIcon] || LucideIcons.Target;

                                return (
                                    <div
                                        key={`incoming-${invite.id}`}
                                        className={`w-full rounded-3xl p-6 shadow-md border-2 border-dashed transition-all ${isDark
                                            ? 'bg-amber-500/10 border-amber-500/30'
                                            : 'bg-amber-50 border-amber-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${invite.color || 'from-amber-500 to-orange-600'} shadow-lg`}>
                                                    <IconComponent className="w-8 h-8 text-white" />
                                                </div>

                                                <div>
                                                    <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                                        {invite.habitName}
                                                    </h3>
                                                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                        {invite.senderName} invited you to start this streak
                                                    </p>
                                                    <p className="text-xs text-amber-500 font-semibold mt-1">
                                                        Waiting for your response
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => onAcceptInvite?.(invite.id)}
                                                    className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all"
                                                >
                                                    Accept
                                                </button>

                                                <button
                                                    onClick={() => onRejectInvite?.(invite.id)}
                                                    className="px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {sentStreakRequests.length > 0 && (
                        <div className="space-y-3">
                            <h2 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                Pending Streaks
                            </h2>

                            {sentStreakRequests.map((request) => {
                                const IconComponent = (LucideIcons as any)[request.habitIcon] || LucideIcons.Target;

                                return (
                                    <div
                                        key={`sent-${request.id}`}
                                        className={`w-full rounded-3xl p-6 shadow-sm border transition-all ${isDark
                                            ? 'bg-slate-800/40 border-slate-700/70'
                                            : 'bg-white border-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${request.color || 'from-slate-500 to-slate-600'} shadow-lg opacity-80`}>
                                                    <IconComponent className="w-8 h-8 text-white" />
                                                </div>

                                                <div>
                                                    <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                                        {request.habitName}
                                                    </h3>
                                                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                        Requested with {request.receiverName}
                                                    </p>
                                                    <p className="text-xs text-amber-500 font-semibold mt-1">
                                                        Pending response ⏳
                                                    </p>
                                                </div>
                                            </div>

                                            <div className={`px-4 py-2 rounded-2xl text-sm font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                Pending
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeStreaks.length > 0 && (
                        <h2 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                            Active Streaks
                        </h2>
                    )}

                    {activeStreaks.map((streak) => {
                        const isExpanded = expandedStreakId === streak.id;
                        const isBroken = streak.isActive === false;
                        const IconComponent = (LucideIcons as any)[streak.habitIcon] || LucideIcons.Target;
                        const visualState = getStreakVisualState(streak);

                        const userCheckedInToday = streak.userCheckedInToday === true;
                        const partnerCheckedInToday = streak.partnerCheckedInToday === true;
                        const bothCheckedInToday = streak.bothCheckedInToday === true;

                        const canCheckIn = streak.canCheckInToday === true;

                        //// TESTING ONLY
                        //const hasMessageBubble = streak.habitName === 'Exercise';
                        //const hasPhotoBubble = streak.habitName === 'Reading';

                        const bubbleAccentClass = streak.color.includes('orange') ? 'border-orange-500 text-orange-400'
                            : streak.color.includes('violet') || streak.color.includes('purple') ? 'border-purple-500 text-purple-400'
                                : streak.color.includes('rose') || streak.color.includes('pink') ? 'border-pink-500 text-pink-400'
                                    : streak.color.includes('sky') || streak.color.includes('blue') ? 'border-blue-500 text-blue-400'
                                        : streak.color.includes('emerald') || streak.color.includes('teal') ? 'border-teal-500 text-teal-400'
                                            : 'border-teal-500 text-teal-400';

                        const hasMessageBubble = streak.hasUnreadMessage === true;
                        const hasPhotoBubble = streak.hasUnreadPhoto === true;



                        return (
                            <div
                                key={streak.id}
                                style={!isBroken ? visualState.pulseStyle : undefined}
                                className={`relative w-full rounded-3xl overflow-visible transition-all duration-500 ${!isBroken ? visualState.cardClass : ''} ${isBroken ? 'grayscale opacity-70 scale-[0.98]' : ''}`}
                            >
                                <button
                                    onClick={() => handleStreakClick(streak.id)}
                                    className={`group w-full relative overflow-hidden rounded-3xl p-6 shadow-sm transition-all duration-300 hover:scale-[1.01] ${isDark ? 'bg-slate-800/50 backdrop-blur-sm' : 'bg-white'
                                        } ${isExpanded ? 'rounded-b-none' : ''}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${isBroken ? 'from-slate-500 to-slate-600' : streak.color} shadow-lg`}>
                                                <IconComponent className="w-8 h-8 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                                    {streak.habitName} {isBroken && '💔'}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>{streak.userAvatar}</div>
                                                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>with {streak.userName}</span>
                                                    {!isBroken && (
                                                        <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full border text-xs font-bold ${visualState.chipClass}`}>
                                                            <span>{visualState.emoji}</span>
                                                            <span>{visualState.label}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`text-3xl font-bold ${isBroken ? 'text-slate-500' : 'bg-gradient-to-br ' + streak.color + ' bg-clip-text text-transparent'}`}>{streak.streakCount}</div>
                                                <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{streak.streakCount === 1 ? 'day' : 'days'}</span>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'} ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                </button>

                                {!isBroken && (hasMessageBubble || hasPhotoBubble) && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            alert(hasPhotoBubble ? "Photo viewer coming next." : "Message viewer coming next.");
                                        }}
                                        className={`absolute top-1/2 -right-12 -translate-y-1/2 z-20 w-[60px] h-[48px] rounded-full shadow-xl border-2 flex items-center justify-center hover:scale-105 transition-all ${isDark ? 'bg-slate-800' : 'bg-white'
                                            } ${bubbleAccentClass}`}
                                    >

                                        {hasPhotoBubble ? (
                                            <ImageIcon className="w-6 h-6 relative z-10" />
                                        ) : (
                                            <MessageCircle className="w-7 h-7 relative z-10" />
                                        )}
                                    </button>
                                )}

                                {isExpanded && (
                                    <div className={`rounded-b-3xl overflow-hidden shadow-lg border-t ${isDark ? 'bg-slate-800/80 backdrop-blur-md border-slate-700/50' : 'bg-white border-slate-100'}`}>
                                        <div className="p-6">
                                            {!isBroken && (
                                                <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                                                    <div className={`p-3 rounded-2xl text-center ${userCheckedInToday
                                                        ? 'bg-emerald-500/15 text-emerald-500'
                                                        : isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        <div className="font-bold">You</div>
                                                        <div>{userCheckedInToday ? 'Checked in ✅' : 'Waiting ⏳'}</div>
                                                    </div>

                                                    <div className={`p-3 rounded-2xl text-center ${partnerCheckedInToday
                                                        ? 'bg-emerald-500/15 text-emerald-500'
                                                        : isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        <div className="font-bold">Partner</div>
                                                        <div>{partnerCheckedInToday ? 'Checked in ✅' : 'Waiting ⏳'}</div>
                                                    </div>
                                                </div>
                                            )}
                                            {isBroken ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDismissStreak?.(streak.id); }}
                                                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all font-bold shadow-sm"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                    Dismiss Broken Streak
                                                </button>
                                            ) : (
                                                <div className="space-y-3">
                                                    <button
                                                        disabled={!canCheckIn}
                                                        onClick={(e) => openCheckInModal(streak, e)}
                                                        className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl transition-all duration-300 shadow-md ${canCheckIn
                                                            ? `bg-gradient-to-r ${streak.color} hover:brightness-110`
                                                            : 'bg-slate-700/30 cursor-not-allowed grayscale'
                                                            }`}
                                                    >
                                                        {canCheckIn ? (
                                                            <>
                                                                <CheckCircle2 className="w-6 h-6 text-white animate-bounce" />
                                                                <span className="font-bold text-white text-lg">Complete Today</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Clock className="w-6 h-6 text-slate-400" />
                                                                        <span className="font-bold text-slate-400 text-lg">
                                                                            {streak.timeMessage}
                                                                        </span>

                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const confirmed = window.confirm("Are you sure you want to cancel this streak? This will remove it for both users.");
                                                            if (confirmed) {
                                                                onDismissStreak?.(streak.id);
                                                            }
                                                        }}
                                                        className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all font-bold shadow-sm"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                        Cancel Streak
                                                    </button>
                                                </div>
                                            )}
                                            <p className={`text-center mt-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                {isBroken
                                                    ? "This streak was broken. Tap dismiss to remove it."
                                                    : streak.timeMessage}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {checkInModalStreak && (
                        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div
                                className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border animate-in fade-in slide-in-from-bottom-4 duration-200 ${isDark
                                        ? 'bg-slate-900 border-slate-700 text-slate-100'
                                        : 'bg-white border-slate-200 text-slate-800'
                                    }`}
                            >
                                <div className="mb-5">
                                    <p className="text-sm font-bold uppercase tracking-widest text-teal-500 mb-2">
                                        Complete Streak
                                    </p>

                                    <h2 className="text-2xl font-bold">
                                        {checkInModalStreak.habitName}
                                    </h2>

                                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        How do you want to check in today?
                                    </p>
                                </div>

                                {checkInMode === 'options' && (
                                    <div className="space-y-3">
                                        <button
                                            onClick={confirmSimpleCheckIn}
                                            className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl font-bold transition-all bg-gradient-to-r ${checkInModalStreak.color} text-white hover:brightness-110`}
                                        >
                                            <span>Check in</span>
                                            <CheckCircle2 className="w-5 h-5" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setCheckInMode('message')}
                                            className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl font-bold transition-all ${isDark ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                                                }`}
                                        >
                                            <span>Add message</span>
                                            <span className="text-xs font-semibold text-teal-400">Optional</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setCheckInMode('photo')}
                                            className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl font-bold transition-all ${isDark ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                                                }`}
                                        >
                                            <span>Add picture</span>
                                            <span className="text-xs font-semibold text-teal-400">Optional</span>
                                        </button>
                                    </div>
                                )}

                                {checkInMode === 'message' && (
                                    <div className="space-y-3">
                                        <textarea
                                            value={checkInMessage}
                                            onChange={(e) => setCheckInMessage(e.target.value)}
                                            maxLength={200}
                                            placeholder="Write a quick check-in message..."
                                            className={`w-full min-h-28 resize-none rounded-2xl p-4 outline-none border transition-all ${isDark
                                                    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-teal-500'
                                                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-teal-500'
                                                }`}
                                        />

                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>This will be ephemeral later.</span>
                                            <span>{checkInMessage.length}/200</span>
                                        </div>

                                        <button
                                            onClick={confirmSimpleCheckIn}
                                            className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl font-bold transition-all bg-gradient-to-r ${checkInModalStreak.color} text-white hover:brightness-110`}
                                        >
                                            <span>Send message + check in</span>
                                            <CheckCircle2 className="w-5 h-5" />
                                        </button>

                                        <button
                                            onClick={() => setCheckInMode('options')}
                                            className={`w-full py-3 rounded-2xl font-semibold transition-all ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
                                                }`}
                                        >
                                            Back
                                        </button>
                                    </div>
                                )}

                                {checkInMode === 'photo' && (
                                    <div className="space-y-3">
                                        <label
                                            className={`w-full min-h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${isDark
                                                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-teal-500'
                                                    : 'bg-slate-50 border-slate-300 text-slate-600 hover:border-teal-500'
                                                }`}
                                        >
                                            <span className="font-bold">
                                                {selectedPhotoName || 'Choose JPG or PNG'}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                Photo upload storage comes next
                                            </span>

                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) setSelectedPhotoName(file.name);
                                                }}
                                            />
                                        </label>

                                        <button
                                            onClick={confirmSimpleCheckIn}
                                            disabled={!selectedPhotoName}
                                            className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl font-bold transition-all ${selectedPhotoName
                                                    ? `bg-gradient-to-r ${checkInModalStreak.color} text-white hover:brightness-110`
                                                    : 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
                                                }`}
                                        >
                                            <span>Send photo + check in</span>
                                            <CheckCircle2 className="w-5 h-5" />
                                        </button>

                                        <button
                                            onClick={() => setCheckInMode('options')}
                                            className={`w-full py-3 rounded-2xl font-semibold transition-all ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
                                                }`}
                                        >
                                            Back
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={closeCheckInModal}
                                    className={`w-full mt-4 py-3 rounded-2xl font-semibold transition-all ${isDark
                                            ? 'text-slate-400 hover:bg-slate-800'
                                            : 'text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {brokenStreaks.length > 0 && (
                        <div className="space-y-3">
                            <h2 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                Broken Streaks
                            </h2>

                            {brokenStreaks.map((streak) => {
                                const IconComponent = (LucideIcons as any)[streak.habitIcon] || LucideIcons.Target;

                                return (
                                    <div
                                        key={`broken-${streak.id}`}
                                        className={`w-full rounded-3xl p-6 shadow-sm border transition-all grayscale opacity-80 ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 shadow-lg">
                                                    <IconComponent className="w-8 h-8 text-white" />
                                                </div>

                                                <div>
                                                    <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                                        {streak.habitName} 💔
                                                    </h3>
                                                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                        with {streak.userName}
                                                    </p>
                                                    <p className="text-sm text-rose-400 font-bold mt-1">
                                                        {streak.brokenMessage || "The streak died! :'C"}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Made it to {streak.streakCount} {streak.streakCount === 1 ? 'day' : 'days'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => onRestartStreak?.(streak)}
                                                    className="px-4 py-2 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all"
                                                >
                                                    Try Again?
                                                </button>

                                                <button
                                                    onClick={() => onDismissStreak?.(streak.id)}
                                                    className="px-4 py-2 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white font-bold transition-all"
                                                >
                                                    Dismiss
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <button onClick={onAddHabit} className="group w-full relative overflow-hidden bg-gradient-to-br from-teal-600 to-cyan-700 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-center justify-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                                <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
                            </div>
                            <span className="text-lg font-semibold text-white">Start New Habit Streak</span>
                        </div>
                    </button>
                </div>

                {streaks.length === 0 && (
                    <div className="max-w-2xl mx-auto text-center py-16">
                        <div className={`text-6xl mb-4 ${isDark ? 'opacity-50' : 'opacity-30'}`}>🎯</div>
                        <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>No Active Streaks</h2>
                        <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Start your first habit streak with a friend!</p>
                    </div>
                )}
            </div>
        </>
    );
}