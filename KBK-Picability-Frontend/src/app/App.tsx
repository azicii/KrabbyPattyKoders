import { useState } from 'react';
import { HabitSelector } from './components/HabitSelector';
import { StreakTracker, Streak } from './components/StreakTracker';
import { HabitConfig, HabitConfiguration } from './components/HabitConfig';
import { AuthScreen } from './components/AuthScreen'; 
import { UserSearch, User } from './components/UserSearch';
import { FriendsList, PendingRequest } from './components/FriendList';
import { RequestConfirmation } from './components/RequestConfirmation';

type Screen = 'auth' | 'tracker' | 'selector' | 'config' | 'friends-list' | 'user-search' | 'confirmation';

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

  // --- REWORKED STATE ---
  const [preSelectedFriend, setPreSelectedFriend] = useState<User | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [lastRequestConfig, setLastRequestConfig] = useState<{ user: User; habitName: string } | null>(null);

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setCurrentScreen('tracker'); 
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('auth');
  };

  const handleBackToTracker = () => {
    setPreSelectedFriend(null); // Clear context if they back out
    setCurrentScreen('tracker');
  };

  const handleBackToSelector = () => setCurrentScreen('selector');
  const handleBackFromFriendsList = () => setCurrentScreen('tracker');
  const handleBackFromUserSearch = () => setCurrentScreen('friends-list');

  const handleFriends = () => setCurrentScreen('friends-list');
  const handleFindFriends = () => setCurrentScreen('user-search');

  // --- THE NEW FLOW TRIGGER ---
  const handleSelectFriend = (friend: User) => {
    setPreSelectedFriend(friend); // Remember the friend
    setCurrentScreen('selector'); // Send them to pick a habit
  };

  const handleSelectUser = (user: User) => {
    // For new users found in search, we'll treat them like a friend for the request
    handleSelectFriend(user);
  };

  const handleSelectHabit = (habitId: number | 'create') => {
    setSelectedHabitType(habitId);
    setCurrentScreen('config');
  };

  const handleAddHabit = () => setCurrentScreen('selector');
  const handleToggleDark = () => setIsDark(!isDark);

  // --- FINALIZING THE REQUEST ---
  const handleConfirmConfig = (config: HabitConfiguration) => {
    // Priority: 1. Friend from the Friend-First flow | 2. Friend picked in HabitConfig
    const targetFriendId = preSelectedFriend?.id || config.friendId;
    const targetFriendName = preSelectedFriend?.name || config.friendName;

    if (!targetFriendId || !targetFriendName) {
      console.error('No friend available for request');
      return;
    }

    const newPendingRequest: PendingRequest = {
      friendId: targetFriendId,
      habitName: config.name,
      icon: config.iconComponent,
      color: colorGradients[config.color] || 'from-teal-500 to-cyan-600',
    };

    setPendingRequests([...pendingRequests, newPendingRequest]);

    setLastRequestConfig({
      user: {
        id: targetFriendId,
        name: targetFriendName,
        avatar: preSelectedFriend?.avatar || config.friendAvatar || '??',
        username: preSelectedFriend?.username || `@${targetFriendName.toLowerCase().replace(' ', '')}`
      },
      habitName: config.name
    });

    setPreSelectedFriend(null); // Clear context after success
    setCurrentScreen('confirmation');
  };

  const handleConfirmationComplete = () => {
    setLastRequestConfig(null);
    setCurrentScreen('friends-list');
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
        <AuthScreen isDark={isDark} onToggleDark={handleToggleDark} onSuccess={handleAuthSuccess} />
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
          // We can optionally pass preSelectedFriend to HabitConfig to hide the friend picker
          preSelectedFriend={preSelectedFriend} 
        />
      )}

      {currentScreen === 'friends-list' && (
        <FriendsList
          isDark={isDark}
          onToggleDark={handleToggleDark}
          onBack={handleBackFromFriendsList}
          onSelectFriend={handleSelectFriend}
          onFindFriends={handleFindFriends}
          pendingRequests={pendingRequests}
        />
      )}

      {currentScreen === 'user-search' && (
        <UserSearch
          isDark={isDark}
          onToggleDark={handleToggleDark}
          onBack={handleBackFromUserSearch}
          onSelectUser={handleSelectUser}
          selectedUserId={preSelectedFriend?.id}
        />
      )}

      {currentScreen === 'confirmation' && lastRequestConfig && (
        <RequestConfirmation
          isDark={isDark}
          selectedUser={lastRequestConfig.user}
          habitName={lastRequestConfig.habitName}
          onComplete={handleConfirmationComplete}
        />
      )}
    </div>
  );
}