import { useState } from 'react';
import { HabitSelector } from './components/HabitSelector';
import { StreakTracker, Streak } from './components/StreakTracker';
import { HabitConfig, HabitConfiguration } from './components/HabitConfig';
import { AuthScreen } from './components/AuthScreen'; 
import { UserSearch } from './components/FriendList'; // Added UserSearch from Danielle's Sprint

type Screen = 'auth' | 'tracker' | 'selector' | 'config' | 'friends';

const habitNames: { [key: number]: string } = {
  1: 'Exercise',
  2: 'Reading',
  3: 'Hydration',
  4: 'Sleep',
  5: 'Healthy Eating',
  6: 'Meditation',
  7: 'Goal Setting',
};

const colorGradients: { [key: string]: string } = {
  Emerald: 'from-emerald-500 to-teal-600',
  Violet: 'from-violet-500 to-purple-600',
  Sky: 'from-sky-500 to-blue-600',
  Rose: 'from-rose-500 to-pink-600',
  Amber: 'from-amber-500 to-orange-600',
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('tracker');
  const [isDark, setIsDark] = useState(true);
  const [selectedHabitType, setSelectedHabitType] = useState<number | 'create' | null>(null);
  const [streaks, setStreaks] = useState<Streak[]>([]);

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setCurrentScreen('tracker'); 
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('auth');
  };

  const handleBackToTracker = () => {
    setCurrentScreen('tracker');
  };

  const handleBackToSelector = () => {
    setCurrentScreen('selector');
  };

  const handleFriends = () => {
    setCurrentScreen('friends');
  };

  const handleSelectHabit = (habitId: number | 'create') => {
    setSelectedHabitType(habitId);
    setCurrentScreen('config');
  };

  const handleAddHabit = () => {
    setCurrentScreen('selector');
  };

  const handleStreakTap = (streakId: number) => {
    console.log('Tapped streak:', streakId);
  };

  const handleSendMessage = (streakId: number) => {
    console.log('Send message for streak:', streakId);
  };

  const handleSendImage = (streakId: number) => {
    console.log('Send image for streak:', streakId);
  };

  const handleToggleDark = () => {
    setIsDark(!isDark);
  };

  const handleConfirmConfig = (config: HabitConfiguration) => {
    const newStreak: Streak = {
      id: Date.now(),
      habitName: config.name,
      habitIcon: config.iconComponent,
      userName: config.friendName || 'Unknown',
      userAvatar: config.friendAvatar || '??',
      streakCount: 0,
      color: colorGradients[config.color] || 'from-teal-500 to-cyan-600',
    };
    
    setStreaks([...streaks, newStreak]);
    setCurrentScreen('tracker');
  };

  const getPresetHabitName = () => {
    if (selectedHabitType && typeof selectedHabitType === 'number') {
      return habitNames[selectedHabitType] || '';
    }
    return '';
  };

  if (!user) {
    return (
      <div className="size-full">
        <AuthScreen 
          isDark={isDark} 
          onToggleDark={handleToggleDark} 
          onSuccess={handleAuthSuccess} 
        />
      </div>
    );
  }

  return (
    <div className="size-full">
      {currentScreen === 'tracker' && (
        <StreakTracker 
          isDark={isDark}
          user={user}
          onLogout={handleLogout}
          onToggleDark={handleToggleDark}
          onFriends={handleFriends}
          onAddHabit={handleAddHabit}
          onStreakTap={handleStreakTap}
          onSendMessage={handleSendMessage}
          onSendImage={handleSendImage}
          streaks={streaks}
        />
      )}
      
      {currentScreen === 'selector' && (
        <HabitSelector 
          isDark={isDark}
          user={user}
          onLogout={handleLogout}
          onToggleDark={handleToggleDark}
          onBack={handleBackToTracker}
          onFriends={handleFriends}
          onSelectHabit={handleSelectHabit}
        />
      )}
      
      {currentScreen === 'config' && (
        <HabitConfig 
          isDark={isDark}
          onToggleDark={handleToggleDark}
          onBack={handleBackToSelector}
          onFriends={handleFriends}
          onConfirm={handleConfirmConfig}
          habitType={selectedHabitType || undefined}
          presetHabitName={getPresetHabitName()}
        />
      )}

                  {currentScreen === 'friends' && (
        <UserSearch 
          isDark={isDark}
          onToggleDark={handleToggleDark}
          onBack={handleBackToTracker}
          onSelectUser={(selectedUser) => {
            console.log("Selected user:", selectedUser);
          }}
        />
      )}
    </div>
  );
}