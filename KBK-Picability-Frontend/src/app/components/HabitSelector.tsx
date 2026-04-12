import { ArrowLeft, Users, Dumbbell, BookOpen, Droplets, Moon, Apple, Heart, Target, Plus, Sun } from 'lucide-react';

const presetHabits = [
  { id: 1, name: 'Exercise', icon: Dumbbell, color: 'from-emerald-500 to-teal-600' },
  { id: 2, name: 'Reading', icon: BookOpen, color: 'from-violet-500 to-purple-600' },
  { id: 3, name: 'Hydration', icon: Droplets, color: 'from-sky-500 to-blue-600' },
  { id: 4, name: 'Sleep', icon: Moon, color: 'from-indigo-500 to-violet-600' },
  { id: 5, name: 'Healthy Eating', icon: Apple, color: 'from-rose-500 to-pink-600' },
  { id: 6, name: 'Meditation', icon: Heart, color: 'from-amber-500 to-orange-600' },
  { id: 7, name: 'Goal Setting', icon: Target, color: 'from-cyan-500 to-teal-600' },
];

interface HabitSelectorProps {
  isDark: boolean;
  user: any;          
  onLogout: () => void; 
  onToggleDark: () => void;
  onBack: () => void;
  onFriends: () => void;
  onSelectHabit: (habitId: number | 'create') => void;
}

export function HabitSelector({ isDark, onToggleDark, onBack, onFriends, onSelectHabit }: HabitSelectorProps) {
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
          Select a Habit
        </h1>
        
        <div className="flex items-center gap-2">
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
          
          <button
            onClick={onFriends}
            className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-750' 
                : 'bg-white'
            }`}
            aria-label="Friends list"
          >
            <Users className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
          </button>
        </div>
      </div>

      {/* Habits Grid */}
      <div className="max-w-2xl mx-auto grid grid-cols-1 gap-4 mb-6">
        {presetHabits.map((habit) => {
          const IconComponent = habit.icon;
          return (
            <button
              key={habit.id}
              onClick={() => onSelectHabit?.(habit.id)}
              className={`group relative overflow-hidden rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${
                isDark 
                  ? 'bg-slate-800/50 backdrop-blur-sm' 
                  : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${habit.color} shadow-lg`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <span className={`text-xl font-medium transition-colors ${
                  isDark 
                    ? 'text-slate-200 group-hover:text-slate-100' 
                    : 'text-slate-800 group-hover:text-slate-900'
                }`}>
                  {habit.name}
                </span>
              </div>
              
              {/* Subtle gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${habit.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl`} />
            </button>
          );
        })}

        {/* Create Your Own Option */}
        <button
          onClick={() => onSelectHabit?.('create')}
          className="group relative overflow-hidden bg-gradient-to-br from-teal-600 to-cyan-700 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Plus className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-semibold text-white group-hover:text-white/90 transition-colors">
              Create Your Own
            </span>
          </div>
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </button>
      </div>
    </div>
  );
}