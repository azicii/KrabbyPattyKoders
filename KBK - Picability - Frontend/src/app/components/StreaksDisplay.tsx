import { Zap, Clock, Calendar, MessageCircle, Image as ImageIcon, XCircle, AlertCircle, RotateCcw, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export interface ActiveStreak {
  id: number;
  friendName: string;
  friendAvatar: string;
  habitName: string;
  currentStreak: number;
  color: string;
  lastUpdated: string;
}

export interface PendingStreakRequest {
  id: number;
  friendName: string;
  friendAvatar: string;
  habitName: string;
  sentDate: string;
  status: 'pending' | 'waiting';
}

export interface FailedStreak {
  id: number;
  friendName: string;
  friendAvatar: string;
  habitName: string;
  previousStreak: number;
  failedDate: string;
  failedBy: 'you' | 'friend' | 'both';
}

interface StreaksDisplayProps {
  isDark: boolean;
  activeStreaks: ActiveStreak[];
  pendingStreaks: PendingStreakRequest[];
  failedStreaks: FailedStreak[];
  onStreakTap?: (streakId: number) => void;
  onSendMessage?: (streakId: number) => void;
  onSendImage?: (streakId: number) => void;
  onRestartStreak?: (streakId: number) => void;
}

export function StreaksDisplay({
  isDark,
  activeStreaks,
  pendingStreaks,
  failedStreaks,
  onStreakTap,
  onSendMessage,
  onSendImage,
  onRestartStreak
}: StreaksDisplayProps) {
  const [pendingExpanded, setPendingExpanded] = useState(true);
  const [failedExpanded, setFailedExpanded] = useState(true);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {activeStreaks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
            <h2 className={`text-xl ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              Active Streaks
            </h2>
            <span className={`ml-auto text-sm px-3 py-1 rounded-full ${
              isDark ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-100 text-teal-700'
            }`}>
              {activeStreaks.length}
            </span>
          </div>

          <div className="space-y-3">
            {activeStreaks.map((streak) => (
              <div
                key={streak.id}
                className={`group relative overflow-hidden rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${
                  isDark
                    ? 'bg-slate-800/50 backdrop-blur-sm'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-2xl text-white bg-gradient-to-br ${streak.color}`}>
                      {streak.friendAvatar}
                    </div>
                    <div>
                      <h3 className={`${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        {streak.friendName}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {streak.habitName}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onStreakTap?.(streak.id)}
                    className={`flex flex-col items-center px-4 py-2 rounded-2xl transition-all duration-200 hover:scale-105 bg-gradient-to-br ${streak.color}`}
                  >
                    <span className="text-2xl text-white">
                      {streak.currentStreak}
                    </span>
                    <span className="text-xs text-white/90">
                      day{streak.currentStreak !== 1 ? 's' : ''}
                    </span>
                  </button>
                </div>

                <div className={`flex items-center gap-2 text-xs mb-3 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Last updated: {streak.lastUpdated}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onSendMessage?.(streak.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl transition-all duration-200 hover:scale-105 ${
                      isDark
                        ? 'bg-slate-700 hover:bg-slate-600'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    <MessageCircle className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
                    <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Message
                    </span>
                  </button>

                  <button
                    onClick={() => onSendImage?.(streak.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl transition-all duration-200 hover:scale-105 ${
                      isDark
                        ? 'bg-slate-700 hover:bg-slate-600'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    <ImageIcon className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
                    <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Photo
                    </span>
                  </button>
                </div>

                <div className={`absolute inset-0 bg-gradient-to-br ${streak.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-3xl pointer-events-none`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingStreaks.length > 0 && (
        <div>
          <button
            onClick={() => setPendingExpanded(!pendingExpanded)}
            className="w-full flex items-center gap-2 mb-4 group"
          >
            <Clock className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <h2 className={`text-xl ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              Pending Requests
            </h2>
            <span className={`ml-auto text-sm px-3 py-1 rounded-full ${
              isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
            }`}>
              {pendingStreaks.length}
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${
              pendingExpanded ? 'rotate-180' : ''
            } ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
          </button>

          {pendingExpanded && <div className="space-y-3">
            {pendingStreaks.map((request) => (
              <div
                key={request.id}
                className={`rounded-3xl p-5 shadow-sm ${
                  isDark
                    ? 'bg-slate-800/50 backdrop-blur-sm'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                      {request.friendAvatar}
                    </div>
                    <div>
                      <h3 className={`${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        {request.friendName}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {request.habitName}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                    isDark
                      ? 'bg-amber-900/30'
                      : 'bg-amber-100'
                  }`}>
                    <Clock className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                      Pending
                    </span>
                  </div>
                </div>

                <div className={`mt-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Sent {request.sentDate}
                </div>
              </div>
            ))}
          </div>}
        </div>
      )}

      {failedStreaks.length > 0 && (
        <div>
          <button
            onClick={() => setFailedExpanded(!failedExpanded)}
            className="w-full flex items-center gap-2 mb-4 group"
          >
            <XCircle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            <h2 className={`text-xl ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              Failed Streaks
            </h2>
            <span className={`ml-auto text-sm px-3 py-1 rounded-full ${
              isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
            }`}>
              {failedStreaks.length}
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${
              failedExpanded ? 'rotate-180' : ''
            } ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
          </button>

          {failedExpanded && <div className="space-y-3">
            {failedStreaks.map((failed) => (
              <div
                key={failed.id}
                className={`rounded-3xl p-5 shadow-sm border-2 ${
                  isDark
                    ? 'bg-slate-800/50 backdrop-blur-sm border-red-900/30'
                    : 'bg-white border-red-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white opacity-70">
                        {failed.friendAvatar}
                      </div>
                      <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-red-600">
                        <XCircle className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    </div>
                    <div>
                      <h3 className={`${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        {failed.friendName}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {failed.habitName}
                      </p>
                    </div>
                  </div>

                  <div className={`flex flex-col items-center px-4 py-2 rounded-2xl ${
                    isDark ? 'bg-red-900/20' : 'bg-red-50'
                  }`}>
                    <span className={`text-2xl ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      {failed.previousStreak}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-red-400/70' : 'text-red-600/70'}`}>
                      day{failed.previousStreak !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className={`flex items-center gap-2 mb-3 p-3 rounded-xl ${
                  isDark ? 'bg-red-900/20' : 'bg-red-50'
                }`}>
                  <AlertCircle className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  <div className="flex-1">
                    <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      Streak Failed
                      {failed.failedBy === 'you' && ' - You missed a day'}
                      {failed.failedBy === 'friend' && ` - ${failed.friendName.split(' ')[0]} missed a day`}
                      {failed.failedBy === 'both' && ' - Both missed a day'}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Failed on {failed.failedDate}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onRestartStreak?.(failed.id)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl transition-all duration-200 hover:scale-105 ${
                    isDark
                      ? 'bg-slate-700 hover:bg-slate-600'
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <RotateCcw className={`w-4 h-4 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                  <span className={`text-sm ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                    Restart Streak
                  </span>
                </button>
              </div>
            ))}
          </div>}
        </div>
      )}

      {activeStreaks.length === 0 && pendingStreaks.length === 0 && failedStreaks.length === 0 && (
        <div className="text-center py-16">
          <div className={`text-6xl mb-4 ${isDark ? 'opacity-50' : 'opacity-30'}`}>
            ⚡
          </div>
          <h2 className={`text-xl mb-2 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            No Active Streaks
          </h2>
          <p className={`text-sm ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Start a streak with a friend to begin your accountability journey
          </p>
        </div>
      )}
    </div>
  );
}
