import {
    Loader2,
    Share2,
    X
} from 'lucide-react';

import {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    createPortal
} from 'react-dom';

import type {
    Streak
} from './StreakTracker';

import {
    generateStreakShareImage
} from '../utils/streakShareImage';

interface StreakShareModalProps {
    streak: Streak | null;
    currentUserName: string;
    isDark: boolean;
    onClose: () => void;
}

export function StreakShareModal({
    streak,
    currentUserName,
    isDark,
    onClose
}: StreakShareModalProps) {
    const [
        imageBlob,
        setImageBlob
    ] = useState<Blob | null>(
        null
    );

    const [
        previewUrl,
        setPreviewUrl
    ] = useState<string | null>(
        null
    );

    const [
        generating,
        setGenerating
    ] = useState(false);

    const [
        sharing,
        setSharing
    ] = useState(false);

    const [
        message,
        setMessage
    ] = useState('');

    const participantNames =
        useMemo(() => {
            if (!streak) {
                return [];
            }

            if (
                streak.isGroupStreak &&
                streak.members?.length
            ) {
                return streak.members.map(
                    member =>
                        member.isCurrentUser
                            ? currentUserName
                            : member.userName
                );
            }

            return [
                currentUserName,
                streak.userName
            ].filter(Boolean);
        }, [
            streak,
            currentUserName
        ]);

    useEffect(() => {
        if (!streak) {
            setImageBlob(null);
            setPreviewUrl(null);

            return;
        }

        let disposed = false;

        const createImage =
            async () => {
                try {
                    setGenerating(
                        true
                    );

                    setMessage('');

                    const completed =
                        streak.isGroupStreak
                            ? streak.allMembersCompletedCycle ===
                            true
                            : streak.bothCompletedCycle ===
                            true;

                    const blob =
                        await generateStreakShareImage(
                            {
                                habitName:
                                    streak.habitName,

                                streakCount:
                                    streak.streakCount,

                                cycleLength:
                                    Math.max(
                                        1,
                                        streak.cycleLength ??
                                        1
                                    ),

                                cycleUnit:
                                    streak.cycleUnit ??
                                    'Day',

                                requiredCheckIns:
                                    Math.max(
                                        1,
                                        streak.requiredCheckIns ??
                                        1
                                    ),

                                participantNames,

                                completed,

                                streakColor:
                                    streak.color
                            }
                        );

                    if (disposed) {
                        return;
                    }

                    const url =
                        URL.createObjectURL(
                            blob
                        );

                    setImageBlob(
                        blob
                    );

                    setPreviewUrl(
                        url
                    );
                } catch (
                error
                ) {
                    console.error(
                        'Could not generate streak share image:',
                        error
                    );

                    setMessage(
                        'Could not generate the share image.'
                    );
                } finally {
                    if (!disposed) {
                        setGenerating(
                            false
                        );
                    }
                }
            };

        void createImage();

        return () => {
            disposed = true;
        };
    }, [
        streak,
        participantNames
    ]);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(
                    previewUrl
                );
            }
        };
    }, [previewUrl]);

    if (!streak) {
        return null;
    }

    const safeHabitName =
        streak.habitName
            .toLowerCase()
            .replace(
                /[^a-z0-9]+/g,
                '-'
            )
            .replace(
                /^-|-$/g,
                ''
            );

    const fileName =
        `picability-${safeHabitName || 'streak'}-${streak.streakCount}.png`;

    const shareImage =
        async () => {
            if (
                !imageBlob ||
                sharing
            ) {
                return;
            }

            const file =
                new File(
                    [imageBlob],
                    fileName,
                    {
                        type:
                            'image/png'
                    }
                );

            const shareData = {
                files: [file],

                title:
                    `${streak.habitName} streak`,

                text:
                    `We made it to ${streak.streakCount} on our ${streak.habitName} streak 🔥\n\nhttps://picability.vercel.app`
            };

            const supportsFileSharing =
                typeof navigator.share ===
                'function' &&
                typeof navigator.canShare ===
                'function' &&
                navigator.canShare({
                    files: [file]
                });

            if (
                !supportsFileSharing
            ) {
                setMessage(
                    'Sharing files is not supported on this device.'
                );

                return;
            }

            try {
                setSharing(true);
                setMessage('');

                await navigator.share(
                    shareData
                );
            } catch (
            error: any
            ) {
                /*
                 * AbortError usually means the user simply
                 * closed the system share sheet.
                 */
                if (
                    error?.name !==
                    'AbortError'
                ) {
                    console.error(
                        'Could not share streak:',
                        error
                    );

                    setMessage(
                        'Sharing was not available. You can save the image instead.'
                    );
                }
            } finally {
                setSharing(false);
            }
        };

    return createPortal(
        <div
            className="
                fixed
                inset-0
                z-[220]
                flex
                items-end
                sm:items-center
                justify-center
                bg-black/65
                backdrop-blur-md
                p-4
            "
            onMouseDown={
                onClose
            }
        >
            <div
                className={`
                    relative
                    w-full
                    max-w-md
                    max-h-[calc(100dvh-32px)]
                    overflow-y-auto
                    rounded-[2rem]
                    border
                    shadow-2xl
                    ${isDark
                        ? 'bg-slate-900 border-slate-700'
                        : 'bg-white border-slate-200'
                    }
                `}
                onMouseDown={
                    event =>
                        event.stopPropagation()
                }
            >
                <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4 mb-5">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] font-bold text-teal-500 mb-1">
                                Share your progress
                            </p>

                            <h2
                                className={`text-xl font-bold ${isDark
                                        ? 'text-slate-100'
                                        : 'text-slate-900'
                                    }`}
                            >
                                {streak.habitName}
                            </h2>

                            <p
                                className={`text-sm mt-1 ${isDark
                                        ? 'text-slate-400'
                                        : 'text-slate-500'
                                    }`}
                            >
                                Preview your Picability story
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            className={`
                                flex
                                items-center
                                justify-center
                                w-10
                                h-10
                                rounded-xl
                                shrink-0
                                ${isDark
                                    ? 'bg-slate-800 text-slate-400 hover:text-white'
                                    : 'bg-slate-100 text-slate-500 hover:text-slate-900'
                                }
                            `}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div
                        className={`
                            relative
                            mx-auto
                            aspect-[9/16]
                            max-h-[56vh]
                            overflow-hidden
                            rounded-3xl
                            border
                            ${isDark
                                ? 'bg-slate-950 border-slate-700'
                                : 'bg-slate-100 border-slate-200'
                            }
                        `}
                    >
                        {generating ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-3" />

                                <p className="text-sm text-slate-500">
                                    Creating your story...
                                </p>
                            </div>
                        ) : previewUrl ? (
                            <img
                                src={
                                    previewUrl
                                }
                                alt="Picability streak share preview"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-500">
                                Preview unavailable
                            </div>
                        )}
                    </div>

                    {message && (
                        <p
                            className={`text-sm text-center mt-4 ${isDark
                                    ? 'text-slate-400'
                                    : 'text-slate-600'
                                }`}
                        >
                            {message}
                        </p>
                    )}

                    <div className="mt-5">
                        <button
                            type="button"
                            disabled={
                                !imageBlob ||
                                generating ||
                                sharing
                            }
                            onClick={() =>
                                void shareImage()
                            }
                            className="
                                    w-full
                                    flex
                                    items-center
                                    justify-center
                                    gap-2
                                    py-4
                                    rounded-2xl
                                    bg-gradient-to-r
                                    from-teal-600
                                    to-cyan-700
                                    text-white
                                    font-bold
                                    text-base
                                    shadow-lg
                                    transition-all
                                    active:scale-[0.98]
                                    disabled:opacity-50
                                "
                                     >
                            {sharing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Share2 className="w-5 h-5" />
                            )}

                            {sharing
                                ? 'Opening Share...'
                                : 'Share Streak'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}