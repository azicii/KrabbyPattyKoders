import { Users, Sun, Moon, Plus, CheckCircle2, ChevronDown, LogOut, Mail, Check, X, Clock, Trash2, ImageIcon, MessageCircle, Flame, Eye, EyeClosed, Bell, BellRing, FlipHorizontal2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { createPortal } from 'react-dom';
import { canUsePushNotifications, enablePushNotifications } from '../utils/pushNotifications';

interface StreakMemberProgress {
    userId: string;
    userName: string;
    isCreator?: boolean;
    isCurrentUser?: boolean;
    cycleCheckInCount: number;
    completedCycle: boolean;
    visibilityPublic?: boolean;
}

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
    requiredCheckIns?: number;
    cycleLength?: number;
    cycleUnit?: 'Day' | 'Week' | 'Month';

    cycleStartedAt?: string;
    cycleEndsAt?: string;

    userCycleCheckInCount?: number;
    partnerCycleCheckInCount?: number;

    userCompletedCycle?: boolean;
    partnerCompletedCycle?: boolean;
    bothCompletedCycle?: boolean;

    canCheckInCurrentCycle?: boolean;
    hoursUntilCycleEnds?: number;
    isGroupStreak?: boolean;
    memberCount?: number;
    members?: StreakMemberProgress[];

    waitingOnMembers?: {
        userId: string;
        userName: string;
        isCurrentUser?: boolean;
    }[];

    failedMembers?: {
        userId: string;
        userName: string;
        isCurrentUser?: boolean;
    }[];

    allMembersCompletedCycle?: boolean;
    cycleProgressMessage?: string;
    brokenMessage?: string;
    timeMessage?: string;
    hasUnreadMessage?: boolean;
    hasUnreadPhoto?: boolean;
    partnerId?: string;
    unreadContent?: any[];
    isPublic?: boolean;
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
    onAcceptInvite?: (
        id: number,
        isGroupRequest?: boolean
    ) => void;

    onRejectInvite?: (
        id: number,
        isGroupRequest?: boolean
    ) => void;
    onCancelPendingStreakRequest?: (id: number) => void;
    onRestartStreak?: (streak: Streak) => void;
    pendingFriendRequestCount?: number;
    onSendCheckInMessage?: (
        streakId: number,
        messageText: string,
        viewDurationSeconds: number
    ) => void;
    unreadContent?: any[];
    onViewCheckInContent?: (contentId: number) => void;
    onSendCheckInPhoto?: (
        streakId: number,
        photoDataUrl: string,
        viewDurationSeconds: number
    ) => void;
    onPublicFeed?: () => void;
    onToggleVisibility?: (streakId: number, isPublic: boolean) => void;
    onSendReminderPing?: (streakId: number) => Promise<void>;
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
    onPublicFeed,
    onRestartStreak,
    onSendReminderPing,
    pendingFriendRequestCount = 0,
    onSendCheckInMessage,
    unreadContent = [],
    onViewCheckInContent,
    onRejectInvite,
    onCancelPendingStreakRequest,
    onToggleVisibility,
    onSendCheckInPhoto
}: StreakTrackerProps) {
    const [expandedStreakId, setExpandedStreakId] = useState<number | null>(null);
    const [showInvites, setShowInvites] = useState(false);
    const [acceptedIds, setAcceptedIds] = useState<number[]>([]);
    const [checkInModalStreak, setCheckInModalStreak] = useState<Streak | null>(null);
    const [checkInMode, setCheckInMode] = useState<'options' | 'message' | 'photo'>('options');
    const [checkInMessage, setCheckInMessage] = useState('');
    const [selectedPhotoName, setSelectedPhotoName] = useState('');
    const [viewingContent, setViewingContent] = useState<any | null>(null);
    const [viewerProgress, setViewerProgress] = useState(100);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [cancelPendingRequest, setCancelPendingRequest] = useState<any | null>(null);
    const pushStorageKey = `picabilityPushEnabled:${user?.id}`;
    const [showPushPrompt, setShowPushPrompt] = useState(false);
    const [sendingReminderId, setSendingReminderId] = useState<number | null>(null);
    const [reminderSentId, setReminderSentId] = useState<number | null>(null);

    const [pushEnabled, setPushEnabled] = useState(
        localStorage.getItem(pushStorageKey) === 'true'
    );

    const getUnreadForStreak = (streakId: number) => {
        return unreadContent
            ?.filter(c => c.streakId === streakId)
            .sort((a, b) => {
                // Oldest check-in in the current cycle first.
                if (a.checkInNumber !== b.checkInNumber) {
                    return a.checkInNumber - b.checkInNumber;
                }

                return (
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime()
                );
            })[0];
    };

    const openUnreadContent = (content: any) => {
        setViewingContent(content);
        onViewCheckInContent?.(content.id);
    };

    const flipSelectedPhotoHorizontally = async () => {
        if (!selectedPhoto) return;

        try {
            const image = new Image();

            image.onload = () => {
                const canvas = document.createElement('canvas');

                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;

                const context = canvas.getContext('2d');

                if (!context) {
                    console.error(
                        'Could not create canvas context for selfie flip.'
                    );
                    return;
                }

                context.translate(canvas.width, 0);
                context.scale(-1, 1);

                context.drawImage(
                    image,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                const originalType =
                    selectedPhoto.startsWith('data:image/png')
                        ? 'image/png'
                        : 'image/jpeg';

                const flippedPhoto = canvas.toDataURL(
                    originalType,
                    0.92
                );

                setSelectedPhoto(flippedPhoto);
            };

            image.onerror = () => {
                console.error(
                    'The selected photo could not be loaded for flipping.'
                );
            };

            image.src = selectedPhoto;
        } catch (error) {
            console.error('Selfie flip failed:', error);
        }
    };

    const handleStreakClick = (streakId: number) => {
        const unread = getUnreadForStreak(streakId);

        if (unread) {
            openUnreadContent(unread);
            return;
        }

        setExpandedStreakId(expandedStreakId === streakId ? null : streakId);
    };

    const openCheckInModal = (streak: Streak, e: React.MouseEvent) => {
        e.stopPropagation();
        setCheckInModalStreak(streak);
        setCheckInMode('options');
        setCheckInMessage('');
        setSelectedPhotoName('');
        setSelectedPhoto(null);
    };

    const closeCheckInModal = () => {
        setCheckInModalStreak(null);
        setCheckInMode('options');
        setCheckInMessage('');
        setSelectedPhotoName('');
        setSelectedPhoto(null);
    };

    const confirmSimpleCheckIn = () => {
        if (!checkInModalStreak) return;

        onStreakTap?.(checkInModalStreak.id);
        closeCheckInModal();
    };

    const confirmMessageCheckIn = () => {
        if (!checkInModalStreak) return;

        if (!checkInMessage.trim()) {
            alert("Please enter a message first.");
            return;
        }

        onSendCheckInMessage?.(
            checkInModalStreak.id,
            checkInMessage.trim(),
            10
        );

        closeCheckInModal();
    };

    const handleReminderPing = async (
        streakId: number,
        event: React.MouseEvent
        ) => {
        event.stopPropagation();

        if (sendingReminderId === streakId) return;

        try {
            setSendingReminderId(streakId);

            await onSendReminderPing?.(streakId);

            setReminderSentId(streakId);

            window.setTimeout(() => {
                setReminderSentId(current =>
                    current === streakId ? null : current
                );
            }, 2500);
        } finally {
            setSendingReminderId(null);
        }
    };

    const confirmPhotoCheckIn = () => {
        if (!checkInModalStreak || !selectedPhoto) {
            return;
        }

        onSendCheckInPhoto?.(
            checkInModalStreak.id,
            selectedPhoto,
            10
        );

        setSelectedPhoto(null);
        setSelectedPhotoName('');
        closeCheckInModal();
    };

    const getContentAccentColor = (content: any) => {
        const streak = streaks.find(s => s.id === content.streakId);

        if (!streak) return 'rgb(20 184 166)';

        if (streak.color.includes('orange'))
            return 'rgb(249 115 22)';

        if (streak.color.includes('violet') || streak.color.includes('purple'))
            return 'rgb(168 85 247)';

        if (streak.color.includes('pink') || streak.color.includes('rose'))
            return 'rgb(236 72 153)';

        if (streak.color.includes('sky') || streak.color.includes('blue'))
            return 'rgb(59 130 246)';

        if (streak.color.includes('emerald') || streak.color.includes('teal'))
            return 'rgb(20 184 166)';

        return 'rgb(20 184 166)';
    };

    const getScheduleLabel = (
        requiredCheckIns?: number,
        cycleLength?: number,
        cycleUnit?: string
    ) => {
        const normalizedRequired = Math.max(
            1,
            requiredCheckIns ?? 1
        );

        const normalizedLength = Math.max(
            1,
            cycleLength ?? 1
        );

        const normalizedUnit =
            cycleUnit === 'Week'
                ? 'week'
                : cycleUnit === 'Month'
                    ? 'month'
                    : 'day';

        if (
            normalizedRequired === 1 &&
            normalizedLength === 1 &&
            normalizedUnit === 'day'
        ) {
            return 'Once daily';
        }

        const checkInLabel =
            normalizedRequired === 1
                ? 'check-in'
                : 'check-ins';

        const cycleLabel =
            normalizedLength === 1
                ? normalizedUnit
                : `${normalizedUnit}s`;

        return `${normalizedRequired} ${checkInLabel} every ${normalizedLength} ${cycleLabel}`;
    };

    const isDefaultDailySchedule = (streak: Streak) => {
        return (
            (streak.requiredCheckIns ?? 1) === 1 &&
            (streak.cycleLength ?? 1) === 1 &&
            (streak.cycleUnit ?? 'Day') === 'Day'
        );
    };

    const getCycleEndLabel = (cycleEndsAt?: string) => {
        if (!cycleEndsAt) {
            return 'the end of this cycle';
        }

        const endDate = new Date(cycleEndsAt);

        return endDate.toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const getStreakCountUnitLabel = (streak: Streak) => {
        const count = streak.streakCount;
        const cycleLength = Math.max(1, streak.cycleLength ?? 1);
        const cycleUnit = streak.cycleUnit ?? 'Day';

        const singularUnit =
            cycleUnit === 'Week'
                ? 'week'
                : cycleUnit === 'Month'
                    ? 'month'
                    : 'day';

        if (cycleLength === 1) {
            return count === 1
                ? singularUnit
                : `${singularUnit}s`;
        }

        return count === 1
            ? `${cycleLength}-${singularUnit} cycle`
            : `${cycleLength}-${singularUnit} cycles`;
    };

    const getStreakVisualState = (streak: Streak) => {
        const userDone =
            streak.userCompletedCycle ??
            streak.userCheckedInToday ??
            false;

        const otherMembers =
            streak.members?.filter(
                member => !member.isCurrentUser
            ) ?? [];

        const partnerDone =
            streak.isGroupStreak
                ? streak.allMembersCompletedCycle === true
                : streak.partnerCompletedCycle ??
                streak.partnerCheckedInToday ??
                false;

        const allOtherMembersDone =
            streak.isGroupStreak
                ? otherMembers.length > 0 &&
                otherMembers.every(
                    member => member.completedCycle
                )
                : partnerDone;

        const canCheckInNow =
            streak.canCheckInCurrentCycle ??
            streak.canCheckInToday ??
            false;

        if (
            userDone &&
            (
                streak.isGroupStreak
                    ? streak.allMembersCompletedCycle === true
                    : partnerDone
            )
        ) {
            return {
                priority: 4,
                label: 'Completed',
                detail: 'Everyone completed the required check-ins.',
                emoji: '🟢',
                cardClass:
                    'shadow-[0_0_18px_rgba(16,185,129,0.16)]',
                chipClass:
                    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
                pulseStyle: undefined
            };
        }

        if (
            userDone &&
            (
                streak.isGroupStreak
                    ? streak.allMembersCompletedCycle !== true
                    : !partnerDone
            )
        ) {
            return {
                priority: 3,
                label: streak.isGroupStreak
                    ? 'Waiting on group'
                    : 'Waiting on partner',

                detail: streak.isGroupStreak
                    ? 'Your required check-ins are complete.'
                    : 'You completed your part.',
                emoji: '🔵',
                cardClass:
                    'shadow-[0_0_18px_rgba(59,130,246,0.20)]',
                chipClass:
                    'bg-blue-500/15 text-blue-400 border-blue-500/25',
                pulseStyle: {
                    animation:
                        'picabilityBluePulse 4s ease-in-out infinite'
                }
            };
        }

        if (!userDone && !partnerDone) {
            return {
                priority: 2,
                label: 'In progress',
                detail: 'Keep building this cycle.',
                emoji: '🟡',
                cardClass:
                    'shadow-[0_0_24px_rgba(245,158,11,0.30)]',
                chipClass:
                    'bg-amber-500/15 text-amber-400 border-amber-500/25',
                pulseStyle: {
                    animation:
                        'picabilityAmberPulse 3s ease-in-out infinite'
                }
            };
        }

        return {
            priority: 1,
            label: "Don't leave them hanging!",
            detail: streak.isGroupStreak
                ? allOtherMembersDone
                    ? 'Everyone else completed their part.'
                    : 'Other group members are checking in.'
                : 'Your partner completed their part.',
            emoji: '🔥',
            cardClass:
                'shadow-[0_0_30px_rgba(249,115,22,0.38)] scale-[1.005]',
            chipClass:
                'bg-orange-500/20 text-orange-400 border-orange-500/30',
            pulseStyle: {
                animation:
                    'picabilityFirePulse 2.4s ease-in-out infinite'
            }
        };
    };

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

    const sortedStreaks = [...streaks].sort((a, b) => {
        return getStreakVisualState(a).priority - getStreakVisualState(b).priority;
    });

    const activeStreaks = sortedStreaks.filter(s => s.isActive !== false);
    const brokenStreaks = streaks.filter(s => s.isActive === false);

    const actionableStreakInvites =
        streakInvites.filter(invite =>
            !invite.isGroupRequest ||
            invite.currentUserStatus !== 'Accepted'
        );

    const acceptedGroupInvites =
        streakInvites.filter(invite =>
            invite.isGroupRequest &&
            invite.currentUserStatus === 'Accepted'
        );

    useEffect(() => {
        if (!viewingContent) return;

        setViewerProgress(100);

        const durationMs = (viewingContent.viewDurationSeconds || 10) * 1000;
        const startTime = Date.now();

        const interval = window.setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remainingPercent = Math.max(0, 100 - (elapsed / durationMs) * 100);

            setViewerProgress(remainingPercent);

            if (remainingPercent <= 0) {
                setViewingContent(null);
                window.clearInterval(interval);
            }
        }, 50);

        return () => window.clearInterval(interval);
    }, [viewingContent]);

    useEffect(() => {
        if (pushEnabled) return;
        if (!canUsePushNotifications()) return;
        if (Notification.permission !== 'default') return;

        const promptKey = `picabilityPushPromptShown:${user?.id}`;

        if (localStorage.getItem(promptKey) === 'true') return;

        setShowPushPrompt(true);
        localStorage.setItem(promptKey, 'true');
    }, [pushEnabled, user?.id]);

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
            <div className={`min-h-screen px-4 py-5 sm:p-6 transition-colors duration-300 ${isDark
                ? 'bg-gradient-to-br from-slate-900 to-slate-800'
                : 'bg-gradient-to-br from-slate-50 to-slate-100'
                }`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-8">
                    <div className="flex flex-col min-w-0">
                        <h1 className={`text-2xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                            My Streaks
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                Hi, <span className="font-semibold text-teal-500">{user?.userName}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
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
                                                            onAcceptInvite?.(
                                                                invite.id,
                                                                invite.isGroupRequest === true
                                                            );
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
                                                            onRejectInvite?.(
                                                                invite.id,
                                                                invite.isGroupRequest === true
                                                            );
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

                        {pendingFriendRequestCount > 0 && (
                            <button
                                type="button"
                                onClick={onFriends}
                                className={`relative flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm transition-all ${isDark
                                        ? 'bg-slate-800 hover:bg-slate-750'
                                        : 'bg-white'
                                    }`}
                                title="View friend requests"
                                aria-label={`${pendingFriendRequestCount} pending friend ${pendingFriendRequestCount === 1
                                        ? 'request'
                                        : 'requests'
                                    }`}
                            >
                                <Users
                                    className={`w-5 h-5 ${isDark
                                            ? 'text-slate-300'
                                            : 'text-slate-700'
                                        }`}
                                />

                                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 border-2 border-slate-900 flex items-center justify-center text-[10px] leading-none text-white font-bold">
                                    {pendingFriendRequestCount > 99
                                        ? '99+'
                                        : pendingFriendRequestCount}
                                </span>
                            </button>
                        )}

                        {!pushEnabled && canUsePushNotifications() && (
                            <button
                                onClick={async () => {
                                    try {
                                        await enablePushNotifications(user.token);
                                        setPushEnabled(true);
                                        localStorage.setItem(pushStorageKey, 'true');
                                        alert("Notifications enabled!");
                                    } catch (err: any) {
                                        alert(err.message || "Could not enable notifications.");
                                    }
                                }}
                                className={`md:hidden flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white'
                                    }`}
                                title="Enable notifications"
                            >
                                <Bell className="w-5 h-5 text-teal-500" />
                            </button>
                        )}

                        <button onClick={onToggleDark} className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white'}`}>
                            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
                        </button>

                        <button onClick={onLogout} className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm transition-all border border-transparent hover:border-rose-500/30 ${isDark ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white'}`}>
                            <LogOut className="w-5 h-5 text-rose-500" />
                        </button>
                    </div>
                </div>

                {/* Streaks List */}
                <div className="w-full max-w-2xl mx-auto space-y-4 mb-6 px-0 sm:px-0">
                    {actionableStreakInvites.length > 0 && (
                        <div className="space-y-3">
                            <h2 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                Incoming Streak Requests
                            </h2>

                            {actionableStreakInvites.map((invite) => {
                                const IconComponent = (LucideIcons as any)[invite.habitIcon] || LucideIcons.Target;

                                return (
                                    <div
                                        key={`incoming-${invite.id}`}
                                        className={`w-full rounded-3xl p-6 shadow-md border-2 border-dashed transition-all ${isDark
                                            ? 'bg-amber-500/10 border-amber-500/30'
                                            : 'bg-amber-50 border-amber-300'
                                            }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="flex items-start gap-4 w-full min-w-0">
                                                <div className={`flex items-center justify-center w-16 h-16 min-w-[4rem] min-h-[4rem] shrink-0 rounded-2xl bg-gradient-to-br ${invite.color || 'from-amber-500 to-orange-600'} shadow-lg`}>
                                                    <IconComponent className="w-8 h-8 text-white" />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h3 className={`text-lg font-semibold leading-tight whitespace-normal break-words ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                                        {invite.habitName}
                                                    </h3>
                                                    <p
                                                        className={`text-sm ${isDark
                                                                ? 'text-slate-400'
                                                                : 'text-slate-600'
                                                            }`}
                                                    >
                                                        {invite.isGroupRequest
                                                            ? `${invite.senderName} invited you to join a group streak`
                                                            : `${invite.senderName} invited you to start this streak`}
                                                    </p>

                                                    {invite.isGroupRequest && (
                                                        <div className="mt-3 space-y-2">
                                                            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/15 px-3 py-1 text-xs font-semibold text-teal-400">
                                                                <Users className="w-3.5 h-3.5" />
                                                                Group streak
                                                            </div>

                                                            <div
                                                                className={`rounded-2xl p-3 ${isDark
                                                                        ? 'bg-slate-900/40'
                                                                        : 'bg-white/70'
                                                                    }`}
                                                            >
                                                                <p
                                                                    className={`text-xs font-semibold mb-2 ${isDark
                                                                            ? 'text-slate-300'
                                                                            : 'text-slate-700'
                                                                        }`}
                                                                >
                                                                    Participants
                                                                </p>

                                                                <div className="space-y-1.5">
                                                                    <div className="flex items-center justify-between gap-3 text-xs">
                                                                        <span
                                                                            className={
                                                                                isDark
                                                                                    ? 'text-slate-300'
                                                                                    : 'text-slate-700'
                                                                            }
                                                                        >
                                                                            {invite.senderName}
                                                                        </span>

                                                                        <span className="text-teal-500 font-semibold">
                                                                            Creator
                                                                        </span>
                                                                    </div>

                                                                    {(invite.members ?? []).map(
                                                                        (member: any) => (
                                                                            <div
                                                                                key={member.userId}
                                                                                className="flex items-center justify-between gap-3 text-xs"
                                                                            >
                                                                                <span
                                                                                    className={
                                                                                        isDark
                                                                                            ? 'text-slate-300'
                                                                                            : 'text-slate-700'
                                                                                    }
                                                                                >
                                                                                    {member.userName}
                                                                                </span>

                                                                                <span
                                                                                    className={`font-semibold ${member.status === 'Accepted'
                                                                                            ? 'text-emerald-500'
                                                                                            : 'text-amber-500'
                                                                                        }`}
                                                                                >
                                                                                    {member.status}
                                                                                </span>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div
                                                        className={`inline-flex items-center mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${isDark
                                                                ? 'bg-slate-700/70 text-slate-300'
                                                                : 'bg-slate-100 text-slate-600'
                                                            }`}
                                                    >
                                                        {getScheduleLabel(
                                                            invite.requiredCheckIns,
                                                            invite.cycleLength,
                                                            invite.cycleUnit
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-amber-500 font-semibold mt-2">
                                                        Waiting for your response
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                <button
                                                    onClick={() =>
                                                        onAcceptInvite?.(
                                                            invite.id,
                                                            invite.isGroupRequest === true
                                                        )
                                                    }
                                                    className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all"
                                                >
                                                    Accept
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        onRejectInvite?.(
                                                            invite.id,
                                                            invite.isGroupRequest === true
                                                        )
                                                    }
                                                    className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all"
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

                    {(
                        sentStreakRequests.length > 0 ||
                        acceptedGroupInvites.length > 0
                    ) && (
                        <div className="space-y-3">
                            <h2 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                Pending Streaks
                            </h2>

                            {acceptedGroupInvites.map(invite => (
                                <div
                                    key={`accepted-group-${invite.id}`}
                                    className={`relative w-full rounded-3xl p-6 shadow-sm border ${isDark
                                            ? 'bg-slate-800/40 border-teal-500/20'
                                            : 'bg-white border-teal-200'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={`flex items-center justify-center w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br ${invite.color ||
                                                'from-teal-500 to-cyan-600'
                                                } shadow-lg opacity-80`}
                                        >
                                            {(() => {
                                                const IconComponent =
                                                    (LucideIcons as any)[
                                                    invite.habitIcon
                                                    ] ||
                                                    LucideIcons.Target;

                                                return (
                                                    <IconComponent className="w-8 h-8 text-white" />
                                                );
                                            })()}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3
                                                className={`text-lg font-semibold ${isDark
                                                        ? 'text-slate-100'
                                                        : 'text-slate-800'
                                                    }`}
                                            >
                                                {invite.habitName}
                                            </h3>

                                            <div className="flex items-center gap-2 mt-1">
                                                <Users className="w-4 h-4 text-teal-500" />

                                                <span
                                                    className={`text-sm ${isDark
                                                            ? 'text-slate-300'
                                                            : 'text-slate-700'
                                                        }`}
                                                >
                                                    Group streak · {
                                                        (invite.members?.length ?? 0) + 1
                                                    } members
                                                </span>
                                            </div>

                                            <div
                                                className={`mt-3 rounded-2xl p-3 ${isDark
                                                        ? 'bg-slate-900/40'
                                                        : 'bg-slate-50'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between text-sm mb-2">
                                                    <span
                                                        className={
                                                            isDark
                                                                ? 'text-slate-200'
                                                                : 'text-slate-700'
                                                        }
                                                    >
                                                        You
                                                    </span>

                                                    <span className="text-emerald-500 font-semibold">
                                                        Accepted
                                                    </span>
                                                </div>

                                                {(invite.members ?? [])
                                                    .filter(
                                                        (member: any) =>
                                                            member.userId !==
                                                            user?.id
                                                    )
                                                    .map((member: any) => (
                                                        <div
                                                            key={member.userId}
                                                            className="flex items-center justify-between text-sm mt-2"
                                                        >
                                                            <span
                                                                className={
                                                                    isDark
                                                                        ? 'text-slate-300'
                                                                        : 'text-slate-700'
                                                                }
                                                            >
                                                                {member.userName}
                                                            </span>

                                                            <span
                                                                className={`font-semibold ${member.status ===
                                                                        'Accepted'
                                                                        ? 'text-emerald-500'
                                                                        : 'text-amber-500'
                                                                    }`}
                                                            >
                                                                {member.status}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>

                                            <p className="text-xs text-amber-500 font-semibold mt-3">
                                                You accepted · waiting for the remaining members
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {sentStreakRequests.map((request) => {
                                const IconComponent = (LucideIcons as any)[request.habitIcon] || LucideIcons.Target;

                                return (
                                    <div
                                        key={`sent-${request.id}`}
                                        className={`relative w-full rounded-3xl p-6 shadow-sm border transition-all ${isDark
                                            ? 'bg-slate-800/40 border-slate-700/70'
                                            : 'bg-white border-slate-200'
                                            }`}
                                    >
                                        <div className="relative min-h-[158px] sm:min-h-[92px]">
                                            <div className="flex items-start gap-4 pr-0 sm:pr-40 min-w-0">
                                                <div className={`flex items-center justify-center w-16 h-16 min-w-[4rem] min-h-[4rem] shrink-0 rounded-2xl bg-gradient-to-br ${request.color || 'from-slate-500 to-slate-600'} shadow-lg opacity-80`}>
                                                    <IconComponent className="w-8 h-8 text-white" />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h3 className={`text-lg font-semibold leading-tight whitespace-normal break-words ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                                        {request.habitName}
                                                    </h3>
                                                    {request.isGroupRequest ? (
                                                        <div className="mt-1">
                                                            <div className="flex items-center gap-2">
                                                                <Users className="w-4 h-4 text-teal-500" />

                                                                <p
                                                                    className={`text-sm font-medium ${isDark
                                                                            ? 'text-slate-300'
                                                                            : 'text-slate-700'
                                                                        }`}
                                                                >
                                                                    Group streak · {(request.members?.length ?? 0) + 1} members
                                                                </p>
                                                            </div>

                                                            <div
                                                                className={`mt-3 rounded-2xl p-3 ${isDark
                                                                        ? 'bg-slate-900/40'
                                                                        : 'bg-slate-50'
                                                                    }`}
                                                            >
                                                                <p
                                                                    className={`text-xs font-semibold mb-2 ${isDark
                                                                            ? 'text-slate-400'
                                                                            : 'text-slate-500'
                                                                        }`}
                                                                >
                                                                    Invitation status
                                                                </p>

                                                                <div className="space-y-2">
                                                                    {(request.members ?? []).map(
                                                                        (member: any) => (
                                                                            <div
                                                                                key={member.userId}
                                                                                className="flex items-center justify-between gap-4"
                                                                            >
                                                                                <span
                                                                                    className={`text-sm truncate ${isDark
                                                                                            ? 'text-slate-200'
                                                                                            : 'text-slate-700'
                                                                                        }`}
                                                                                >
                                                                                    {member.userName}
                                                                                </span>

                                                                                <span
                                                                                    className={`text-xs font-semibold shrink-0 ${member.status === 'Accepted'
                                                                                            ? 'text-emerald-500'
                                                                                            : member.status === 'Rejected'
                                                                                                ? 'text-rose-500'
                                                                                                : 'text-amber-500'
                                                                                        }`}
                                                                                >
                                                                                    {member.status}
                                                                                </span>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p
                                                            className={`text-sm ${isDark
                                                                    ? 'text-slate-400'
                                                                    : 'text-slate-600'
                                                                }`}
                                                        >
                                                            Requested with {request.receiverName}
                                                        </p>
                                                    )}

                                                    <div
                                                        className={`inline-flex items-center mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${isDark
                                                                ? 'bg-slate-700/70 text-slate-300'
                                                                : 'bg-slate-100 text-slate-600'
                                                            }`}
                                                    >
                                                        {getScheduleLabel(
                                                            request.requiredCheckIns,
                                                            request.cycleLength,
                                                            request.cycleUnit
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-amber-500 font-semibold mt-2">
                                                        {request.isGroupRequest
                                                            ? `${request.members?.filter(
                                                                (member: any) =>
                                                                    member.status === 'Pending'
                                                            ).length ?? 0
                                                            } awaiting response`
                                                            : 'Pending response ⏳'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="absolute right-0 bottom-0 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 flex items-center justify-end gap-2">
                                                <div className={`px-4 py-2 rounded-2xl text-sm font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    Pending
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setCancelPendingRequest(request)}
                                                    className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm shrink-0"
                                                    title="Cancel pending streak request"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
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

                    {showPushPrompt && createPortal(
                        <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                                }`}>
                                <h2 className="text-xl font-bold mb-2">
                                    Stay accountable 🔥
                                </h2>

                                <p className={`text-sm mb-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Get notified when your partner completes a streak so you don’t leave them hanging.
                                </p>

                                <button
                                    onClick={async () => {
                                        try {
                                            await enablePushNotifications(user.token);
                                            setPushEnabled(true);
                                            localStorage.setItem(pushStorageKey, 'true');
                                            setShowPushPrompt(false);
                                        } catch (err: any) {
                                            alert(err.message || "Could not enable notifications.");
                                        }
                                    }}
                                    className="w-full py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all"
                                >
                                    Enable notifications
                                </button>

                                <button
                                    onClick={() => setShowPushPrompt(false)}
                                    className={`w-full mt-3 py-3 rounded-2xl font-semibold transition-all ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    Not now
                                </button>
                            </div>
                        </div>,
                        document.body
                    )}

                    {activeStreaks.map((streak) => {
                        const isExpanded = expandedStreakId === streak.id;
                        const isBroken = streak.isActive === false;
                        const IconComponent = (LucideIcons as any)[streak.habitIcon] || LucideIcons.Target;
                        const visualState = getStreakVisualState(streak);

                        const streakMembers =
                            streak.members ?? [];

                        const currentUserMember =
                            streakMembers.find(
                                member => member.isCurrentUser
                            );

                        const groupWaitingNames =
                            (streak.waitingOnMembers ?? [])
                                .map(member =>
                                    member.isCurrentUser
                                        ? 'you'
                                        : member.userName
                                );

                        const groupWaitingLabel =
                            groupWaitingNames.length === 0
                                ? 'Everyone completed'
                                : groupWaitingNames.length === 1
                                    ? `Waiting on ${groupWaitingNames[0]}`
                                    : groupWaitingNames.length === 2
                                        ? `Waiting on ${groupWaitingNames[0]} and ${groupWaitingNames[1]}`
                                        : `Waiting on ${groupWaitingNames
                                            .slice(0, -1)
                                            .join(', ')}, and ${groupWaitingNames[
                                        groupWaitingNames.length - 1
                                        ]
                                        }`;

                        const allMembersCompletedCycle =
                            streak.isGroupStreak
                                ? streak.allMembersCompletedCycle === true
                                : streak.bothCompletedCycle ??
                                false;

                        const requiredCheckIns =
                            Math.max(1, streak.requiredCheckIns ?? 1);

                        const userCycleCheckIns =
                            Math.min(
                                requiredCheckIns,
                                streak.userCycleCheckInCount ??
                                (streak.userCheckedInToday ? 1 : 0)
                            );

                        const partnerCycleCheckIns =
                            Math.min(
                                requiredCheckIns,
                                streak.partnerCycleCheckInCount ??
                                (streak.partnerCheckedInToday ? 1 : 0)
                            );

                        const userCompletedCycle =
                            streak.userCompletedCycle ??
                            userCycleCheckIns >= requiredCheckIns;

                        const partnerCompletedCycle =
                            streak.partnerCompletedCycle ??
                            partnerCycleCheckIns >= requiredCheckIns;

                        const bothCompletedCycle =
                            streak.bothCompletedCycle ??
                            (userCompletedCycle && partnerCompletedCycle);

                        const canCheckIn =
                            streak.canCheckInCurrentCycle ??
                            streak.canCheckInToday ??
                            false;

                        const customFrequency =
                            !isDefaultDailySchedule(streak);

                        const userProgressPercent =
                            Math.min(
                                100,
                                (userCycleCheckIns / requiredCheckIns) * 100
                            );

                        const partnerProgressPercent =
                            Math.min(
                                100,
                                (partnerCycleCheckIns / requiredCheckIns) * 100
                            );


                        const bubbleAccentClass = streak.color.includes('orange') ? 'border-orange-500 text-orange-400'
                            : streak.color.includes('violet') || streak.color.includes('purple') ? 'border-purple-500 text-purple-400'
                                : streak.color.includes('rose') || streak.color.includes('pink') ? 'border-pink-500 text-pink-400'
                                    : streak.color.includes('sky') || streak.color.includes('blue') ? 'border-blue-500 text-blue-400'
                                        : streak.color.includes('emerald') || streak.color.includes('teal') ? 'border-teal-500 text-teal-400'
                                            : 'border-teal-500 text-teal-400';

                        const unreadForThisStreak = getUnreadForStreak(streak.id);
                        const rewardEmoji = getStreakReward(streak.streakCount);

                        const hasMessageBubble =
                            unreadForThisStreak?.contentType === "Message";

                        const hasPhotoBubble =
                            unreadForThisStreak?.contentType === "Photo";



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
                                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start">
                                        <div className="flex items-start sm:items-center gap-3 min-w-0 pr-4">
                                            <div className={`flex items-center justify-center w-16 h-16 min-w-[4rem] min-h-[4rem] shrink-0 rounded-2xl bg-gradient-to-br ${isBroken ? 'from-slate-500 to-slate-600' : streak.color} shadow-lg`}>
                                                <IconComponent className="w-8 h-8 text-white" />
                                            </div>
                                            <div className="text-left min-w-0 flex-1">
                                                <div className="flex items-start gap-2 min-w-0">
                                                    <h3 className={`text-base sm:text-lg font-semibold leading-tight whitespace-normal break-words min-w-0 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                                        {streak.habitName} {isBroken && '💔'}
                                                    </h3>

                                                    {rewardEmoji && (
                                                        <div
                                                            title={`${streak.streakCount} day streak reward`}
                                                            className={`shrink-0 px-2 py-1 rounded-full text-sm leading-none ${isDark
                                                                ? 'bg-slate-700/60'
                                                                : 'bg-slate-100'
                                                                }`}
                                                        >
                                                            {rewardEmoji}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-1 max-w-[210px] sm:max-w-none">
                                                    {streak.isGroupStreak ? (
                                                        <div className="inline-flex items-center gap-2">
                                                            <div
                                                                className={`flex items-center justify-center w-6 h-6 rounded-full ${isDark
                                                                        ? 'bg-teal-500/15 text-teal-400'
                                                                        : 'bg-teal-100 text-teal-700'
                                                                    }`}
                                                            >
                                                                <Users className="w-3.5 h-3.5" />
                                                            </div>

                                                            <span
                                                                className={`text-sm ${isDark
                                                                        ? 'text-slate-400'
                                                                        : 'text-slate-600'
                                                                    }`}
                                                            >
                                                                Group streak · {streak.memberCount ??
                                                                    streakMembers.length} members
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div
                                                                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${isDark
                                                                        ? 'bg-slate-700 text-slate-300'
                                                                        : 'bg-slate-200 text-slate-700'
                                                                    }`}
                                                            >
                                                                {streak.userAvatar}
                                                            </div>

                                                            <span
                                                                className={`text-sm ${isDark
                                                                        ? 'text-slate-400'
                                                                        : 'text-slate-600'
                                                                    }`}
                                                            >
                                                                with {streak.userName}
                                                            </span>
                                                        </>
                                                    )}
                                                    {!isBroken && (
                                                        <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full border text-[11px] sm:text-xs font-bold whitespace-nowrap ${visualState.chipClass}`}>
                                                            <span>{visualState.emoji}</span>
                                                            <span>{visualState.label}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start justify-end gap-2 shrink-0 pt-0 w-[72px]">
                                            <div className="flex flex-col items-center">
                                                <div className={`text-2xl sm:text-3xl font-bold ${isBroken ? 'text-slate-500' : 'bg-gradient-to-br ' + streak.color + ' bg-clip-text text-transparent'}`}>{streak.streakCount}</div>
                                                <span
                                                    className={`text-xs font-medium text-center leading-tight ${isDark ? 'text-slate-400' : 'text-slate-600'
                                                        }`}
                                                >
                                                    {getStreakCountUnitLabel(streak)}
                                                </span>
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
                                            if (unreadForThisStreak) {
                                                openUnreadContent(unreadForThisStreak);
                                            }
                                        }}
                                        className={`absolute top-1/2 -right-1 -translate-y-1/2 sm:-right-12 z-20 w-9 h-9 sm:w-[60px] sm:h-[48px] rounded-full shadow-xl border-2 flex items-center justify-center hover:scale-105 transition-all ${isDark ? 'bg-slate-800' : 'bg-white'
                                            } ${bubbleAccentClass}`}
                                    >

                                        {hasPhotoBubble ? (
                                            <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
                                        ) : (
                                            <MessageCircle className="w-5 h-5 sm:w-7 sm:h-7 relative z-10" />
                                        )}
                                    </button>
                                )}

                                {isExpanded && (
                                    <div className={`rounded-b-3xl overflow-hidden shadow-lg border-t ${isDark ? 'bg-slate-800/80 backdrop-blur-md border-slate-700/50' : 'bg-white border-slate-100'}`}>
                                        <div className="p-6">
                                            {!isBroken && (
                                                <div className="mb-4">
                                                    {streak.isGroupStreak ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {streakMembers.map(member => {
                                                                const memberCheckIns = Math.min(
                                                                    requiredCheckIns,
                                                                    member.cycleCheckInCount ?? 0
                                                                );

                                                                const memberProgressPercent = Math.min(
                                                                    100,
                                                                    (memberCheckIns / requiredCheckIns) * 100
                                                                );

                                                                return (
                                                                    <div
                                                                        key={member.userId}
                                                                        className={`p-3 rounded-2xl ${member.completedCycle
                                                                                ? 'bg-emerald-500/15'
                                                                                : isDark
                                                                                    ? 'bg-slate-700/50'
                                                                                    : 'bg-slate-100'
                                                                            }`}
                                                                    >
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <div className="min-w-0">
                                                                                <span
                                                                                    className={`block text-sm font-bold truncate ${member.completedCycle
                                                                                            ? 'text-emerald-500'
                                                                                            : isDark
                                                                                                ? 'text-slate-200'
                                                                                                : 'text-slate-700'
                                                                                        }`}
                                                                                >
                                                                                    {member.isCurrentUser
                                                                                        ? 'You'
                                                                                        : member.userName}
                                                                                </span>

                                                                                {member.isCreator && (
                                                                                    <span className="block text-[10px] font-semibold text-teal-500 mt-0.5">
                                                                                        Creator
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            <span
                                                                                className={`text-xs font-bold shrink-0 ${member.completedCycle
                                                                                        ? 'text-emerald-500'
                                                                                        : isDark
                                                                                            ? 'text-slate-400'
                                                                                            : 'text-slate-500'
                                                                                    }`}
                                                                            >
                                                                                {memberCheckIns}/{requiredCheckIns}
                                                                            </span>
                                                                        </div>

                                                                        <div
                                                                            className={`mt-3 h-2 rounded-full overflow-hidden ${isDark
                                                                                    ? 'bg-slate-800'
                                                                                    : 'bg-slate-200'
                                                                                }`}
                                                                        >
                                                                            <div
                                                                                className={`h-full rounded-full transition-all duration-500 ${member.completedCycle
                                                                                        ? 'bg-emerald-500'
                                                                                        : member.isCurrentUser
                                                                                            ? 'bg-teal-500'
                                                                                            : 'bg-violet-500'
                                                                                    }`}
                                                                                style={{
                                                                                    width: `${memberProgressPercent}%`
                                                                                }}
                                                                            />
                                                                        </div>

                                                                        <p
                                                                            className={`mt-2 text-xs ${member.completedCycle
                                                                                    ? 'text-emerald-500'
                                                                                    : isDark
                                                                                        ? 'text-slate-400'
                                                                                        : 'text-slate-500'
                                                                                }`}
                                                                        >
                                                                            {member.completedCycle
                                                                                ? 'Completed ✅'
                                                                                : `${requiredCheckIns - memberCheckIns} remaining`}
                                                                        </p>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div
                                                                className={`p-3 rounded-2xl ${userCompletedCycle
                                                                        ? 'bg-emerald-500/15'
                                                                        : isDark
                                                                            ? 'bg-slate-700/50'
                                                                            : 'bg-slate-100'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span
                                                                        className={`text-sm font-bold ${userCompletedCycle
                                                                                ? 'text-emerald-500'
                                                                                : isDark
                                                                                    ? 'text-slate-200'
                                                                                    : 'text-slate-700'
                                                                            }`}
                                                                    >
                                                                        You
                                                                    </span>

                                                                    <span
                                                                        className={`text-xs font-bold ${userCompletedCycle
                                                                                ? 'text-emerald-500'
                                                                                : isDark
                                                                                    ? 'text-slate-400'
                                                                                    : 'text-slate-500'
                                                                            }`}
                                                                    >
                                                                        {customFrequency
                                                                            ? `${userCycleCheckIns}/${requiredCheckIns}`
                                                                            : userCompletedCycle
                                                                                ? 'Done'
                                                                                : 'Waiting'}
                                                                    </span>
                                                                </div>

                                                                {customFrequency ? (
                                                                    <div
                                                                        className={`mt-3 h-2 rounded-full overflow-hidden ${isDark
                                                                                ? 'bg-slate-800'
                                                                                : 'bg-slate-200'
                                                                            }`}
                                                                    >
                                                                        <div
                                                                            className={`h-full rounded-full transition-all duration-500 ${userCompletedCycle
                                                                                    ? 'bg-emerald-500'
                                                                                    : 'bg-teal-500'
                                                                                }`}
                                                                            style={{
                                                                                width: `${userProgressPercent}%`
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        className={`mt-1 text-xs ${userCompletedCycle
                                                                                ? 'text-emerald-500'
                                                                                : isDark
                                                                                    ? 'text-slate-400'
                                                                                    : 'text-slate-500'
                                                                            }`}
                                                                    >
                                                                        {userCompletedCycle
                                                                            ? 'Checked in ✅'
                                                                            : 'Waiting ⏳'}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div
                                                                className={`p-3 rounded-2xl ${partnerCompletedCycle
                                                                        ? 'bg-emerald-500/15'
                                                                        : isDark
                                                                            ? 'bg-slate-700/50'
                                                                            : 'bg-slate-100'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span
                                                                        className={`text-sm font-bold ${partnerCompletedCycle
                                                                                ? 'text-emerald-500'
                                                                                : isDark
                                                                                    ? 'text-slate-200'
                                                                                    : 'text-slate-700'
                                                                            }`}
                                                                    >
                                                                        {streak.userName}
                                                                    </span>

                                                                    <span
                                                                        className={`text-xs font-bold ${partnerCompletedCycle
                                                                                ? 'text-emerald-500'
                                                                                : isDark
                                                                                    ? 'text-slate-400'
                                                                                    : 'text-slate-500'
                                                                            }`}
                                                                    >
                                                                        {customFrequency
                                                                            ? `${partnerCycleCheckIns}/${requiredCheckIns}`
                                                                            : partnerCompletedCycle
                                                                                ? 'Done'
                                                                                : 'Waiting'}
                                                                    </span>
                                                                </div>

                                                                {customFrequency ? (
                                                                    <div
                                                                        className={`mt-3 h-2 rounded-full overflow-hidden ${isDark
                                                                                ? 'bg-slate-800'
                                                                                : 'bg-slate-200'
                                                                            }`}
                                                                    >
                                                                        <div
                                                                            className={`h-full rounded-full transition-all duration-500 ${partnerCompletedCycle
                                                                                    ? 'bg-emerald-500'
                                                                                    : 'bg-violet-500'
                                                                                }`}
                                                                            style={{
                                                                                width: `${partnerProgressPercent}%`
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        className={`mt-1 text-xs ${partnerCompletedCycle
                                                                                ? 'text-emerald-500'
                                                                                : isDark
                                                                                    ? 'text-slate-400'
                                                                                    : 'text-slate-500'
                                                                            }`}
                                                                    >
                                                                        {partnerCompletedCycle
                                                                            ? 'Checked in ✅'
                                                                            : 'Waiting ⏳'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {(customFrequency || streak.isGroupStreak) && (
                                                        <div className="mt-3 text-center">
                                                            <p
                                                                className={`text-sm font-semibold ${allMembersCompletedCycle
                                                                        ? 'text-emerald-500'
                                                                        : currentUserMember?.completedCycle ||
                                                                            userCompletedCycle
                                                                            ? 'text-blue-400'
                                                                            : isDark
                                                                                ? 'text-slate-300'
                                                                                : 'text-slate-600'
                                                                    }`}
                                                            >
                                                                {streak.isGroupStreak
                                                                    ? allMembersCompletedCycle
                                                                        ? 'Completed'
                                                                        : groupWaitingLabel
                                                                    : bothCompletedCycle
                                                                        ? 'Completed'
                                                                        : userCompletedCycle
                                                                            ? `Your part is complete. Waiting on ${streak.userName}.`
                                                                            : `${requiredCheckIns - userCycleCheckIns} ${requiredCheckIns - userCycleCheckIns === 1
                                                                                ? 'check-in'
                                                                                : 'check-ins'
                                                                            } left for you`}
                                                            </p>

                                                            <p
                                                                className={`text-xs mt-1 ${isDark
                                                                        ? 'text-slate-500'
                                                                        : 'text-slate-400'
                                                                    }`}
                                                            >
                                                                Cycle ends {getCycleEndLabel(streak.cycleEndsAt)}
                                                            </p>
                                                        </div>
                                                    )}
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
                                                                    <span className="font-bold text-white text-lg">
                                                                        {customFrequency
                                                                            ? `Check In · ${userCycleCheckIns}/${requiredCheckIns}`
                                                                            : 'Complete Today'}
                                                                    </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Clock className="w-6 h-6 text-slate-400" />
                                                                        <span className="font-bold text-slate-400 text-lg">
                                                                            {customFrequency
                                                                                ? userCompletedCycle
                                                                                    ? 'Your cycle is complete'
                                                                                    : streak.timeMessage
                                                                                : streak.timeMessage}
                                                                        </span>

                                                            </>
                                                        )}
                                                        </button>

                                                        {!streak.isGroupStreak && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();

                                                                    const confirmed = window.confirm(
                                                                        "Are you sure you want to cancel this streak? This will remove it for both users."
                                                                    );

                                                                    if (confirmed) {
                                                                        onDismissStreak?.(streak.id);
                                                                    }
                                                                }}
                                                                className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all font-bold shadow-sm"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                                Cancel Streak
                                                            </button>
                                                        )}
                                                </div>
                                            )}
                                            <p
                                                className={`text-center mt-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'
                                                    }`}
                                            >
                                                {isBroken
                                                    ? "This streak was broken. Tap dismiss to remove it."
                                                    : customFrequency
                                                        ? userCompletedCycle
                                                            ? `Next cycle begins after ${getCycleEndLabel(
                                                                streak.cycleEndsAt
                                                            )}`
                                                            : `${userCycleCheckIns} of ${requiredCheckIns} check-ins complete this cycle`
                                                        : streak.timeMessage}
                                            </p>

                                            <div className="flex items-end justify-between mt-3 gap-4">
                                                <div className="min-w-[44px]">
                                                    {!isBroken &&
                                                        userCompletedCycle &&
                                                        !partnerCompletedCycle && (
                                                            <button
                                                                type="button"
                                                                onClick={(event) =>
                                                                    handleReminderPing(streak.id, event)
                                                                }
                                                                disabled={sendingReminderId === streak.id}
                                                                className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all ${reminderSentId === streak.id
                                                                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                                                        : isDark
                                                                            ? 'bg-slate-700/40 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-teal-400'
                                                                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-teal-600'
                                                                    } ${sendingReminderId === streak.id
                                                                        ? 'opacity-60 cursor-wait'
                                                                        : ''
                                                                    }`}
                                                                title={
                                                                    reminderSentId === streak.id
                                                                        ? 'Reminder sent'
                                                                        : 'Remind your partner'
                                                                }
                                                                aria-label={
                                                                    reminderSentId === streak.id
                                                                        ? 'Reminder sent'
                                                                        : `Remind ${streak.userName} to check in`
                                                                }
                                                            >
                                                                {reminderSentId === streak.id ? (
                                                                    <Check className="w-5 h-5" />
                                                                ) : (
                                                                    <BellRing className={`w-5 h-5 ${sendingReminderId === streak.id
                                                                            ? 'animate-pulse'
                                                                            : ''
                                                                        }`} />
                                                                )}
                                                            </button>
                                                        )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onToggleVisibility?.(
                                                            streak.id,
                                                            !(streak.isPublic ?? true)
                                                        );
                                                    }}
                                                    className="flex items-center gap-2"
                                                    title={streak.isPublic ?? true ? 'Public' : 'Private'}
                                                >
                                                    <span className={`text-xs font-bold ${streak.isPublic ?? true
                                                            ? 'text-orange-400'
                                                            : isDark ? 'text-slate-400' : 'text-slate-600'
                                                        }`}>
                                                        {streak.isPublic ?? true ? 'Public' : 'Private'}
                                                    </span>

                                                    <span
                                                        className={`relative w-16 h-8 rounded-full transition-all duration-300 ${streak.isPublic ?? true
                                                                ? 'bg-gradient-to-r from-sky-500 to-indigo-600'
                                                                : isDark ? 'bg-slate-700' : 'bg-slate-300'
                                                            }`}
                                                    >
                                                        <span
                                                            className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-sky-500 shadow-lg flex items-center justify-center transition-all duration-300 ${streak.isPublic ?? true ? 'translate-x-8' : 'translate-x-0'
                                                                }`}
                                                        >
                                                            {streak.isPublic ?? true ? (
                                                                <Eye className="w-4 h-4 text-white" />
                                                            ) : (
                                                                <EyeClosed className="w-4 h-4 text-white" />
                                                            )}
                                                        </span>
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {checkInModalStreak && createPortal(
                        <div
                            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6"
                            style={{
                                paddingTop: 'max(24px, env(safe-area-inset-top))',
                                paddingBottom: 'max(24px, env(safe-area-inset-bottom))'
                            }}
                        >
                            <div
                                className={`w-full max-w-md max-h-[calc(100dvh-48px)] overflow-y-auto overscroll-contain rounded-3xl p-6 shadow-2xl border animate-in fade-in zoom-in-95 duration-200 ${isDark
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
                                        How do you want to check in?
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
                                            <span>Message expires after 10 seconds once opened.</span>
                                            <span>{checkInMessage.length}/200</span>
                                        </div>

                                        <button
                                            onClick={confirmMessageCheckIn}
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
                                                id="photo-upload-input"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    const reader = new FileReader();

                                                    reader.onload = () => {
                                                        setSelectedPhoto(reader.result as string);
                                                        setSelectedPhotoName(file.name);

                                                        // Allows selecting the same photo again after closing
                                                        // or replacing the current preview.
                                                        e.target.value = '';
                                                    };

                                                    reader.readAsDataURL(file);
                                                }}
                                            />
                                        </label>

                                        {selectedPhoto && (
                                            <div className="relative overflow-hidden rounded-2xl">
                                                <img
                                                    src={selectedPhoto}
                                                    alt="Selected check-in preview"
                                                    className="w-full max-h-64 object-cover"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={flipSelectedPhotoHorizontally}
                                                    className={`absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold shadow-lg border backdrop-blur-md transition-all active:scale-95 ${isDark
                                                            ? 'bg-slate-900/80 border-slate-600 text-white hover:bg-slate-800'
                                                            : 'bg-white/85 border-slate-200 text-slate-800 hover:bg-white'
                                                        }`}
                                                    aria-label="Flip selfie horizontally"
                                                    title="Flip selfie"
                                                >
                                                    <FlipHorizontal2 className="w-4 h-4" />
                                                    <span>Flip selfie</span>
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            onClick={confirmPhotoCheckIn}
                                            disabled={!selectedPhotoName}
                                            className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl font-bold transition-all ${selectedPhotoName
                                                    ? `bg-gradient-to-r ${checkInModalStreak.color} text-white hover:brightness-110`
                                                    : 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
                                                }`}
                                        >
                                            <span>Send photo + check in</span>
                                            <CheckCircle2 className="w-5 h-5" />
                                        </button>

                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>Photo expires after 10 seconds once opened.</span>
                                        </div>
                                        

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
                        </div>,
                        document.body
                    )}

                    {viewingContent && createPortal(
                        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <div
                                className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border animate-in fade-in slide-in-from-bottom-4 duration-200 ${isDark
                                        ? 'bg-slate-900 border-slate-700 text-slate-100'
                                        : 'bg-white border-slate-200 text-slate-800'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div>
                                        <p className="text-sm font-bold uppercase tracking-widest text-teal-500">
                                            {viewingContent.contentType === "Photo"
                                                ? "Check-in Photo"
                                                : "Check-in Message"}
                                        </p>

                                        <div
                                            className={`inline-flex items-center mt-2 px-2.5 py-1 rounded-full border text-xs font-bold ${isDark
                                                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                                                    : 'bg-slate-100 border-slate-200 text-slate-600'
                                                }`}
                                        >
                                            Check-in {Math.max(
                                                1,
                                                viewingContent.checkInNumber ?? 1
                                            )} of {Math.max(
                                                1,
                                                viewingContent.requiredCheckIns ?? 1
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        className="w-8 h-8 rounded-full shrink-0"
                                        style={{
                                            background: `conic-gradient(
                                                ${getContentAccentColor(viewingContent)}
                                                ${viewerProgress * 3.6}deg,
                                                rgba(148, 163, 184, 0.18) 0deg
                                            )`
                                        }}
                                    >
                                        <div className={`w-full h-full rounded-full scale-[0.72] ${isDark ? 'bg-slate-900' : 'bg-white'
                                            }`} />
                                    </div>
                                </div>

                                <div className={`rounded-3xl p-3 mb-4 ${isDark ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-800'
                                    }`}>
                                    {viewingContent.contentType === "Photo" ? (
                                        <img
                                            src={viewingContent.photoUrl}
                                            alt="Check-in"
                                            className="w-full max-h-[70vh] object-contain rounded-2xl"
                                        />
                                    ) : (
                                        <p className="text-lg font-semibold leading-relaxed p-2">
                                            {viewingContent.messageText}
                                        </p>
                                    )}
                                </div>

                                <p className="text-xs text-slate-500 text-center mb-4">
                                    {viewingContent.contentType === "Photo"
                                        ? `Photo from ${viewingContent.senderName}`
                                        : `Message from ${viewingContent.senderName}`}
                                </p>

                                <button
                                    onClick={() => setViewingContent(null)}
                                    className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </div>,
                        document.body
                    )}

                    {brokenStreaks.length > 0 && (
                        <div className="space-y-3">
                            <h2 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                Broken Streaks
                            </h2>

                            {brokenStreaks.map((streak) => {
                                const IconComponent = (LucideIcons as any)[streak.habitIcon] || LucideIcons.Target;

                                const unreadForThisStreak = getUnreadForStreak(streak.id);

                                const hasMessageBubble = unreadForThisStreak?.contentType === "Message";
                                const hasPhotoBubble = unreadForThisStreak?.contentType === "Photo";

                                const bubbleAccentClass = streak.color.includes('orange') ? 'border-orange-500 text-orange-400'
                                    : streak.color.includes('violet') || streak.color.includes('purple') ? 'border-purple-500 text-purple-400'
                                        : streak.color.includes('rose') || streak.color.includes('pink') ? 'border-pink-500 text-pink-400'
                                            : streak.color.includes('sky') || streak.color.includes('blue') ? 'border-blue-500 text-blue-400'
                                                : streak.color.includes('emerald') || streak.color.includes('teal') ? 'border-teal-500 text-teal-400'
                                                    : 'border-teal-500 text-teal-400';

                                return (
                                    <div
                                        key={`broken-${streak.id}`}
                                        className={`relative w-full rounded-3xl p-6 shadow-sm border transition-all grayscale opacity-80 ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'
                                            }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="flex items-start sm:items-center gap-4 w-full min-w-0">
                                                <div
                                                    className="flex items-center justify-center
                                                        w-16 h-16
                                                        min-w-[4rem]
                                                        min-h-[4rem]
                                                        shrink-0
                                                        rounded-2xl
                                                        bg-gradient-to-br
                                                        from-slate-500
                                                        to-slate-700
                                                        shadow-lg"
                                                >
                                                    <IconComponent className="w-8 h-8 text-white" />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h3
                                                        className={`text-lg font-semibold
                                                            leading-tight
                                                            whitespace-normal
                                                            break-words
                                                            ${isDark ? 'text-slate-100' : 'text-slate-800'}`}
                                                    >
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

                                            <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                                                <button
                                                    onClick={() => onRestartStreak?.(streak)}
                                                    className="flex-1 sm:flex-none px-4 py-2 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all"
                                                >
                                                    Try Again?
                                                </button>

                                                <button
                                                    onClick={() => onDismissStreak?.(streak.id)}
                                                    className="flex-1 sm:flex-none px-4 py-2 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white font-bold transition-all"
                                                >
                                                    Dismiss
                                                </button>
                                            </div>
                                        </div>
                                        {(hasMessageBubble || hasPhotoBubble) && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (unreadForThisStreak) {
                                                        openUnreadContent(unreadForThisStreak);
                                                    }
                                                }}
                                                className={`absolute top-1/2 -right-1 -translate-y-1/2 sm:-right-12 z-20 w-9 h-9 sm:w-[60px] sm:h-[48px] rounded-full shadow-xl border-2 flex items-center justify-center hover:scale-105 transition-all opacity-70 grayscale ${isDark ? 'bg-slate-800' : 'bg-white'
                                                    } ${bubbleAccentClass}`}
                                            >
                                                {hasPhotoBubble ? (
                                                    <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
                                                ) : (
                                                    <MessageCircle className="w-5 h-5 sm:w-7 sm:h-7 relative z-10" />
                                                )}
                                            </button>
                                        )}
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

                {cancelPendingRequest && createPortal(
                    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${isDark
                                ? 'bg-slate-900 border-slate-700 text-slate-100'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}>
                            <div className="mb-5">
                                <p className="text-sm font-bold uppercase tracking-widest text-rose-500 mb-2">
                                    Cancel Request
                                </p>

                                <h2 className="text-2xl font-bold">
                                    Cancel pending streak request?
                                </h2>

                                <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    This will cancel your request for {cancelPendingRequest.habitName}
                                    {cancelPendingRequest.receiverName ? ` with ${cancelPendingRequest.receiverName}` : ''}.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        onCancelPendingStreakRequest?.(cancelPendingRequest.id);
                                        setCancelPendingRequest(null);
                                    }}
                                    className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all"
                                >
                                    Yes, cancel request
                                </button>

                                <button
                                    onClick={() => setCancelPendingRequest(null)}
                                    className={`w-full py-3 rounded-2xl font-semibold transition-all ${isDark
                                            ? 'text-slate-400 hover:bg-slate-800'
                                            : 'text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    Keep request
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

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