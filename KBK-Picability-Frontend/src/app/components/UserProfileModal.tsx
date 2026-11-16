import {
    Check,
    Flame,
    Loader2,
    Trophy,
    UserPlus,
    ShieldBan,
    X,
    Zap
} from 'lucide-react';
import {
    useEffect,
    useState
} from 'react';
import { createPortal } from 'react-dom';
import { User } from './UserSearch';

const BASE_URL =
    'https://kbk-picability-backend.onrender.com';

interface UserProfile {
    id: string;
    userName: string;

    highestStreakCount: number;

    highestStreakName?:
    string | null;

    highestStreakIcon?:
    string | null;

    activeStreakCount: number;

    rankEmoji: string;
    rankTitle: string;

    relationshipStatus:
    | 'Self'
    | 'Friends'
    | 'RequestSent'
    | 'RequestReceived'
    | 'None';
}

interface UserProfileModalProps {
    userName: string | null;
    isDark: boolean;
    onClose: () => void;
    onStartStreak: (user: User) => void;
    onFriendRequestSent?: () => void;
    onBlockSuccess?: () => void;
}

export function UserProfileModal({
    userName,
    isDark,
    onClose,
    onStartStreak,
    onFriendRequestSent,
    onBlockSuccess
}: UserProfileModalProps) {
    const [
        profile,
        setProfile
    ] = useState<UserProfile | null>(
        null
    );

    const [
        loading,
        setLoading
    ] = useState(false);

    const [
        error,
        setError
    ] = useState('');

    const [
        sendingFriendRequest,
        setSendingFriendRequest
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
        if (!userName) {
            setProfile(null);
            setError('');
            return;
        }

        const fetchProfile = async () => {
            const token = getToken();

            if (!token) {
                setError(
                    'You must be signed in to view profiles.'
                );
                return;
            }

            try {
                setLoading(true);
                setError('');
                setProfile(null);

                const response =
                    await fetch(
                        `${BASE_URL}/api/Users/profile/${encodeURIComponent(
                            userName
                        )}`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
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
                            'Could not load this profile.';

                    setError(message);
                    return;
                }

                setProfile(
                    result as UserProfile
                );
            } catch (err) {
                console.error(
                    'Profile loading failed:',
                    err
                );

                setError(
                    'Could not connect to the server.'
                );
            } finally {
                setLoading(false);
            }
        };

        void fetchProfile();
    }, [userName]);

    if (!userName) {
        return null;
    }

    const sendFriendRequest = async () => {
        if (
            !profile ||
            sendingFriendRequest
        ) {
            return;
        }

        const token = getToken();

        if (!token) {
            return;
        }

        try {
            setSendingFriendRequest(true);

            const response =
                await fetch(
                    `${BASE_URL}/api/FriendRequests`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json',

                            Authorization:
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            receiverId:
                                profile.id
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
                        'Could not send friend request.';

                setError(message);
                return;
            }

            setProfile(current =>
                current
                    ? {
                        ...current,
                        relationshipStatus:
                            'RequestSent'
                    }
                    : current
            );

            onFriendRequestSent?.();
        } catch (err) {
            console.error(
                'Friend request failed:',
                err
            );

            setError(
                'Network error while sending friend request.'
            );
        } finally {
            setSendingFriendRequest(
                false
            );
        }
    };

    // PROFILE_REPORT_STATE
    const [showReportForm, setShowReportForm] = useState(false);
    const [reportReason, setReportReason] = useState('Harassment');
    const [reportDetails, setReportDetails] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);
    const [reportFeedback, setReportFeedback] = useState('');
    // BLOCK_PROFILE_ACTION
    const [blockingUser, setBlockingUser] = useState(false);

    const blockProfileUser = async () => {
        if (!profile || profile.relationshipStatus === 'Self' || blockingUser) {
            return;
        }

        const confirmed = window.confirm(
            `Block ${profile.userName}?

This permanently deletes any friendship and all streaks you share, including shared group streaks. Other group members may lose those streaks too.

You will no longer be able to interact with each other. Unblocking later will not restore deleted friendships or streaks.

Continue?`
        );

        if (!confirmed) return;

        const token = getToken();

        if (!token) {
            setError('You must be signed in to block someone.');
            return;
        }

        try {
            setBlockingUser(true);
            setError('');

            const response = await fetch(
                `${BASE_URL}/api/user-blocks/${encodeURIComponent(profile.id)}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Blocking failed (${response.status}).`);
            }

            onBlockSuccess?.();
            onClose();
        } catch (err) {
            console.error('Profile blocking failed:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to block this user.'
            );
        } finally {
            setBlockingUser(false);
        }
    };

    // PROFILE_REPORT_HANDLER
    const submitProfileReport = async () => {
        if (!profile || profile.relationshipStatus === 'Self' || submittingReport) {
            return;
        }

        const token = getToken();

        if (!token) {
            setReportFeedback('You must be signed in to report someone.');
            return;
        }

        setSubmittingReport(true);
        setReportFeedback('');

        try {
            const response = await fetch(`${BASE_URL}/api/reports`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reportedUserId: profile.id,
                    reason: reportReason,
                    details: reportDetails.trim()
                })
            });

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || `Report failed (${response.status}).`);
            }

            setShowReportForm(false);
            setReportDetails('');
            setReportFeedback('Report submitted successfully. Thank you.');
        } catch (err) {
            setReportFeedback(
                err instanceof Error
                    ? err.message
                    : 'Unable to submit your report.'
            );
        } finally {
            setSubmittingReport(false);
        }
    };
    const startStreak = () => {
        if (!profile) {
            return;
        }

        const user: User = {
            id: profile.id,

            name:
                profile.userName,

            username:
                `@${profile.userName
                    .toLowerCase()
                    .replace(
                        /\s+/g,
                        ''
                    )}`,

            avatar:
                profile.userName
                    .substring(
                        0,
                        2
                    )
                    .toUpperCase()
        };

        onStartStreak(user);
    };

    const relationshipDisplay = () => {
        if (!profile) {
            return null;
        }

        switch (
        profile.relationshipStatus
        ) {
            case 'Self':
                return (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/15 text-slate-400 text-sm font-semibold">
                        <Check className="w-4 h-4" />
                        This is you
                    </div>
                );

            case 'Friends':
                return (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-sm font-semibold">
                        <Check className="w-4 h-4" />
                        Friends
                    </div>
                );

            case 'RequestSent':
                return (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-400 text-sm font-semibold">
                        <Check className="w-4 h-4" />
                        Request sent
                    </div>
                );

            case 'RequestReceived':
                return (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/15 text-violet-400 text-sm font-semibold">
                        <UserPlus className="w-4 h-4" />
                        Sent you a request
                    </div>
                );

            default:
                return null;
        }
    };

    return createPortal(
        <div
            className="
                fixed
                inset-0
                z-[300]
                flex
                items-center
                justify-center
                p-4
                bg-black/60
                backdrop-blur-sm
            "
            onMouseDown={onClose}
        >
            <div
                className={`
                    relative
                    w-full
                    max-w-md
                    rounded-[2rem]
                    border
                    shadow-2xl
                    overflow-hidden
                    ${isDark
                        ? 'bg-slate-900 border-slate-700'
                        : 'bg-white border-slate-200'
                    }
                `}
                onMouseDown={event =>
                    event.stopPropagation()
                }
            >
                <div
                    className="
                        h-2
                        bg-gradient-to-r
                        from-teal-500
                        via-cyan-500
                        to-teal-600
                    "
                />

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close profile"
                    className={`
                        absolute
                        top-5
                        right-5
                        flex
                        items-center
                        justify-center
                        w-10
                        h-10
                        rounded-xl
                        transition-colors
                        ${isDark
                            ? 'bg-slate-800 text-slate-400 hover:text-white'
                            : 'bg-slate-100 text-slate-500 hover:text-slate-900'
                        }
                    `}
                >
                    <X className="w-5 h-5" />
                </button>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 className="w-9 h-9 text-teal-500 animate-spin mb-4" />

                        <p className="text-sm text-slate-500">
                            Loading profile...
                        </p>
                    </div>
                ) : error && !profile ? (
                    <div className="px-8 py-20 text-center">
                        <p className="text-rose-400 font-medium">
                            {error}
                        </p>
                    </div>
                ) : profile ? (
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col items-center text-center">
                            <div
                                className="
                                    flex
                                    items-center
                                    justify-center
                                    w-20
                                    h-20
                                    rounded-[1.6rem]
                                    bg-gradient-to-br
                                    from-teal-500
                                    to-cyan-600
                                    text-white
                                    text-2xl
                                    font-bold
                                    shadow-lg
                                    mb-4
                                "
                            >
                                {profile.userName
                                    .substring(
                                        0,
                                        2
                                    )
                                    .toUpperCase()}
                            </div>

                            <h2
                                className={`text-2xl font-bold ${isDark
                                        ? 'text-slate-100'
                                        : 'text-slate-900'
                                    }`}
                            >
                                {profile.userName}
                            </h2>

                            <p className="text-sm text-slate-500 mt-1 mb-3">
                                @{profile.userName
                                    .toLowerCase()
                                    .replace(
                                        /\s+/g,
                                        ''
                                    )}
                            </p>

                            {relationshipDisplay()}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-7">
                            <div
                                className={`rounded-2xl border p-4 ${isDark
                                        ? 'bg-slate-800 border-slate-700'
                                        : 'bg-slate-50 border-slate-200'
                                    }`}
                            >
                                <div className="flex items-center gap-2 text-amber-400 mb-2">
                                    <Trophy className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wide">
                                        Best streak
                                    </span>
                                </div>

                                <p
                                    className={`text-2xl font-bold ${isDark
                                            ? 'text-slate-100'
                                            : 'text-slate-900'
                                        }`}
                                >
                                    {
                                        profile.highestStreakCount
                                    }
                                </p>

                                <p className="text-xs text-slate-500 mt-1 truncate">
                                    {profile.highestStreakName ??
                                        'No streak yet'}
                                </p>
                            </div>

                            <div
                                className={`rounded-2xl border p-4 ${isDark
                                        ? 'bg-slate-800 border-slate-700'
                                        : 'bg-slate-50 border-slate-200'
                                    }`}
                            >
                                <div className="flex items-center gap-2 text-orange-400 mb-2">
                                    <Flame className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wide">
                                        Active
                                    </span>
                                </div>

                                <p
                                    className={`text-2xl font-bold ${isDark
                                            ? 'text-slate-100'
                                            : 'text-slate-900'
                                        }`}
                                >
                                    {
                                        profile.activeStreakCount
                                    }
                                </p>

                                <p className="text-xs text-slate-500 mt-1">
                                    active streak
                                    {profile.activeStreakCount ===
                                        1
                                        ? ''
                                        : 's'}
                                </p>
                            </div>
                        </div>

                                <div
                                    className={`mt-3 flex items-center justify-between rounded-2xl border px-4 py-3 ${isDark
                                            ? 'bg-slate-800/60 border-slate-700'
                                            : 'bg-slate-50 border-slate-200'
                                        }`}
                                >
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                            Rank
                                        </p>

                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-2xl leading-none">
                                                {profile.rankEmoji}
                                            </span>

                                            <span
                                                className={`font-bold ${isDark
                                                        ? 'text-slate-200'
                                                        : 'text-slate-800'
                                                    }`}
                                            >
                                                {profile.rankTitle}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">
                                            Best streak
                                        </p>

                                        <p
                                            className={`font-bold ${isDark
                                                    ? 'text-slate-200'
                                                    : 'text-slate-800'
                                                }`}
                                        >
                                            {profile.highestStreakCount}
                                        </p>
                                    </div>
                                </div>

                        {error && (
                            <div className="mt-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">
                                {error}
                            </div>
                        )}

                        {profile.relationshipStatus !==
                            'Self' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                                    {profile.relationshipStatus ===
                                        'None' && (
                                            <button
                                                type="button"
                                                disabled={
                                                    sendingFriendRequest
                                                }
                                                onClick={
                                                    sendFriendRequest
                                                }
                                                className="
                                            flex
                                            items-center
                                            justify-center
                                            gap-2
                                            px-4
                                            py-3.5
                                            rounded-2xl
                                            bg-slate-800
                                            hover:bg-slate-700
                                            text-slate-100
                                            font-semibold
                                            transition-all
                                            disabled:opacity-60
                                        "
                                            >
                                                {sendingFriendRequest ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <UserPlus className="w-5 h-5" />
                                                )}

                                                Add Friend
                                            </button>
                                        )}

                                    {profile.relationshipStatus ===
                                        'RequestSent' && (
                                            <button
                                                type="button"
                                                disabled
                                                className="
                                            flex
                                            items-center
                                            justify-center
                                            gap-2
                                            px-4
                                            py-3.5
                                            rounded-2xl
                                            bg-slate-800
                                            text-slate-500
                                            font-semibold
                                            cursor-default
                                        "
                                            >
                                                <Check className="w-5 h-5" />
                                                Request Sent
                                            </button>
                                        )}

                                    {profile.relationshipStatus ===
                                        'RequestReceived' && (
                                            <div
                                                className="
                                            flex
                                            items-center
                                            justify-center
                                            px-4
                                            py-3.5
                                            rounded-2xl
                                            bg-violet-500/10
                                            text-violet-400
                                            font-semibold
                                            text-sm
                                        "
                                            >
                                                Friend request pending
                                            </div>
                                        )}

                                    {profile.relationshipStatus ===
                                        'Friends' && (
                                            <div
                                                className="
                                            flex
                                            items-center
                                            justify-center
                                            gap-2
                                            px-4
                                            py-3.5
                                            rounded-2xl
                                            bg-emerald-500/10
                                            text-emerald-400
                                            font-semibold
                                        "
                                            >
                                                <Check className="w-5 h-5" />
                                                Friends
                                            </div>
                                        )}

                                        {profile.relationshipStatus ===
                                            'Friends' && (
                                                <button
                                                    type="button"
                                                    onClick={
                                                        startStreak
                                                    }
                                                    className="
                                                    flex
                                                    items-center
                                                    justify-center
                                                    gap-2
                                                    px-4
                                                    py-3.5
                                                    rounded-2xl
                                                    bg-gradient-to-r
                                                    from-teal-600
                                                    to-cyan-700
                                                    text-white
                                                    font-semibold
                                                    shadow-lg
                                                    hover:scale-[1.02]
                                                    active:scale-[0.98]
                                                    transition-all
                                                "
                                                >
                                                    <Zap className="w-5 h-5" />
                                                    Start Streak
                                                </button>
                                            )}
                                    {/* PROFILE_REPORT_UI */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowReportForm(value => !value);
                                            setReportFeedback('');
                                        }}
                                        disabled={submittingReport}
                                        className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-semibold transition-all disabled:opacity-60"
                                    >
                                        Report User
                                    </button>

                                    {(showReportForm || reportFeedback) && (
                                        <div className={`col-span-full rounded-2xl border p-4 ${
                                            isDark
                                                ? 'border-slate-700 bg-slate-800/50'
                                                : 'border-slate-200 bg-slate-50'
                                        }`}>
                                            {showReportForm && (
                                                <div className="space-y-3">
                                                    <h3 className="font-semibold">
                                                        Report {profile.userName}
                                                    </h3>

                                                    <p className="text-sm text-slate-500">
                                                        Reports are reviewed by an administrator.
                                                        Reporting does not automatically block this user.
                                                    </p>

                                                    <label className="block text-sm font-medium">
                                                        Reason
                                                        <select
                                                            value={reportReason}
                                                            onChange={event =>
                                                                setReportReason(event.target.value)
                                                            }
                                                            disabled={submittingReport}
                                                            className={`mt-1 w-full rounded-xl border p-3 ${
                                                                isDark
                                                                    ? 'border-slate-600 bg-slate-900 text-white'
                                                                    : 'border-slate-300 bg-white text-slate-900'
                                                            }`}
                                                        >
                                                            {[
                                                                'Harassment',
                                                                'Inappropriate Content',
                                                                'Spam',
                                                                'Impersonation',
                                                                'Other'
                                                            ].map(reason => (
                                                                <option key={reason} value={reason}>
                                                                    {reason}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>

                                                    <label className="block text-sm font-medium">
                                                        Additional details (optional)
                                                        <textarea
                                                            value={reportDetails}
                                                            onChange={event =>
                                                                setReportDetails(event.target.value)
                                                            }
                                                            maxLength={1000}
                                                            rows={3}
                                                            disabled={submittingReport}
                                                            placeholder="Describe what happened..."
                                                            className={`mt-1 w-full resize-y rounded-xl border p-3 ${
                                                                isDark
                                                                    ? 'border-slate-600 bg-slate-900 text-white'
                                                                    : 'border-slate-300 bg-white text-slate-900'
                                                            }`}
                                                        />
                                                    </label>

                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={submitProfileReport}
                                                            disabled={submittingReport}
                                                            className="flex-1 rounded-xl bg-amber-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
                                                        >
                                                            {submittingReport
                                                                ? 'Submitting...'
                                                                : 'Submit Report'}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowReportForm(false);
                                                                setReportFeedback('');
                                                            }}
                                                            disabled={submittingReport}
                                                            className="rounded-xl border border-slate-500 px-4 py-3 font-semibold disabled:opacity-60"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {reportFeedback && (
                                                <p role="status" className="mt-2 text-sm">
                                                    {reportFeedback}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={blockProfileUser}
                                        disabled={blockingUser}
                                        className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-semibold transition-all disabled:opacity-60"
                                    >
                                        {blockingUser
                                            ? <Loader2 className="w-5 h-5 animate-spin" />
                                            : <ShieldBan className="w-5 h-5" />}
                                        Block User
                                    </button>
                                </div>
                            )}
                    </div>
                ) : null}
            </div>
        </div>,
        document.body
    );
}