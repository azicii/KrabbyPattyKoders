import { Users, Sun, Moon, Plus, MessageSquare, Image, ChevronDown, LogOut } from 'lucide-react';
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
}

export type { Streak };

interface StreakTrackerProps {
  isDark: boolean;
  user: any; // Added to receive user data from App.tsx
  onLogout: () => void; // Added to trigger logout function
  onToggleDark: () => void;
  onFriends?: () => void;
  onAddHabit?: () => void;
  onStreakTap?: (streakId: number) => void;
  onSendMessage?: (streakId: number) => void;
  onSendImage?: (streakId: number) => void;
  streaks: Streak[];
}

export function StreakTracker({ 
  isDark, 
  user,
  onLogout,
  onToggleDark, 
  onFriends, 
  onAddHabit, 
  onStreakTap,
  onSendMessage,
  onSendImage,
  streaks
}: StreakTrackerProps) {
  const [expandedStreakId, setExpandedStreakId] = useState<number | null>(null);

  const handleStreakClick = (streakId: number) => {
    setExpandedStreakId(expandedStreakId === streakId ? null : streakId);
    onStreakTap?.(streakId);
  };

  const handleSendMessage = (streakId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onSendMessage?.(streakId);
    console.log('Send message for streak:', streakId);
  };

  const handleSendImage = (streakId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onSendImage?.(streakId);
    console.log('Send image for streak:', streakId);
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 to-slate-800' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <h1 className={`text-2xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
            My Streaks
          </h1>
          {/* Dynamic Greeting */}
          <div className="flex items-center gap-2 mt-1">
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Hi, <span className="font-semibold text-teal-500">{user?.userName}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={onToggleDark}
            className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 ${
              isDark ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white'
            }`}
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>
          
          {/* Friends List */}
          <button
            onClick={onFriends}
            className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 ${
              isDark ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white'
            }`}
            aria-label="Friends list"
          >
            <Users className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 border border-transparent hover:border-rose-500/30 ${
              isDark ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white'
            }`}
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5 text-rose-500" />
          </button>
        </div>
      </div>

      {/* Streaks List */}
      <div className="max-w-2xl mx-auto space-y-4 mb-6">
        {streaks.map((streak) => {
          const isExpanded = expandedStreakId === streak.id;
          const IconComponent = (LucideIcons as any)[streak.habitIcon] || LucideIcons.Target;
          
          return (
            <div key={streak.id} className="w-full">
              <button
                onClick={() => handleStreakClick(streak.id)}
                className={`group w-full relative overflow-hidden rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${
                  isDark 
                    ? 'bg-slate-800/50 backdrop-blur-sm' 
                    : 'bg-white'
                } ${isExpanded ? 'rounded-b-none' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${streak.color} shadow-lg`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="text-left">
                      <h3 className={`text-lg font-semibold ${
                        isDark ? 'text-slate-100' : 'text-slate-800'
                      }`}>
                        {streak.habitName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          isDark 
                            ? 'bg-slate-700 text-slate-300' 
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {streak.userAvatar}
                        </div>
                        <span className={`text-sm ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          {streak.userName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`text-3xl font-bold bg-gradient-to-br ${streak.color} bg-clip-text text-transparent`}>
                        {streak.streakCount}
                      </div>
                      <span className={`text-xs font-medium ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {streak.streakCount === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 transition-transform duration-300 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      } ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                <div className={`absolute inset-0 bg-gradient-to-br ${streak.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl ${isExpanded ? 'rounded-b-none' : ''}`} />
              </button>

              {isExpanded && (
                <div className={`rounded-b-3xl overflow-hidden shadow-lg transition-all duration-300 ${
                  isDark 
                    ? 'bg-slate-800/50 backdrop-blur-sm' 
                    : 'bg-white'
                }`}>
                  <div className="px-6 pb-6">
                    <div className={`text-sm font-medium mb-3 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Maintain Streak
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={(e) => handleSendMessage(streak.id, e)}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all duration-200 hover:scale-105 ${
                          isDark 
                            ? 'bg-slate-700 hover:bg-slate-650' 
                            : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        <MessageSquare className={`w-5 h-5 ${
                          isDark ? 'text-teal-400' : 'text-teal-600'
                        }`} />
                        <span className={`font-medium ${
                          isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          Send Message
                        </span>
                      </button>
                      
                      <button
                        onClick={(e) => handleSendImage(streak.id, e)}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all duration-200 hover:scale-105 ${
                          isDark 
                            ? 'bg-slate-700 hover:bg-slate-650' 
                            : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        <LucideIcons.Image className={`w-5 h-5 ${
                          isDark ? 'text-cyan-400' : 'text-cyan-600'
                        }`} />
                        <span className={`font-medium ${
                          isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          Send Image
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={onAddHabit}
          className="group w-full relative overflow-hidden bg-gradient-to-br from-teal-600 to-cyan-700 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold text-white group-hover:text-white/90 transition-colors">
              Start New Habit Streak
            </span>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </button>
      </div>

      {streaks.length === 0 && (
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className={`text-6xl mb-4 ${isDark ? 'opacity-50' : 'opacity-30'}`}>
            🎯
          </div>
          <h2 className={`text-xl font-semibold mb-2 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            No Active Streaks
          </h2>
          <p className={`text-sm mb-6 ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Start your first habit streak with a friend!
          </p>
        </div>
      )}
    </div>
  );
}