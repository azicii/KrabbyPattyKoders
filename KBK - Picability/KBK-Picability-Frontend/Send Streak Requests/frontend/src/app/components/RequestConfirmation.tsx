import { Zap } from 'lucide-react';
import { User } from '../../imports/UserSearch';

interface RequestConfirmationProps {
  isDark: boolean;
  selectedUser: User;
  habitName: string;
  onComplete?: () => void;
}

export function RequestConfirmation({
  isDark,
  selectedUser,
  habitName,
  onComplete
}: RequestConfirmationProps) {
  // Auto-navigate after delay
  if (onComplete) {
    setTimeout(() => {
      onComplete();
    }, 2500);
  }

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

        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-semibold">
            {selectedUser.avatar}
          </div>
          <span className={`text-xl font-semibold ${
            isDark ? 'text-slate-100' : 'text-slate-800'
          }`}>
            {selectedUser.name}
          </span>
        </div>

        <div className={`mx-auto max-w-sm p-4 rounded-2xl ${
          isDark ? 'bg-slate-800/50' : 'bg-white/50'
        }`}>
          <p className={`text-sm ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {selectedUser.name.split(' ')[0]} will see your <span className="font-semibold">{habitName}</span> streak request. You'll be notified when they respond!
          </p>
        </div>
      </div>
    </div>
  );
}
