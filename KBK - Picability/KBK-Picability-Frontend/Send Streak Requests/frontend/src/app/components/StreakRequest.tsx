import { ArrowLeft, Sun, Moon, Zap, Send } from 'lucide-react';
import { useState } from 'react';
import { User } from '../../imports/UserSearch';

interface StreakRequestProps {
  isDark: boolean;
  onToggleDark: () => void;
  onBack?: () => void;
  selectedUser: User;
  onRequestSent?: () => void;
}

export function StreakRequest({
  isDark,
  onToggleDark,
  onBack,
  selectedUser,
  onRequestSent
}: StreakRequestProps) {
  const [requestSent, setRequestSent] = useState(false);

  const handleSendRequest = () => {
    // Simulate sending request
    setRequestSent(true);

    // Call parent callback after a delay
    setTimeout(() => {
      onRequestSent?.();
    }, 2500);
  };

  if (requestSent) {
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
              {selectedUser.name.split(' ')[0]} can now accept or decline your accountability streak request. You'll be notified when they respond!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-slate-900 to-slate-800'
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-750'
              : 'bg-white'
          }`}
          aria-label="Go back"
        >
          <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
        </button>

        <h1 className={`text-2xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
          Send Streak Request
        </h1>

        <button
          onClick={onToggleDark}
          className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-750'
              : 'bg-white'
          }`}
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </button>
      </div>

      {/* Selected Friend Info */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className={`p-6 rounded-3xl shadow-sm ${
          isDark ? 'bg-slate-800/50 backdrop-blur-sm' : 'bg-white'
        }`}>
          <p className={`text-sm mb-3 ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Sending request to
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-semibold text-xl">
              {selectedUser.avatar}
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${
                isDark ? 'text-slate-100' : 'text-slate-800'
              }`}>
                {selectedUser.name}
              </h2>
              <p className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {selectedUser.username}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Request Message */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className={`p-6 rounded-3xl shadow-sm ${
          isDark ? 'bg-slate-800/50 backdrop-blur-sm' : 'bg-white'
        }`}>
          <div className="text-center">
            <div className="mb-4">
              <Zap className={`w-16 h-16 mx-auto ${
                isDark ? 'text-teal-400' : 'text-teal-600'
              }`} />
            </div>
            <h2 className={`text-xl font-semibold mb-3 ${
              isDark ? 'text-slate-100' : 'text-slate-800'
            }`}>
              Start an Accountability Streak
            </h2>
            <p className={`text-sm leading-relaxed ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Send a streak request to {selectedUser.name.split(' ')[0]}. They can accept or decline your request to start a daily accountability streak together.
            </p>
          </div>
        </div>
      </div>

      {/* Send Button */}
      <div className="max-w-2xl mx-auto">
        <button
          onClick={handleSendRequest}
          className="w-full rounded-3xl py-5 px-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
        >
          <div className="flex items-center justify-center gap-3">
            <Send className="w-6 h-6 text-white" />
            <span className="text-lg font-semibold text-white">
              Send Streak Request
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
