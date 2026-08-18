import {
    Download,
    Loader2,
    Sparkles
} from 'lucide-react';

import {
    useEffect,
    useState
} from 'react';

import {
    dismissPicabilityUpdate,
    installPicabilityUpdate,
    subscribeToPicabilityUpdates
} from '../../pwaUpdateManager';

interface AppUpdatePromptProps {
    isDark: boolean;
}

export function AppUpdatePrompt({
    isDark
}: AppUpdatePromptProps) {
    const [
        updateAvailable,
        setUpdateAvailable
    ] = useState(false);

    const [
        installing,
        setInstalling
    ] = useState(false);

    useEffect(() => {
        return subscribeToPicabilityUpdates(
            available => {
                setUpdateAvailable(
                    available
                );
            }
        );
    }, []);

    if (!updateAvailable) {
        return null;
    }

    const handleUpdate =
        async () => {
            if (installing) {
                return;
            }

            try {
                setInstalling(
                    true
                );

                await installPicabilityUpdate();
            } catch {
                setInstalling(
                    false
                );
            }
        };

    const handleLater = () => {
        dismissPicabilityUpdate();
    };

    return (
        <div
            className="
                fixed
                left-4
                right-4
                bottom-24
                z-[500]
                mx-auto
                max-w-lg
                animate-in
                fade-in
                slide-in-from-bottom-4
                duration-300
            "
        >
            <div
                className={`
                    overflow-hidden
                    rounded-2xl
                    border
                    shadow-2xl
                    backdrop-blur-xl
                    ${isDark
                        ? 'bg-slate-900/95 border-slate-700'
                        : 'bg-white/95 border-slate-200'
                    }
                `}
            >
                <div className="flex">
                    <div className="flex min-w-0 flex-1 gap-3 p-4">
                        <div
                            className="
                                flex
                                h-10
                                w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                bg-teal-500/15
                                text-teal-400
                            "
                        >
                            <Sparkles className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                            <p
                                className={`font-semibold ${isDark
                                        ? 'text-slate-100'
                                        : 'text-slate-900'
                                    }`}
                            >
                                A new version of Picability is available
                            </p>

                            <p
                                className={`mt-1 text-sm ${isDark
                                        ? 'text-slate-400'
                                        : 'text-slate-600'
                                    }`}
                            >
                                Update to get the latest features and fixes.
                            </p>
                        </div>
                    </div>

                    <div
                        className={`
                            flex
                            w-28
                            shrink-0
                            flex-col
                            border-l
                            ${isDark
                                ? 'border-slate-700'
                                : 'border-slate-200'
                            }
                        `}
                    >
                        <button
                            type="button"
                            disabled={
                                installing
                            }
                            onClick={
                                handleUpdate
                            }
                            className={`
                                flex
                                flex-1
                                items-center
                                justify-center
                                gap-1.5
                                border-b
                                px-3
                                py-3
                                text-xs
                                font-bold
                                uppercase
                                tracking-wide
                                transition-colors
                                ${isDark
                                    ? 'border-slate-700 text-teal-400 hover:bg-slate-800'
                                    : 'border-slate-200 text-teal-600 hover:bg-slate-50'
                                }
                                disabled:opacity-60
                            `}
                        >
                            {installing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}

                            {installing
                                ? 'Updating'
                                : 'Update'}
                        </button>

                        <button
                            type="button"
                            disabled={
                                installing
                            }
                            onClick={
                                handleLater
                            }
                            className={`
                                flex-1
                                px-3
                                py-3
                                text-xs
                                font-bold
                                uppercase
                                tracking-wide
                                transition-colors
                                ${isDark
                                    ? 'text-slate-300 hover:bg-slate-800'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }
                                disabled:opacity-50
                            `}
                        >
                            Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}