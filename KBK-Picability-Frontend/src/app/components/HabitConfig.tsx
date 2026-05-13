import { ArrowLeft, Users, Sun, Moon, Dumbbell, BookOpen, Droplets, Moon as MoonIcon, Apple, Heart, Target, Coffee, Bike, Camera, Code, Music, Palette, Plane, Home, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { User } from './UserSearch.tsx';

interface HabitConfigProps {
  isDark: boolean;
  onToggleDark: () => void;
  onBack?: () => void;
  onFriends?: () => void;
  onConfirm?: (config: HabitConfiguration) => void;
  habitType?: number | 'create';
  presetHabitName?: string;
  preSelectedFriend?: User | null;
}

export interface HabitConfiguration {
  name: string;
  icon: string;
  iconComponent: string;
  color: string;
  checkInDays: number;
  friendId?: string;
  friendName?: string;
  friendAvatar?: string;
}

const iconOptions = [
  { icon: Dumbbell, label: 'Exercise', componentName: 'Dumbbell' },
  { icon: BookOpen, label: 'Reading', componentName: 'BookOpen' },
  { icon: Droplets, label: 'Hydration', componentName: 'Droplets' },
  { icon: MoonIcon, label: 'Sleep', componentName: 'Moon' },
  { icon: Apple, label: 'Food', componentName: 'Apple' },
  { icon: Heart, label: 'Meditation', componentName: 'Heart' },
  { icon: Target, label: 'Goal', componentName: 'Target' },
  { icon: Coffee, label: 'Coffee', componentName: 'Coffee' },
  { icon: Bike, label: 'Cycling', componentName: 'Bike' },
  { icon: Camera, label: 'Photography', componentName: 'Camera' },
  { icon: Code, label: 'Coding', componentName: 'Code' },
  { icon: Music, label: 'Music', componentName: 'Music' },
  { icon: Palette, label: 'Art', componentName: 'Palette' },
  { icon: Plane, label: 'Travel', componentName: 'Plane' },
  { icon: Home, label: 'Home', componentName: 'Home' },
];

const habitToIconMap: { [key: string]: string } = {
  'Exercise': 'Exercise',
  'Reading': 'Reading',
  'Hydration': 'Hydration',
  'Sleep': 'Sleep',
  'Healthy Eating': 'Food',
  'Meditation': 'Meditation',
  'Goal Setting': 'Goal',
};

const colorOptions = [
  { name: 'Emerald', gradient: 'from-emerald-500 to-teal-600' },
  { name: 'Violet', gradient: 'from-violet-500 to-purple-600' },
  { name: 'Sky', gradient: 'from-sky-500 to-blue-600' },
  { name: 'Rose', gradient: 'from-rose-500 to-pink-600' },
  { name: 'Amber', gradient: 'from-amber-500 to-orange-600' },
];

const checkInOptions = [1, 2, 3, 5, 7, 14, 30];

export function HabitConfig({ 
  isDark, 
  onToggleDark, 
  onBack, 
  onFriends, 
  onConfirm,
  habitType,
  presetHabitName = '',
  preSelectedFriend = null
}: HabitConfigProps) {
  const isCustomHabit = habitType === 'create';
  const [habitName, setHabitName] = useState(presetHabitName);
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null);
  const [checkInDays, setCheckInDays] = useState(1);

  const handleConfirm = () => {
    if (!preSelectedFriend) return;

    const config: HabitConfiguration = {
      name: habitName || presetHabitName,
      icon: iconOptions[selectedIconIndex].label,
      iconComponent: iconOptions[selectedIconIndex].componentName,
      color: colorOptions[selectedColorIndex].name,
      checkInDays,
      friendId: preSelectedFriend.id,
      friendName: preSelectedFriend.name,
      friendAvatar: preSelectedFriend.avatar,
    };
    onConfirm?.(config);
  };

  const SelectedIcon = iconOptions[selectedIconIndex].icon;

  useEffect(() => {
    if (presetHabitName) {
      setHabitName(presetHabitName);
      const iconLabel = habitToIconMap[presetHabitName];
      const index = iconOptions.findIndex(option => option.label === iconLabel);
      if (index !== -1) {
        setSelectedIconIndex(index);
      }
    }
  }, [presetHabitName]);

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
          className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm ${
            isDark ? 'bg-slate-800' : 'bg-white'
          }`}
        >
          <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
        </button>
        <h1 className={`text-2xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
          {isCustomHabit ? 'Create Habit' : 'Configure Habit'}
        </h1>
        <button
          onClick={onToggleDark}
          className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm ${
            isDark ? 'bg-slate-800' : 'bg-white'
          }`}
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Habit Name */}
        <div className={`rounded-3xl p-6 ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
          <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Habit Name
          </label>
          <input
            type="text"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            disabled={!isCustomHabit}
            placeholder="Enter habit name..."
            className={`w-full px-4 py-3 rounded-2xl outline-none transition-all ${
              isDark ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-800'
            } ${!isCustomHabit ? 'opacity-60 cursor-not-allowed' : 'focus:ring-2 focus:ring-teal-500'}`}
          />
        </div>

        {/* Icon & Color */}
        <div className={`rounded-3xl p-6 ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
          <label className="block text-sm font-medium mb-4 text-slate-400">Icon & Theme</label>
          <div className="grid grid-cols-5 gap-3">
            {iconOptions.map((option, index) => {
              const IconComp = option.icon;
              const isSelected = selectedIconIndex === index;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedIconIndex(index)}
                  className={`flex items-center justify-center aspect-square rounded-2xl transition-all ${
                    isSelected ? `bg-gradient-to-br ${colorOptions[selectedColorIndex].gradient} shadow-lg scale-105` : (isDark ? 'bg-slate-700' : 'bg-slate-100')
                  }`}
                >
                  <IconComp className={`w-6 h-6 ${isSelected ? 'text-white' : (isDark ? 'text-slate-400' : 'text-slate-600')}`} />
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 mt-6 justify-center">
            {colorOptions.map((color, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedColorIndex(idx)}
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${color.gradient} ${
                  selectedColorIndex === idx ? 'ring-4 ring-teal-500/30 ring-offset-2' : ''
                }`}
              />
            ))}
          </div>
        </div>

        {/* Accountability Partner */}
        <div className={`rounded-3xl p-6 ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
          <label className="block text-sm font-medium mb-4 text-slate-400">Accountability Partner</label>
          {preSelectedFriend ? (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">
                  {preSelectedFriend.avatar}
                </div>
                <div>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{preSelectedFriend.name}</p>
                  <p className="text-xs text-teal-500">Selected Partner</p>
                </div>
              </div>
              <button onClick={onFriends} className={`text-xs font-medium px-3 py-1 rounded-lg ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                Change
              </button>
            </div>
          ) : (
            <button 
              onClick={onFriends} 
              className={`w-full p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center gap-2 ${
                isDark ? 'border-slate-700 text-slate-500 hover:border-slate-500' : 'border-slate-200 text-slate-400 hover:border-teal-300 hover:text-teal-500'
              }`}
            >
              <Users className="w-8 h-8" />
              <span className="font-medium">Select a Friend to Start</span>
            </button>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirm}
          disabled={!habitName || !preSelectedFriend}
          className={`w-full py-5 rounded-3xl font-bold text-lg shadow-xl transition-all ${
            (!habitName || !preSelectedFriend) 
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-teal-600 to-cyan-700 text-white hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-95'
          }`}
        >
          <div className="flex items-center justify-center gap-3">
             <SelectedIcon className="w-6 h-6" />
             <span>Start Habit Streak</span>
          </div>
        </button>
      </div>
    </div>
  );
}