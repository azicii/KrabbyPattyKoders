import {
    useEffect
} from 'react';
import {
    Users,
    Zap
} from 'lucide-react';
import {
    User
} from './UserSearch.tsx';

interface RequestConfirmationProps {
    isDark: boolean;
    recipients: User[];
    habitName: string;
    onComplete?: () => void;
}

export function RequestConfirmation({
    isDark,
    recipients,
    habitName,
    onComplete
}: RequestConfirmationProps) {
    const isGroupRequest =
        recipients.length > 1;

    const recipientNames =
        recipients.map(
            recipient =>
                recipient.name
        );

    const recipientNameText =
        recipientNames.length === 0
            ? 'your selected friends'
            : recipientNames.length === 1
                ? recipientNames[0]
                : recipientNames.length === 2
                    ? `${recipientNames[0]} and ${recipientNames[1]}`
                    : `${recipientNames
                        .slice(0, -1)
                        .join(', ')}, and ${recipientNames[
                    recipientNames.length - 1
                    ]
                    }`;

    useEffect(() => {
        if (!onComplete) {
            return;
        }

        const timeoutId =
            window.setTimeout(
                onComplete,
                2500
            );

        return () => {
            window.clearTimeout(
                timeoutId
            );
        };
    }, [onComplete]);

    return (
    <div className={`min-h-screen p-6 flex items-center justify-center transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-slate-900 to-slate-800'
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      <div className="max-w-md w-full text-center">
        {/* Success Animation */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 opacity-20 animate-pulse"></div>
          </div>
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 shadow-2xl">
            <Zap className="w-12 h-12 text-white" fill="white" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className={`text-3xl font-semibold mb-4 ${
          isDark ? 'text-slate-100' : 'text-slate-800'
        }`}>
          Request Sent!
        </h1>

        <p className={`text-lg mb-2 ${
          isDark ? 'text-slate-300' : 'text-slate-600'
        }`}>
          Your streak request has been sent to
        </p>

        <div className="flex flex-col items-center gap-3 mb-6">
            <div className="flex items-center justify-center -space-x-3">
                {recipients
                    .slice(0, 4)
                    .map(recipient => (
                        <div
                            key={
                                recipient.id
                            }
                            className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-semibold border-2 ${isDark
                                    ? 'border-slate-900'
                                    : 'border-slate-50'
                                }`}
                            title={
                                recipient.name
                            }
                        >
                            {recipient.avatar}
                        </div>
                    ))}

                {recipients.length > 4 && (
                    <div
                        className={`flex items-center justify-center w-12 h-12 rounded-full font-semibold border-2 ${isDark
                                ? 'bg-slate-700 text-slate-200 border-slate-900'
                                : 'bg-slate-200 text-slate-700 border-slate-50'
                            }`}
                    >
                        +{recipients.length - 4}
                    </div>
                )}

                {recipients.length === 0 && (
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
                        <Users className="w-6 h-6" />
                    </div>
                )}
            </div>

            <span
                className={`text-xl font-semibold leading-relaxed ${isDark
                        ? 'text-slate-100'
                        : 'text-slate-800'
                    }`}
            >
                {recipientNameText}
            </span>
        </div>

        <div className={`mx-auto max-w-sm p-4 rounded-2xl ${
          isDark ? 'bg-slate-800/50' : 'bg-white/50'
        }`}>
          <p className={`text-sm ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {isGroupRequest
                ? (
                    <>
                        Each participant will see your{' '}
                        <span className="font-semibold">
                            {habitName}
                        </span>{' '}
                        group streak request. The streak will begin once everyone accepts.
                    </>
                )
                : (
                    <>
                        {recipientNameText.split(' ')[0]} will see your{' '}
                        <span className="font-semibold">
                            {habitName}
                        </span>{' '}
                        streak request. You&apos;ll be notified when they respond!
                    </>
                )}
          </p>
        </div>
      </div>
    </div>
  );
}