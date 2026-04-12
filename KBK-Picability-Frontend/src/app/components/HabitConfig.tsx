import { ArrowLeft, Users, Sun, Moon, Dumbbell, BookOpen, Droplets, Moon as MoonIcon, Apple, Heart, Target, Coffee, Bike, Camera, Code, Music, Palette, Plane, Home, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HabitConfigProps {
  isDark: boolean;
  onToggleDark: () => void;
  onBack?: () => void;
  onFriends?: () => void;
  onConfirm?: (config: HabitConfiguration) => void;
  habitType?: number | 'create';
  presetHabitName?: string;
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

// Mapping from preset habit names to icon labels
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
  presetHabitName = ''
}: HabitConfigProps) {
  const isCustomHabit = habitType === 'create';
  const [habitName, setHabitName] = useState(presetHabitName);
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null);
  const [checkInDays, setCheckInDays] = useState(1);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [showFriendSelect, setShowFriendSelect] = useState(false);

  // Mock friends data
  const mockFriends = [
    { id: '1', name: 'Sarah Johnson', avatar: 'SJ' },
    { id: '2', name: 'Mike Chen', avatar: 'MC' },
    { id: '3', name: 'Emily Rodriguez', avatar: 'ER' },
    { id: '4', name: 'Alex Kim', avatar: 'AK' },
    { id: '5', name: 'Jordan Taylor', avatar: 'JT' },
  ];

  const handleIconClick = (index: number) => {
    setSelectedIconIndex(index);
    setShowColorPicker(index);
  };

  const handleColorSelect = (colorIndex: number) => {
    setSelectedColorIndex(colorIndex);
    setShowColorPicker(null);
  };

  const handleConfirm = () => {
    const friend = mockFriends.find(f => f.id === selectedFriend);
    const config: HabitConfiguration = {
      name: habitName,
      icon: iconOptions[selectedIconIndex].label,
      iconComponent: iconOptions[selectedIconIndex].componentName,
      color: colorOptions[selectedColorIndex].name,
      checkInDays,
      friendId: selectedFriend || undefined,
      friendName: friend?.name,
      friendAvatar: friend?.avatar,
    };
    onConfirm?.(config);
  };

  const SelectedIcon = iconOptions[selectedIconIndex].icon;

  useEffect(() => {
    if (presetHabitName && habitToIconMap[presetHabitName]) {
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
          {isCustomHabit ? 'Create Habit' : 'Configure Habit'}
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

      {/* Configuration Form */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Habit Name - Only for custom habits */}
        {isCustomHabit && (
          <div className={`rounded-3xl p-6 shadow-sm ${
            isDark ? 'bg-slate-800/50 backdrop-blur-sm' : 'bg-white'
          }`}>
            <label className={`block text-sm font-medium mb-3 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Habit Name
            </label>
            <input
              type="text"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              placeholder="Enter habit name..."
              className={`w-full px-4 py-3 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDark 
                  ? 'bg-slate-700 text-slate-100 placeholder-slate-400' 
                  : 'bg-slate-100 text-slate-800 placeholder-slate-500'
              }`}
            />
          </div>
        )}

        {/* Icon Selection */}
        <div className={`rounded-3xl p-6 shadow-sm ${
          isDark ? 'bg-slate-800/50 backdrop-blur-sm' : 'bg-white'
        }`}>
          <label className={`block text-sm font-medium mb-4 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Select Icon & Color
          </label>
          <div className="grid grid-cols-5 gap-3 relative">
            {iconOptions.map((option, index) => {
              const IconComponent = option.icon;
              const isSelected = selectedIconIndex === index;
              const showPicker = showColorPicker === index;
              return (
                <div key={index} className="relative">
                  <button
                    onClick={() => handleIconClick(index)}
                    className={`flex items-center justify-center w-full aspect-square rounded-2xl transition-all duration-200 hover:scale-105 ${
                      isSelected
                        ? `bg-gradient-to-br ${colorOptions[selectedColorIndex].gradient} shadow-lg`
                        : isDark
                        ? 'bg-slate-700 hover:bg-slate-650'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                    aria-label={option.label}
                  >
                    <IconComponent className={`w-6 h-6 ${
                      isSelected 
                        ? 'text-white' 
                        : isDark 
                        ? 'text-slate-300' 
                        : 'text-slate-600'
                    }`} />
                  </button>
                  
                  {/* Color Picker Popup */}
                  {showPicker && (
                    <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 z-10 rounded-xl p-2 shadow-xl ${
                      isDark ? 'bg-slate-700' : 'bg-white'
                    }`}>
                      {/* Arrow pointing up */}
                      <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 ${
                        isDark ? 'bg-slate-700' : 'bg-white'
                      }`} />
                      
                      <div className="relative flex gap-2">
                        {colorOptions.map((color, colorIdx) => (
                          <button
                            key={colorIdx}
                            onClick={() => handleColorSelect(colorIdx)}
                            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color.gradient} transition-all duration-200 hover:scale-110 ${
                              selectedColorIndex === colorIdx ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-700' : ''
                            }`}
                            aria-label={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Check-in Timer */}
        <div className={`rounded-3xl p-6 shadow-sm ${
          isDark ? 'bg-slate-800/50 backdrop-blur-sm' : 'bg-white'
        }`}>
          <label className={`block text-sm font-medium mb-4 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Check-in Frequency
          </label>
          <div className="grid grid-cols-4 gap-3">
            {checkInOptions.map((days) => {
              const isSelected = checkInDays === days;
              return (
                <button
                  key={days}
                  onClick={() => setCheckInDays(days)}
                  className={`px-4 py-3 rounded-2xl transition-all duration-200 hover:scale-105 ${
                    isSelected
                      ? 'bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg'
                      : isDark
                      ? 'bg-slate-700 hover:bg-slate-650'
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <div className={`text-lg font-semibold ${
                    isSelected 
                      ? 'text-white' 
                      : isDark 
                      ? 'text-slate-200' 
                      : 'text-slate-800'
                  }`}>
                    {days}
                  </div>
                  <div className={`text-xs ${
                    isSelected 
                      ? 'text-white/80' 
                      : isDark 
                      ? 'text-slate-400' 
                      : 'text-slate-600'
                  }`}>
                    {days === 1 ? 'day' : 'days'}
                  </div>
                </button>
              );
            })}
          </div>
          <p className={`mt-3 text-sm ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Streak will end if no check-in after {checkInDays} {checkInDays === 1 ? 'day' : 'days'}
          </p>
        </div>

        {/* Friend Selection */}
        <div className={`rounded-3xl p-6 shadow-sm ${
          isDark ? 'bg-slate-800/50 backdrop-blur-sm' : 'bg-white'
        }`}>
          <label className={`block text-sm font-medium mb-4 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Accountability Partner
          </label>
          
          {!showFriendSelect ? (
            <button
              onClick={() => setShowFriendSelect(true)}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] ${
                isDark 
                  ? 'bg-slate-700 hover:bg-slate-650' 
                  : 'bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <span className={`${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {selectedFriend 
                  ? mockFriends.find(f => f.id === selectedFriend)?.name 
                  : 'Select from friends'}
              </span>
              <ChevronRight className={`w-5 h-5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`} />
            </button>
          ) : (
            <div className="space-y-2">
              {mockFriends.map((friend) => {
                const isSelected = selectedFriend === friend.id;
                return (
                  <button
                    key={friend.id}
                    onClick={() => {
                      setSelectedFriend(friend.id);
                      setShowFriendSelect(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 hover:scale-[1.02] ${
                      isSelected
                        ? 'bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg'
                        : isDark
                        ? 'bg-slate-700 hover:bg-slate-650'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : isDark
                        ? 'bg-slate-600 text-slate-300'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {friend.avatar}
                    </div>
                    <span className={`font-medium ${
                      isSelected 
                        ? 'text-white' 
                        : isDark 
                        ? 'text-slate-200' 
                        : 'text-slate-800'
                    }`}>
                      {friend.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={!habitName || !selectedFriend}
          className={`w-full group relative overflow-hidden bg-gradient-to-br from-teal-600 to-cyan-700 rounded-3xl p-6 shadow-lg transition-all duration-300 ${
            !habitName || !selectedFriend
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-2xl hover:scale-[1.02]'
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            <SelectedIcon className="w-6 h-6 text-white" />
            <span className="text-lg font-semibold text-white">
              Start Habit Streak
            </span>
          </div>
          
          {/* Shimmer effect */}
          {habitName && selectedFriend && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          )}
        </button>
      </div>
    </div>
  );
}