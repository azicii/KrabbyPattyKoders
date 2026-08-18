import {
    ArrowLeft,
    CalendarDays,
    MessageCircle,
    Send,
    Users,
    X
} from 'lucide-react';
import {
    useEffect,
    useState
} from 'react';
import * as LucideIcons from 'lucide-react';
import { createPortal } from 'react-dom';
import {
    ProfileUserLink
} from './ProfileUserLink';

interface PublicFeedMember {
    userId: string;
    userName: string;
    isCreator?: boolean;
    isFriend?: boolean;
    visibilityPublic?: boolean;
}

interface FailedPublicFeedMember {
    userId: string;
    userName: string;
    checkInCount?: number;
    requiredCheckIns?: number;
}

interface PublicFeedComment {
    id: number;
    streakId: number;
    userId: string;
    userName: string;
    text: string;
    createdAt: string;
}

export interface PublicFeedItem {
    id: number;
    habitName: string;
    habitIcon: string;
    color: string;
    currentCount: number;
    isActive: boolean;

    isGroupStreak?: boolean;
    memberCount?: number;

    members?: PublicFeedMember[];
    participantNames?: string[];
    visibleFriendNames?: string[];

    failedMembers?: FailedPublicFeedMember[];
    failedMemberNames?: string[];

    friendName?: string;
    partnerName?: string;

    completedToday: boolean;
    failedToday: boolean;

    lastFullyCompletedAt?: string;
    failedAt?: string;
    eventAt?: string;

    killedBy?: string;

    requiredCheckIns?: number;
    cycleLength?: number;
    cycleUnit?: 'Day' | 'Week' | 'Month';

    reactionType?: string;
    reactionEmoji?: string;
    reactionCount?: number;
    currentUserReacted?: boolean;

    commentCount?: number;
    previewComment?: PublicFeedComment | null;
}

interface PublicFeedProps {
    isDark: boolean;
    items: PublicFeedItem[];
    onBack: () => void;
    onOpenProfile: (
        userName: string
    ) => void;
}

const BASE_URL =
    'https://kbk-picability-backend.onrender.com';

const STREAKY_USER_ID =
    'picability-system-streaky';

const getStreakReward = (
    count: number
) => {
    if (count >= 1000) return '🚀🌟';
    if (count >= 500) return '🌋';
    if (count >= 400) return '🐉';
    if (count >= 300) return '💎';
    if (count >= 200) return '👑';
    if (count >= 150) return '🏆';
    if (count >= 100) return '☄️';
    if (count >= 80) return '🌶️';
    if (count >= 50) return '💥';
    if (count >= 30) return '⚡';
    if (count >= 20) return '🔥';
    if (count >= 10) return '✨';
    if (count >= 5) return '💨';
    if (count >= 3) return '💧';
    if (count >= 1) return '🧊';

    return null;
};

const formatNameList = (
    names: string[]
) => {
    const usableNames = names
        .filter(Boolean)
        .filter(
            (
                name,
                index,
                values
            ) =>
                values.indexOf(name) === index
        );

    if (usableNames.length === 0) {
        return 'Unknown members';
    }

    if (usableNames.length === 1) {
        return usableNames[0];
    }

    if (usableNames.length === 2) {
        return (
            `${usableNames[0]} and ` +
            `${usableNames[1]}`
        );
    }

    return (
        `${usableNames
            .slice(0, -1)
            .join(', ')}, and ` +
        `${usableNames[
        usableNames.length - 1
        ]}`
    );
};

const getParticipantNames = (
    item: PublicFeedItem
) => {
    if (
        item.participantNames &&
        item.participantNames.length > 0
    ) {
        return item.participantNames;
    }

    if (
        item.members &&
        item.members.length > 0
    ) {
        return item.members.map(
            member => member.userName
        );
    }

    return [
        item.friendName,
        item.partnerName
    ].filter(
        (name): name is string =>
            Boolean(name)
    );
};

const getFailedMemberNames = (
    item: PublicFeedItem
) => {
    if (
        item.failedMemberNames &&
        item.failedMemberNames.length > 0
    ) {
        return item.failedMemberNames;
    }

    if (
        item.failedMembers &&
        item.failedMembers.length > 0
    ) {
        return item.failedMembers.map(
            member => member.userName
        );
    }

    return item.killedBy
        ? [item.killedBy]
        : [];
};

const getScheduleLabel = (
    item: PublicFeedItem
) => {
    const requiredCheckIns = Math.max(
        1,
        item.requiredCheckIns ?? 1
    );

    const cycleLength = Math.max(
        1,
        item.cycleLength ?? 1
    );

    const cycleUnit =
        item.cycleUnit ?? 'Day';

    if (
        requiredCheckIns === 1 &&
        cycleLength === 1 &&
        cycleUnit === 'Day'
    ) {
        return 'Daily';
    }

    const pluralCycleUnit =
        cycleLength === 1
            ? cycleUnit.toLowerCase()
            : `${cycleUnit.toLowerCase()}s`;

    if (requiredCheckIns === 1) {
        if (
            cycleLength === 1 &&
            cycleUnit === 'Week'
        ) {
            return 'Weekly';
        }

        if (
            cycleLength === 1 &&
            cycleUnit === 'Month'
        ) {
            return 'Monthly';
        }

        return (
            `Once every ${cycleLength} ` +
            `${pluralCycleUnit}`
        );
    }

    return (
        `${requiredCheckIns} check-ins every ` +
        `${cycleLength} ${pluralCycleUnit}`
    );
};

const getPeriodLabel = (
    item: PublicFeedItem
) => {
    const cycleLength = Math.max(
        1,
        item.cycleLength ?? 1
    );

    const cycleUnit =
        item.cycleUnit ?? 'Day';

    if (
        cycleLength === 1 &&
        cycleUnit === 'Day'
    ) {
        return 'today';
    }

    if (
        cycleLength === 1 &&
        cycleUnit === 'Week'
    ) {
        return 'this week';
    }

    if (
        cycleLength === 1 &&
        cycleUnit === 'Month'
    ) {
        return 'this month';
    }

    return (
        `this ${cycleLength}-` +
        `${cycleUnit.toLowerCase()} period`
    );
};

const getStreakWindowLabel = (
    item: PublicFeedItem
) => {
    const cycleLength = Math.max(
        1,
        item.cycleLength ?? 1
    );

    const cycleUnit =
        item.cycleUnit ?? 'Day';

    if (
        cycleLength === 1 &&
        cycleUnit === 'Day'
    ) {
        return "today's streak";
    }

    if (
        cycleLength === 1 &&
        cycleUnit === 'Week'
    ) {
        return "this week's streak";
    }

    if (
        cycleLength === 1 &&
        cycleUnit === 'Month'
    ) {
        return "this month's streak";
    }

    return (
        `this ${cycleLength}-` +
        `${cycleUnit.toLowerCase()} streak period`
    );
};

const getCountUnitLabel = (
    item: PublicFeedItem
) => {
    const cycleUnit =
        item.cycleUnit ?? 'Day';

    if (cycleUnit === 'Week') {
        return item.currentCount === 1
            ? 'week'
            : 'weeks';
    }

    if (cycleUnit === 'Month') {
        return item.currentCount === 1
            ? 'month'
            : 'months';
    }

    return item.currentCount === 1
        ? 'day'
        : 'days';
};

export function PublicFeed({
    isDark,
    items,
    onBack,
    onOpenProfile
}: PublicFeedProps) {
    const [
        feedItems,
        setFeedItems
    ] = useState<PublicFeedItem[]>(
        items
    );

    const [
        reactionModal,
        setReactionModal
    ] = useState<any | null>(null);

    const [
        expandedCommentsStreakId,
        setExpandedCommentsStreakId
    ] = useState<number | null>(null);

    const [
        comments,
        setComments
    ] = useState<PublicFeedComment[]>([]);

    const [
        commentDraft,
        setCommentDraft
    ] = useState('');

    const [
        loadingComments,
        setLoadingComments
    ] = useState(false);

    const [
        submittingComment,
        setSubmittingComment
    ] = useState(false);

    const getToken = () => {
        const savedUser =
            localStorage.getItem(
                'picabilityUser'
            );

        return savedUser
            ? JSON.parse(savedUser).token
            : null;
    };

    useEffect(() => {
        setFeedItems(items);
    }, [items]);

    const handleReact = async (
        streakId: number
    ) => {
        const token = getToken();

        if (!token) {
            return;
        }

        try {
            const response = await fetch(
                `${BASE_URL}/api/Streaks/${streakId}/react`,
                {
                    method: 'POST',
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                console.error(
                    'Could not update reaction.',
                    await response.text()
                );

                return;
            }

            const data =
                await response.json();

            setFeedItems(currentItems =>
                currentItems.map(item =>
                    item.id === streakId
                        ? {
                            ...item,

                            reactionCount:
                                data.reactionCount,

                            currentUserReacted:
                                data.reacted,

                            reactionType:
                                data.reactionType,

                            reactionEmoji:
                                data.reactionEmoji
                        }
                        : item
                )
            );
        } catch (error) {
            console.error(
                'Reaction request failed:',
                error
            );
        }
    };

    const openReactionList = async (
        streakId: number
    ) => {
        const token = getToken();

        if (!token) {
            return;
        }

        try {
            const response = await fetch(
                `${BASE_URL}/api/Streaks/${streakId}/reactions`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                console.error(
                    'Could not load reactions.',
                    await response.text()
                );

                return;
            }

            const data =
                await response.json();

            setReactionModal(data);
        } catch (error) {
            console.error(
                'Reaction list request failed:',
                error
            );
        }
    };

    const toggleComments = async (
        item: PublicFeedItem
    ) => {
        if (
            expandedCommentsStreakId ===
            item.id
        ) {
            setExpandedCommentsStreakId(
                null
            );

            setComments([]);
            setCommentDraft('');
            return;
        }

        setExpandedCommentsStreakId(
            item.id
        );

        setCommentDraft('');

        const commentCount =
            item.commentCount ?? 0;

        if (commentCount === 0) {
            setComments([]);
            return;
        }

        if (
            commentCount === 1 &&
            item.previewComment
        ) {
            setComments([
                item.previewComment
            ]);

            return;
        }

        const token =
            getToken();

        if (!token) {
            return;
        }

        try {
            setLoadingComments(true);

            const response =
                await fetch(
                    `${BASE_URL}/api/Streaks/${item.id}/comments`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            if (!response.ok) {
                console.error(
                    'Could not load comments.',
                    await response.text()
                );

                return;
            }

            const data =
                await response.json();

            setComments(data);
        } catch (error) {
            console.error(
                'Comment loading failed:',
                error
            );
        } finally {
            setLoadingComments(false);
        }
    };

    const submitComment = async (
        streakId: number
    ) => {
        const text =
            commentDraft.trim();

        if (
            !text ||
            submittingComment
        ) {
            return;
        }

        const token =
            getToken();

        if (!token) {
            return;
        }

        try {
            setSubmittingComment(true);

            const response =
                await fetch(
                    `${BASE_URL}/api/Streaks/${streakId}/comments`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json',

                            Authorization:
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            text
                        })
                    }
                );

            const contentType =
                response.headers.get(
                    'content-type'
                );

            const result =
                contentType?.includes(
                    'application/json'
                )
                    ? await response.json()
                    : await response.text();

            if (!response.ok) {
                const message =
                    typeof result ===
                        'string'
                        ? result
                        : result.message ??
                        'Could not post comment.';

                alert(message);
                return;
            }

            const newComment =
                result as PublicFeedComment;

            setComments(current => [
                ...current,
                newComment
            ]);

            setCommentDraft('');

            setFeedItems(currentItems =>
                currentItems.map(item => {
                    if (
                        item.id !==
                        streakId
                    ) {
                        return item;
                    }

                    const newCount =
                        (item.commentCount ??
                            0) + 1;

                    return {
                        ...item,

                        commentCount:
                            newCount,

                        previewComment:
                            newCount === 1
                                ? newComment
                                : null
                    };
                })
            );
        } catch (error) {
            console.error(
                'Comment submission failed:',
                error
            );

            alert(
                'Network error while posting comment.'
            );
        } finally {
            setSubmittingComment(false);
        }
    };

    return (
        <div
            className={`min-h-screen p-4 sm:p-6 transition-colors duration-300 ${isDark
                    ? 'bg-gradient-to-br from-slate-900 to-slate-800'
                    : 'bg-gradient-to-br from-slate-50 to-slate-100'
                }`}
        >
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1
                        className={`text-2xl font-semibold ${isDark
                                ? 'text-slate-100'
                                : 'text-slate-800'
                            }`}
                    >
                        Friend Feed
                    </h1>

                    <p
                        className={`text-sm mt-1 ${isDark
                                ? 'text-slate-400'
                                : 'text-slate-600'
                            }`}
                    >
                        Today’s public streak activity
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onBack}
                    className={`hidden md:flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm transition-all ${isDark
                            ? 'bg-slate-800 hover:bg-slate-700'
                            : 'bg-white hover:bg-slate-50'
                        }`}
                    aria-label="Return to streaks"
                >
                    <ArrowLeft
                        className={`w-5 h-5 ${isDark
                                ? 'text-slate-300'
                                : 'text-slate-700'
                            }`}
                    />
                </button>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
                {feedItems.length === 0 && (
                    <div
                        className={`rounded-3xl p-8 text-center shadow-sm ${isDark
                                ? 'bg-slate-800/50 text-slate-300'
                                : 'bg-white text-slate-700'
                            }`}
                    >
                        <div className="text-5xl mb-4">
                            👀
                        </div>

                        <h2 className="text-xl font-bold mb-2">
                            Nothing to flex yet
                        </h2>

                        <p
                            className={`text-sm ${isDark
                                    ? 'text-slate-400'
                                    : 'text-slate-500'
                                }`}
                        >
                            Public completions and broken
                            streaks from your friends will
                            appear here.
                        </p>
                    </div>
                )}

                {feedItems.map(item => {
                    const IconComponent =
                        (LucideIcons as any)[
                        item.habitIcon
                        ] ||
                        LucideIcons.Target;

                    const rewardEmoji =
                        getStreakReward(
                            item.currentCount
                        );

                    const participantNames =
                        getParticipantNames(item);

                    const includesStreaky =
                        item.members?.some(
                            member =>
                                member.userId ===
                                STREAKY_USER_ID
                        ) === true;

                    const failedMemberNames =
                        getFailedMemberNames(item);

                    const isGroupStreak =
                        item.isGroupStreak === true ||
                        (item.memberCount ?? 0) > 2 ||
                        participantNames.length > 2;

                    const visibleFriendNames =
                        item.visibleFriendNames &&
                            item.visibleFriendNames.length > 0
                            ? item.visibleFriendNames
                            : item.friendName
                                ? [item.friendName]
                                : [];

                    const failedLabel =
                        formatNameList(
                            failedMemberNames
                        );

                    const usesMultipleCheckIns =
                        Math.max(
                            1,
                            item.requiredCheckIns ?? 1
                        ) > 1;

                    const periodLabel =
                        getPeriodLabel(item);

                    const streakWindowLabel =
                        getStreakWindowLabel(item);

                    return (
                        <article
                            key={item.id}
                            className={`relative w-full rounded-3xl p-5 sm:p-6 shadow-sm border transition-all ${isDark
                                    ? 'bg-slate-800/60 border-slate-700/60'
                                    : 'bg-white border-slate-200'
                                }`}
                        >
                            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
                                <div className="flex items-start gap-4 min-w-0">
                                    <div
                                        className={`flex items-center justify-center w-16 h-16 min-w-[4rem] min-h-[4rem] shrink-0 rounded-2xl bg-gradient-to-br ${item.failedToday
                                                ? 'from-slate-500 to-slate-700'
                                                : item.color
                                            } shadow-lg`}
                                    >
                                        <IconComponent className="w-8 h-8 text-white" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start gap-2 min-w-0">
                                            <h2
                                                className={`text-lg font-semibold leading-tight whitespace-normal break-words min-w-0 ${isDark
                                                        ? 'text-slate-100'
                                                        : 'text-slate-800'
                                                    }`}
                                            >
                                                {item.habitName}
                                            </h2>

                                            {rewardEmoji && (
                                                <span
                                                    className={`shrink-0 px-2 py-1 rounded-full text-sm leading-none ${isDark
                                                            ? 'bg-slate-700/60'
                                                            : 'bg-slate-100'
                                                        }`}
                                                >
                                                    {rewardEmoji}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            {isGroupStreak && (
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isDark
                                                            ? 'bg-violet-500/15 text-violet-300'
                                                            : 'bg-violet-100 text-violet-700'
                                                        }`}
                                                >
                                                    <Users className="w-3.5 h-3.5" />

                                                    {item.memberCount ??
                                                        participantNames.length}{' '}
                                                    members
                                                </span>
                                            )}

                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isDark
                                                        ? 'bg-slate-700 text-slate-300'
                                                        : 'bg-slate-100 text-slate-600'
                                                    }`}
                                            >
                                                <CalendarDays className="w-3.5 h-3.5" />
                                                {getScheduleLabel(item)}
                                            </span>
                                        </div>

                                        <div
                                            className={`flex items-center gap-1.5 text-sm mt-3 leading-relaxed ${isDark
                                                    ? 'text-slate-300'
                                                    : 'text-slate-700'
                                                }`}
                                        >
                                            <span className="font-semibold">
                                                {participantNames.map(
                                                    (
                                                        participantName,
                                                        index
                                                    ) => (
                                                        <span
                                                            key={`${participantName}-${index}`}
                                                        >
                                                            {index > 0 &&
                                                                (
                                                                    index ===
                                                                        participantNames.length -
                                                                        1
                                                                        ? participantNames.length ===
                                                                            2
                                                                            ? ' and '
                                                                            : ', and '
                                                                        : ', '
                                                                )}

                                                            <ProfileUserLink
                                                                userName={
                                                                    participantName
                                                                }
                                                                onOpenProfile={
                                                                    onOpenProfile
                                                                }
                                                                className={
                                                                    participantName ===
                                                                        'Streaky'
                                                                        ? ''
                                                                        : 'hover:text-teal-400'
                                                                }
                                                                disabled={
                                                                    participantName ===
                                                                    'Streaky'
                                                                }
                                                            >
                                                                {participantName}
                                                            </ProfileUserLink>
                                                        </span>
                                                    )
                                                )}
                                            </span>

                                            {includesStreaky && (
                                                <img
                                                    src="/streaky.png"
                                                    alt="Streaky"
                                                    title="Streaky"
                                                    className="w-6 h-6 rounded-full object-cover shrink-0"
                                                />
                                            )}
                                        </div>

                                        {visibleFriendNames.length > 0 && (
                                            <p
                                                className={`text-xs mt-1 ${isDark
                                                        ? 'text-slate-500'
                                                        : 'text-slate-500'
                                                    }`}
                                            >
                                                Shared by{' '}

                                                {visibleFriendNames.map(
                                                    (
                                                        visibleName,
                                                        index
                                                    ) => (
                                                        <span
                                                            key={`${visibleName}-${index}`}
                                                        >
                                                            {index > 0 &&
                                                                (
                                                                    index ===
                                                                        visibleFriendNames.length -
                                                                        1
                                                                        ? visibleFriendNames.length ===
                                                                            2
                                                                            ? ' and '
                                                                            : ', and '
                                                                        : ', '
                                                                )}

                                                            <ProfileUserLink
                                                                userName={
                                                                    visibleName
                                                                }
                                                                onOpenProfile={
                                                                    onOpenProfile
                                                                }
                                                                className="font-semibold hover:text-teal-400"
                                                            >
                                                                {visibleName}
                                                            </ProfileUserLink>
                                                        </span>
                                                    )
                                                )}
                                            </p>
                                        )}

                                        <div
                                            className={`mt-3 rounded-xl px-3 py-2 border ${item.failedToday
                                                    ? isDark
                                                        ? 'bg-slate-900/30 border-slate-700/70'
                                                        : 'bg-slate-50 border-slate-200'
                                                    : isDark
                                                        ? 'bg-emerald-500/10 border-emerald-500/20'
                                                        : 'bg-emerald-50 border-emerald-200'
                                                }`}
                                        >
                                            <p
                                                className={`text-sm ${item.failedToday
                                                        ? isDark
                                                            ? 'text-rose-300'
                                                            : 'text-rose-700'
                                                        : isDark
                                                            ? 'text-emerald-400'
                                                            : 'text-emerald-700'
                                                    }`}
                                            >
                                                {item.failedToday
                                                    ? failedMemberNames.length > 0
                                                        ? usesMultipleCheckIns
                                                            ? `${failedLabel} did not complete the required check-ins ${periodLabel}.`
                                                            : `${failedLabel} missed ${streakWindowLabel}.`
                                                        : usesMultipleCheckIns
                                                            ? `The required check-ins were not completed ${periodLabel}.`
                                                            : `${streakWindowLabel
                                                                .charAt(0)
                                                                .toUpperCase()}${streakWindowLabel
                                                                    .slice(1)} was missed.`
                                                    : usesMultipleCheckIns
                                                        ? `Completed ${periodLabel}.`
                                                        : `Completed ${periodLabel}.`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center shrink-0 w-[58px]">
                                    <div
                                        className={`text-2xl sm:text-3xl font-bold ${item.failedToday
                                                ? 'text-slate-500'
                                                : `bg-gradient-to-br ${item.color} bg-clip-text text-transparent`
                                            }`}
                                    >
                                        {item.currentCount}
                                    </div>

                                    <span
                                        className={`text-xs font-medium text-center ${isDark
                                                ? 'text-slate-400'
                                                : 'text-slate-600'
                                            }`}
                                    >
                                        {getCountUnitLabel(item)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-500/15 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleReact(item.id)
                                    }
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
                                        ? item.currentUserReacted
                                            ? '💔 Reacted'
                                            : '💔'
                                        : item.currentUserReacted
                                            ? '👊 Bumped'
                                            : '👊'}
                                </button>

                                {(item.reactionCount ?? 0) >
                                    0 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openReactionList(
                                                    item.id
                                                )
                                            }
                                            className={`text-sm font-semibold underline-offset-4 hover:underline ${isDark
                                                    ? 'text-slate-400'
                                                    : 'text-slate-500'
                                                }`}
                                        >
                                            {item.reactionEmoji ||
                                                (item.failedToday
                                                    ? '💔'
                                                    : '👊')}{' '}
                                            {item.reactionCount}
                                        </button>
                                    )}

                                <button
                                    type="button"
                                    onClick={() =>
                                        void toggleComments(
                                            item
                                        )
                                    }
                                    className={`ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold transition-all ${expandedCommentsStreakId ===
                                            item.id
                                            ? isDark
                                                ? 'bg-slate-700 text-slate-100'
                                                : 'bg-slate-200 text-slate-800'
                                            : isDark
                                                ? 'text-slate-400 hover:bg-slate-700/50'
                                                : 'text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    <MessageCircle className="w-4 h-4" />

                                    {(item.commentCount ?? 0) === 0
                                        ? 'Comment'
                                        : (item.commentCount ?? 0) === 1
                                            ? '1 comment'
                                            : `${item.commentCount} comments`}
                                </button>
                            </div>

                            {(item.commentCount ?? 0) === 1 &&
                                item.previewComment &&
                                expandedCommentsStreakId !==
                                item.id && (
                                    <div
                                        className={`mt-3 rounded-2xl px-4 py-3 ${isDark
                                                ? 'bg-slate-900/35'
                                                : 'bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-baseline gap-2 min-w-0">
                                        <ProfileUserLink
                                            userName={
                                                item.previewComment
                                                    .userName
                                            }
                                            onOpenProfile={
                                                onOpenProfile
                                            }
                                            className={`text-sm font-semibold shrink-0 ${isDark
                                                    ? 'text-slate-200 hover:text-teal-400'
                                                    : 'text-slate-800 hover:text-teal-600'
                                                }`}
                                        >
                                            {
                                                item.previewComment
                                                    .userName
                                            }
                                        </ProfileUserLink>

                                            <span
                                                className={`text-sm break-words min-w-0 ${isDark
                                                        ? 'text-slate-400'
                                                        : 'text-slate-600'
                                                    }`}
                                            >
                                                {
                                                    item.previewComment
                                                        .text
                                                }
                                            </span>
                                        </div>
                                    </div>
                                )}

                            {expandedCommentsStreakId ===
                                item.id && (
                                    <div
                                        className={`mt-3 rounded-2xl border p-4 ${isDark
                                                ? 'bg-slate-900/35 border-slate-700/60'
                                                : 'bg-slate-50 border-slate-200'
                                            }`}
                                    >
                                        {loadingComments ? (
                                            <p className="text-sm text-slate-500">
                                                Loading comments...
                                            </p>
                                        ) : comments.length > 0 ? (
                                            <div className="space-y-3 mb-4">
                                                {comments.map(
                                                    comment => (
                                                        <div
                                                            key={
                                                                comment.id
                                                            }
                                                            className="flex gap-3"
                                                        >
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-xs font-bold text-white">
                                                                {comment.userName
                                                                    .substring(
                                                                        0,
                                                                        2
                                                                    )
                                                                    .toUpperCase()}
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex flex-wrap items-baseline gap-x-2">
                                                                    <ProfileUserLink
                                                                        userName={
                                                                            comment.userName
                                                                        }
                                                                        onOpenProfile={
                                                                            onOpenProfile
                                                                        }
                                                                        className={`text-sm font-semibold ${isDark
                                                                                ? 'text-slate-200 hover:text-teal-400'
                                                                                : 'text-slate-800 hover:text-teal-600'
                                                                            }`}
                                                                    >
                                                                        {comment.userName}
                                                                    </ProfileUserLink>

                                                                    <span className="text-xs text-slate-500">
                                                                        {new Date(
                                                                            comment.createdAt
                                                                        ).toLocaleString(
                                                                            undefined,
                                                                            {
                                                                                month:
                                                                                    'short',

                                                                                day:
                                                                                    'numeric',

                                                                                hour:
                                                                                    'numeric',

                                                                                minute:
                                                                                    '2-digit'
                                                                            }
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                <p
                                                                    className={`text-sm mt-1 whitespace-pre-wrap break-words ${isDark
                                                                            ? 'text-slate-400'
                                                                            : 'text-slate-600'
                                                                        }`}
                                                                >
                                                                    {
                                                                        comment.text
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500 mb-4">
                                                No comments yet.
                                            </p>
                                        )}

                                        <div className="flex items-end gap-2">
                                            <textarea
                                                value={commentDraft}
                                                onChange={event =>
                                                    setCommentDraft(
                                                        event.target.value
                                                    )
                                                }
                                                maxLength={500}
                                                rows={1}
                                                placeholder="Add a comment..."
                                                className={`min-h-11 max-h-32 flex-1 resize-y rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500 ${isDark
                                                        ? 'bg-slate-800 text-slate-100 placeholder:text-slate-500'
                                                        : 'bg-white text-slate-800 placeholder:text-slate-400'
                                                    }`}
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void submitComment(
                                                        item.id
                                                    )
                                                }
                                                disabled={
                                                    submittingComment ||
                                                    !commentDraft.trim()
                                                }
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white transition-all hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-40"
                                                aria-label="Post comment"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="mt-1 text-right text-[11px] text-slate-500">
                                            {commentDraft.length}/500
                                        </div>
                                    </div>
                                )}
                        </article>
                    );
                })}
            </div>

            {reactionModal &&
                createPortal(
                    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div
                            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${isDark
                                    ? 'bg-slate-900 border-slate-700 text-slate-100'
                                    : 'bg-white border-slate-200 text-slate-800'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold">
                                    {reactionModal.reactionEmoji}{' '}
                                    Reactions
                                </h2>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setReactionModal(null)
                                    }
                                    className={`p-2 rounded-xl ${isDark
                                            ? 'hover:bg-slate-800'
                                            : 'hover:bg-slate-100'
                                        }`}
                                    aria-label="Close reactions"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[55vh] overflow-y-auto">
                                {reactionModal.users?.length ===
                                    0 ? (
                                    <p className="text-sm text-slate-500">
                                        No reactions yet.
                                    </p>
                                ) : (
                                    reactionModal.users?.map(
                                        (reactionUser: any) => (
                                            <div
                                                key={
                                                    reactionUser.userId
                                                }
                                                className={`p-3 rounded-2xl font-semibold ${isDark
                                                        ? 'bg-slate-800'
                                                        : 'bg-slate-100'
                                                    }`}
                                            >
                                                {
                                                    reactionUser.userName
                                                }
                                            </div>
                                        )
                                    )
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}