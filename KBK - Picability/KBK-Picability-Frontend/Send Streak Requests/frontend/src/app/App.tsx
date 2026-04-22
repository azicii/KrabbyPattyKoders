import { useState } from 'react';
import { HabitSelector } from '../imports/HabitSelector';
import { StreakTracker, Streak } from '../imports/StreakTracker';
import { HabitConfig, HabitConfiguration } from '../imports/HabitConfig';
import { UserSearch, User } from '../imports/UserSearch';
import { StreakRequest } from './components/StreakRequest';
import { FriendsList, PendingRequest } from './components/FriendsList';
import { RequestConfirmation } from './components/RequestConfirmation';

type Screen = 'tracker' | 'selector' | 'config' | 'friends-list' | 'user-search' | 'streak-request' | 'confirmation';

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
  const [currentScreen, setCurrentScreen] = useState<Screen>('tracker');
  const [isDark, setIsDark] = useState(true);
  const [selectedHabitType, setSelectedHabitType] = useState<number | 'create' | null>(null);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [lastRequestConfig, setLastRequestConfig] = useState<{ user: User; habitName: string } | null>(null);

  const handleBackToTracker = () => {
    setCurrentScreen('tracker');
  };

  const handleBackToSelector = () => {
    setCurrentScreen('selector');
  };

  const handleBackFromFriendsList = () => {
    setCurrentScreen('tracker');
  };

  const handleBackFromUserSearch = () => {
    setCurrentScreen('friends-list');
  };

  const handleBackFromStreakRequest = () => {
    setCurrentScreen('friends-list');
  };

  const handleSelectUser = (user: User) => {
    console.log('Selected user:', user);
    setSelectedUser(user);
    setCurrentScreen('streak-request');
  };

  const handleSelectFriend = (user: User) => {
    console.log('Selected friend:', user);
    setSelectedUser(user);
    setCurrentScreen('streak-request');
  };

  const handleFindFriends = () => {
    setCurrentScreen('user-search');
  };

  const handleStreakRequestSent = () => {
    console.log('Streak request sent');
    // Return to tracker after a brief delay (handled in StreakRequest component)
    setTimeout(() => {
      setCurrentScreen('tracker');
      setSelectedUser(null);
    }, 2500);
  };

  const handleFriends = () => {
    console.log('Open friends list');
    setCurrentScreen('friends-list');
  };

  const handleSelectHabit = (habitId: number | 'create') => {
    console.log('Selected habit:', habitId);
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
    console.log('Habit configuration:', config);

    if (!config.friendId || !config.friendName) {
      console.error('No friend selected');
      return;
    }

    // Create pending request
    const newPendingRequest: PendingRequest = {
      friendId: config.friendId,
      habitName: config.name,
      icon: config.iconComponent,
      color: colorGradients[config.color] || 'from-teal-500 to-cyan-600',
    };

    setPendingRequests([...pendingRequests, newPendingRequest]);

    // Store info for confirmation screen
    setLastRequestConfig({
      user: {
        id: config.friendId,
        name: config.friendName,
        avatar: config.friendAvatar || '??',
        username: `@${config.friendName.toLowerCase().replace(' ', '')}`
      },
      habitName: config.name
    });

    // Navigate to confirmation screen
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

  return (
    <div className="size-full">
      {currentScreen === 'tracker' && (
        <StreakTracker
          isDark={isDark}
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

      {currentScreen === 'confirmation' && lastRequestConfig && (
        <RequestConfirmation
          isDark={isDark}
          selectedUser={lastRequestConfig.user}
          habitName={lastRequestConfig.habitName}
          onComplete={handleConfirmationComplete}
        />
      )}

      {currentScreen === 'user-search' && (
        <UserSearch
          isDark={isDark}
          onToggleDark={handleToggleDark}
          onBack={handleBackFromUserSearch}
          onSelectUser={handleSelectUser}
          selectedUserId={selectedUser?.id}
        />
      )}

      {currentScreen === 'streak-request' && selectedUser && (
        <StreakRequest
          isDark={isDark}
          onToggleDark={handleToggleDark}
          onBack={handleBackFromStreakRequest}
          selectedUser={selectedUser}
          onRequestSent={handleStreakRequestSent}
        />
      )}
    </div>
  );
}