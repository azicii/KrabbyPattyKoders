import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Users, Plus, Check, Zap } from 'lucide-react';
import { StreaksDisplay, ActiveStreak, PendingStreakRequest, FailedStreak } from './components/StreaksDisplay';
import { ConversationView } from './components/ConversationView';
import { FriendsList } from './components/FriendsList';
import { HabitSelector, presetHabits } from './components/HabitSelector';
import { HabitConfig, HabitConfiguration } from './components/HabitConfig';
import { User } from './components/UserSearch';

type Screen = 'streaks' | 'conversation' | 'friends-list' | 'habit-selector' | 'habit-config';

// Interface to match the object returned by AuthController.cs
interface AuthUser {
  id: string;
  userName: string;
  email: string;
}

// Internal interface for raw database requests
interface BackendStreak {
  id: number;
  userOneId: string;
  userTwoId: string;
  habitName: string;
  currentCount: number;
  isActive: boolean;
  status: 'Active' | 'Expired';
  startedAt: string;
  lastCompletedAt: string;
  failedAt: string | null;
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('streaks');
  const [isDark, setIsDark] = useState(true);
  const [activeStreaks, setActiveStreaks] = useState<ActiveStreak[]>([]);
  const [pendingStreaks, setPendingStreaks] = useState<PendingStreakRequest[]>([]);
  const [failedStreaks, setFailedStreaks] = useState<FailedStreak[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  const handleAuthSuccess = (userData: AuthUser) => {
    setUser(userData);
    setCurrentScreen('streaks'); 
    console.log('Login successful for user ID:', userData.id);
  };  

 useEffect(() => { 
  const fetchStreaks = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('http://localhost:5232/api/Streaks');
      const data = await response.json();

      const pendingResponse = await fetch(
        'http://localhost:5232/api/StreakRequests'
      );


      const pendingData = await pendingResponse.json();

      const pendingOnly = pendingData.filter(
        (request: any) => request.status === 'Pending'
      );

      setPendingStreaks(
        pendingOnly.map((request: any) => ({
          id: request.id,
          friendName: 'Friend',
          friendAvatar: 'FR',
          habitName: request.habitName,
          sentDate: request.createdAt,
          status: 'pending',
        }))
      );

      // Separate active and failed streaks
      const active = data.filter((streak: BackendStreak) =>
          streak.isActive && streak.status === 'Active'
      );

      const failed = data.filter((streak: BackendStreak) =>
          !streak.isActive || streak.status === 'Expired'
      );

      // Map backend data to frontend UI format
      setActiveStreaks(
        active.map((streak: BackendStreak) => ({
          id: streak.id,
          friendName: 'Friend',
          friendAvatar: 'FR',
          habitName: streak.habitName,
          currentStreak: streak.currentCount,
          color: 'from-emerald-500 to-teal-600',
          lastUpdated: streak.lastCompletedAt,
        }))
      );

      setFailedStreaks(
        failed.map((streak: BackendStreak) => ({
          id: streak.id,
          friendName: 'Friend',
          friendAvatar: 'FR',
          habitName: streak.habitName,
          previousStreak: streak.currentCount,
          failedDate: streak.failedAt || 'Unknown',
          failedBy: 'both',
        }))
      );

    } catch (error) {
      console.error('Error fetching streaks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchStreaks();
}, []);


  const [selectedStreakForConversation, setSelectedStreakForConversation] = useState<ActiveStreak | null>(null);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [selectedStreakForPhoto, setSelectedStreakForPhoto] = useState<ActiveStreak | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [selectedHabitType, setSelectedHabitType] = useState<number | 'create' | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleToggleDark = () => {
    setIsDark(!isDark);
  };

  const handleStreakTap = (streakId: number) => {
    const streak = activeStreaks.find(s => s.id === streakId);
    if (streak) {
      setSelectedStreakForConversation(streak);
      setCurrentScreen('conversation');
    }
  };

  const handleSendMessage = (streakId: number) => {
    const streak = activeStreaks.find(s => s.id === streakId);
    if (streak) {
      setSelectedStreakForConversation(streak);
      setCurrentScreen('conversation');
    }
  };

  const handleSendImage = (streakId: number) => {
    const streak = activeStreaks.find(s => s.id === streakId);
    if (streak) {
      setSelectedStreakForPhoto(streak);
      setShowPhotoUploadModal(true);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!uploadedPhoto || !selectedStreakForPhoto) return;

    if (!user) {
    alert('You must be logged in');
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5232/api/Streaks/${selectedStreakForPhoto.id}/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to complete streak');
    }

    const updatedStreak = await response.json();

    setActiveStreaks(prev =>
      prev.map(streak =>
        streak.id === selectedStreakForPhoto.id
          ? {
              ...streak,
              currentStreak: streak.currentStreak + 1,
              lastUpdated: 'Just now',
            }
          : streak
      )
    );

    setShowPhotoUploadModal(false);
    setUploadedPhoto(null);
    setSelectedStreakForPhoto(null);
    setShowSuccessPopup(true);

    setTimeout(() => {
      setShowSuccessPopup(false);
    }, 3000);

  } catch (error) {
      console.error(error);
      alert('Failed to complete streak');
  }
};

  const handleClosePhotoModal = () => {
    setShowPhotoUploadModal(false);
    setUploadedPhoto(null);
    setSelectedStreakForPhoto(null);
  };

  const handleAddStreak = () => {
    setCurrentScreen('habit-selector');
  };

  const handleBackToStreaks = () => {
    setCurrentScreen('streaks');
    setSelectedStreakForConversation(null);
  };

  const handleRestartStreak = (streakId: number) => {
    const failedStreak = failedStreaks.find(s => s.id === streakId);
    if (failedStreak) {
      const newActiveStreak: ActiveStreak = {
        id: failedStreak.id,
        friendName: failedStreak.friendName,
        friendAvatar: failedStreak.friendAvatar,
        habitName: failedStreak.habitName,
        currentStreak: 0,
        color: 'from-emerald-500 to-teal-600',
        lastUpdated: 'Just now',
      };
      setActiveStreaks(prev => [...prev, newActiveStreak]);
      setFailedStreaks(prev => prev.filter(s => s.id !== streakId));
    }
  };

  const handleFriends = () => {
    setCurrentScreen('friends-list');
  };

  const handleSelectHabit = (habitId: number | 'create') => {
    setSelectedHabitType(habitId);
    setCurrentScreen('habit-config');
  };

  const handleSelectFriend = (user: User) => {
    setSelectedFriend(user);
    setCurrentScreen('habit-selector');
  };

  const handleHabitConfirm = (config: HabitConfiguration) => {
    const colorMap: { [key: string]: string } = {
      'Emerald': 'from-emerald-500 to-teal-600',
      'Violet': 'from-violet-500 to-purple-600',
      'Sky': 'from-sky-500 to-blue-600',
      'Rose': 'from-rose-500 to-pink-600',
      'Amber': 'from-amber-500 to-orange-600',
    };

    const newStreak: ActiveStreak = {
      id: Math.max(...activeStreaks.map(s => s.id), ...failedStreaks.map(s => s.id)) + 1,
      friendName: config.friendName || '',
      friendAvatar: config.friendAvatar || '',
      habitName: config.name,
      currentStreak: 0,
      color: colorMap[config.color] || 'from-emerald-500 to-teal-600',
      lastUpdated: 'Just created',
    };

    setActiveStreaks(prev => [...prev, newStreak]);
    setSelectedHabitType(null);
    setSelectedFriend(null);
    setCurrentScreen('streaks');
  };

  if (currentScreen === 'conversation' && selectedStreakForConversation) {
    return (
      <ConversationView
        isDark={isDark}
        streak={selectedStreakForConversation}
        onToggleDark={handleToggleDark}
        onBack={handleBackToStreaks}
      />
    );
  }

  if (currentScreen === 'friends-list') {
    return (
      <FriendsList
        isDark={isDark}
        onToggleDark={handleToggleDark}
        onBack={handleBackToStreaks}
        onSelectFriend={handleSelectFriend}
      />
    );
  }

  if (currentScreen === 'habit-selector') {
    return (
      <HabitSelector
        isDark={isDark}
        onToggleDark={handleToggleDark}
        onBack={() => {
          if (selectedFriend) {
            setCurrentScreen('friends-list');
          } else {
            setCurrentScreen('streaks');
          }
          setSelectedFriend(null);
        }}
        onFriends={handleFriends}
        onSelectHabit={handleSelectHabit}
      />
    );
  }

  if (currentScreen === 'habit-config' && selectedHabitType !== null) {
    const habitName = selectedHabitType === 'create'
      ? ''
      : presetHabits.find(h => h.id === selectedHabitType)?.name || '';

    return (
      <HabitConfig
        isDark={isDark}
        onToggleDark={handleToggleDark}
        onBack={() => setCurrentScreen('habit-selector')}
        onFriends={handleFriends}
        onConfirm={handleHabitConfirm}
        habitType={selectedHabitType}
        presetHabitName={habitName}
        preSelectedFriend={selectedFriend}
      />
    );
  }

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-slate-900 to-slate-800'
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-3xl ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
          My Streaks
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleDark}
            className="flex items-center justify-center w-10 h-10 transition-all duration-200 hover:scale-105"
          >
            {isDark ? (
              <Sun className="w-6 h-6 text-amber-400" />
            ) : (
              <Moon className="w-6 h-6 text-slate-600" />
            )}
          </button>

          <button
            onClick={handleFriends}
            className="flex items-center justify-center w-10 h-10 transition-all duration-200 hover:scale-105"
          >
            <Users className={`w-6 h-6 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
          </button>
        </div>
      </div>

      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`relative rounded-3xl shadow-2xl overflow-hidden p-8 max-w-md ${
            isDark ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 opacity-20 animate-pulse"></div>
                </div>
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 shadow-2xl">
                  <Zap className="w-10 h-10 text-white" fill="white" />
                </div>
              </div>

              <h2 className={`text-2xl mb-2 ${
                isDark ? 'text-slate-100' : 'text-slate-800'
              }`}>
                Streak Complete!
              </h2>

              <p className={`text-lg ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Great job! Your streak is complete for the day.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto mb-6">
        <button
          onClick={handleAddStreak}
          className="w-full rounded-3xl py-4 px-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/20">
              <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg text-white">
              Start New Habit Streak
            </span>
          </div>
        </button>
      </div>


      {/* Loading State */}
      {isLoading ? (
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4"></div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Loading your streaks...
            </p>
          </div>
        </div>
      ) : (
        <>

      <StreaksDisplay
        isDark={isDark}
        activeStreaks={activeStreaks}
        pendingStreaks={pendingStreaks}
        failedStreaks={failedStreaks}
        onStreakTap={handleStreakTap}
        onSendMessage={handleSendMessage}
        onSendImage={handleSendImage}
        onRestartStreak={handleRestartStreak}
      />

      {showPhotoUploadModal && selectedStreakForPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-800' : 'bg-white'
            }`}>
            <div className={`p-6 border-b ${
              isDark ? 'border-slate-700' : 'border-slate-200'
              }`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`flex items-center justify-center w-12 h-12 rounded-2xl text-white bg-gradient-to-br ${selectedStreakForPhoto.color}`}>
                  {selectedStreakForPhoto.friendAvatar}
                </div>
                <div>
                  <h3 className={`${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    Upload Photo for {selectedStreakForPhoto.habitName}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    with {selectedStreakForPhoto.friendName}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {uploadedPhoto ? (
                <div className="space-y-4">
                  <img
                    src={uploadedPhoto}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-contain rounded-2xl"
                  />
                  <div className={`flex items-center gap-2 p-3 rounded-xl ${
                    isDark ? 'bg-green-900/20' : 'bg-green-50'
                  }`}>
                    <Check className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`}/>
                    <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                      Photo selected! Click upload to maintain your streak.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className={`w-full py-20 border-2 border-dashed rounded-2xl transition-all duration-200 hover:scale-[1.02] ${
                      isDark
                        ? 'border-slate-600 hover:border-teal-500 hover:bg-slate-700/30'
                        : 'border-slate-300 hover:border-teal-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className={`flex items-center justify-center w-16 h-16 rounded-full ${
                        isDark ? 'bg-slate-700' : 'bg-slate-100'
                      }`}>
                        <Plus className={`w-8 h-8 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}/>
                      </div>
                      <div>
                        <p className={`mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          Choose a photo
                        </p>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Click to select a photo from your device
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 flex gap-3">
              <button
                onClick={handleClosePhotoModal}
                className={`flex-1 py-3 px-4 rounded-xl transition-all duration-200 ${
                  isDark
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleUploadPhoto}
                disabled={!uploadedPhoto}
                className={`flex-1 py-3 px-4 rounded-xl transition-all duration-200 ${
                  uploadedPhoto
                    ? 'bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white hover:scale-105'
                    : isDark
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Upload Photo
              </button>
            </div>
          </div>
        </div>
       )}
      </>
    )}
  </div>
);
}