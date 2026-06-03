import { useState, useEffect } from 'react';
import { HabitSelector } from './components/HabitSelector.tsx';
import { StreakTracker, Streak } from './components/StreakTracker.tsx';
import { HabitConfig, HabitConfiguration } from './components/HabitConfig.tsx';
import { AuthScreen } from './components/AuthScreen';
import { UserSearch, User } from './components/UserSearch.tsx';
import { FriendsList, PendingRequest } from './components/FriendList.tsx';
import { RequestConfirmation } from './components/RequestConfirmation.tsx';

type Screen = 'auth' | 'tracker' | 'selector' | 'config' | 'friends-list' | 'user-search' | 'confirmation';

interface AuthUser {
    id: string;
    userName: string;
    email: string;
}

const habitNames: { [key: number]: string } = {
    1: 'Exercise',
    2: 'Reading',
    3: 'Hydration',
    4: 'Sleep',
    5: 'Healthy Eating',
    6: 'Meditation',
    7: 'Goal Setting',
};

const getIconForHabit = (name: string) => {
    const map: { [key: string]: string } = {
        'Exercise': 'Dumbbell',
        'Reading': 'BookOpen',
        'Hydration': 'Droplets',
        'Sleep': 'Moon',
        'Healthy Eating': 'Apple',
        'Meditation': 'Wind',
        'Goal Setting': 'Target',
    };
    return map[name] || 'Target';
};

const getColorForHabit = (name: string) => {
    const map: { [key: string]: string } = {
        'Exercise': 'from-emerald-500 to-teal-600',
        'Reading': 'from-violet-500 to-purple-600',
        'Hydration': 'from-sky-500 to-blue-600',
        'Sleep': 'from-indigo-500 to-purple-600',
        'Healthy Eating': 'from-rose-500 to-pink-600',
        'Meditation': 'from-cyan-500 to-blue-600',
    };
    return map[name] || 'from-teal-500 to-cyan-600';
};

// const BASE_URL = 'http://localhost:5232';
const BASE_URL = 'https://kbk-picability20260528161204-dwgwf6eehmf5bjeu.canadacentral-01.azurewebsites.net';

export default function App() {
    const [user, setUser] = useState<AuthUser | null>(() => {
        const savedUser = localStorage.getItem('picabilityUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [currentScreen, setCurrentScreen] = useState<Screen>('tracker');
    const [isDark, setIsDark] = useState(true);
    const [selectedHabitType, setSelectedHabitType] = useState<number | 'create' | null>(null);
    const [streaks, setStreaks] = useState<Streak[]>([]);
    const [preSelectedFriend, setPreSelectedFriend] = useState<User | null>(null);
    const [lastRequestConfig, setLastRequestConfig] = useState<{ user: User; habitName: string } | null>(null);
    const [streakInvites, setStreakInvites] = useState<any[]>([]);
    const [sentStreakRequests, setSentStreakRequests] = useState<any[]>([]);

    const fetchStreaks = async () => {
        if (!user) return;
        try {
            const response = await fetch(`${BASE_URL}/api/Streaks/user/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                const formattedStreaks: Streak[] = data.map((s: any) => ({
                    id: s.id,
                    habitName: s.habitName,
                    habitIcon: s.habitIcon,
                    color: s.color,
                    userName: s.partnerName,
                    userAvatar: s.partnerName.substring(0, 2).toUpperCase(),
                    streakCount: s.currentCount,
                    lastCompletedAt: s.lastCompletedAt,
                    lastFullyCompletedAt: s.lastFullyCompletedAt,
                    userOneLastCheckedInAt: s.userOneLastCheckedInAt,
                    userTwoLastCheckedInAt: s.userTwoLastCheckedInAt,
                    userCheckedInToday: s.userCheckedInToday,
                    partnerCheckedInToday: s.partnerCheckedInToday,
                    bothCheckedInToday: s.bothCheckedInToday,
                    isActive: s.isActive
                }));
                setStreaks(formattedStreaks);
            }
        } catch (err) {
            console.error("Error fetching streaks:", err);
        }
    };

    const fetchStreakInvites = async () => {
        if (!user) return;
        try {
            const response = await fetch(`${BASE_URL}/api/StreakRequests/receiver/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setStreakInvites(data);
            }
        } catch (err) {
            console.error("Error fetching streak invites:", err);
        }
    };

    const fetchSentStreakRequests = async () => {
        if (!user) return;
        try {
            const response = await fetch(`${BASE_URL}/api/StreakRequests/sender/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setSentStreakRequests(data);
            }
        } catch (err) {
            console.error("Error fetching sent streak requests:", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchStreaks();
            fetchStreakInvites();
            fetchSentStreakRequests();
        }
    }, [user]);

    const handleCheckIn = async (streakId: number) => {
        if (!user) return;
        try {
            const response = await fetch(`${BASE_URL}/api/Streaks/${streakId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });
            if (response.ok) fetchStreaks();
        } catch (err) {
            console.error("Check-in error:", err);
        }
    };

    const handleDismissStreak = async (streakId: number) => {
        try {
            const response = await fetch(`${BASE_URL}/api/Streaks/${streakId}/dismiss`, {
                method: 'DELETE'
            });
            if (response.ok) fetchStreaks();
        } catch (err) {
            console.error("Dismiss error:", err);
        }
    };

    // UPDATED: Now returns a boolean so the UI can respond immediately
    const handleRemoveFriend = async (friendId: string, friendName: string) => {
        if (!user) return false;

        const confirmRemoval = window.confirm(`Removing ${friendName} will permanently delete all shared streaks. Proceed?`);
        if (!confirmRemoval) return false;

        try {
            // 1. Remove Shared Streaks first
            await fetch(`${BASE_URL}/api/Streaks/remove-connection/${user.id}/${friendId}`, {
                method: 'DELETE'
            });

            // 2. Remove the Friendship
            const response = await fetch(`${BASE_URL}/api/Friends/${user.id}/${friendId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // 3. Refresh the main tracker streaks
                fetchStreaks();
                return true;
            }
            return false;
        } catch (err) {
            console.error("Error removing friend:", err);
            return false;
        }
    };

    const handleAuthSuccess = (userData: AuthUser) => {
        localStorage.setItem('picabilityUser', JSON.stringify(userData));
        setUser(userData);
        setCurrentScreen('tracker');
    };

    const handleSelectFriend = (friend: User) => {
        setPreSelectedFriend(friend);
        if (selectedHabitType) {
            setCurrentScreen('config');
        } else {
            setCurrentScreen('selector');
        }
    };

    const handleAddHabit = () => {
        setPreSelectedFriend(null);
        setSelectedHabitType(null);
        setCurrentScreen('selector');
    };

    const handleAcceptStreakInvite = async (requestId: number) => {
        try {
            const response = await fetch(`${BASE_URL}/api/StreakRequests/accept/${requestId}`, {
                method: 'POST'
            });
            if (response.ok) {
                setTimeout(() => {
                    fetchStreakInvites();
                    fetchSentStreakRequests();
                    fetchStreaks();
                }, 800);
            }
        } catch (err) {
            console.error("Error accepting streak:", err);
        }
    };

    const handleRejectStreakInvite = async (requestId: number) => {
        try {
            const response = await fetch(`${BASE_URL}/api/StreakRequests/reject/${requestId}`, {
                method: 'POST'
            });

            if (response.ok) {
                fetchStreakInvites();
                fetchSentStreakRequests();
                fetchStreaks();
            } else {
                alert("Failed to reject streak request.");
            }
        } catch (err) {
            console.error("Error rejecting streak:", err);
        }
    };

    const handleConfirmConfig = async (config: HabitConfiguration) => {
        if (!user || !config.friendId) {
            alert("Please select a friend before starting the streak.");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/StreakRequests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: user.id,
                    receiverId: config.friendId,
                    habitName: config.HabitName,
                    habitIcon: config.HabitIcon,
                    color: config.Color
                })
            });

            if (response.ok) {
                setLastRequestConfig({
                    user: preSelectedFriend || {
                        id: config.friendId,
                        name: config.friendName || 'Friend',
                        avatar: config.friendAvatar || '??',
                        username: ''
                    },
                    habitName: config.HabitName
                });
                fetchSentStreakRequests();
                setCurrentScreen('confirmation');
            } else {
                const contentType = response.headers.get("content-type");
                let errorMessage = "Failed to send streak request";

                if (contentType && contentType.includes("application/json")) {
                    const errData = await response.json();
                    errorMessage = errData || "Failed to send streak request";
                } else {
                    errorMessage = await response.text();
                }
                alert(errorMessage);
            }
        } catch (err) {
            console.error("Error sending streak request:", err);
            alert("Network error. Please check if your backend is running and CORS is enabled.");
        }
    };

    if (!user) {
        return <AuthScreen isDark={isDark} onToggleDark={() => setIsDark(!isDark)} onSuccess={handleAuthSuccess} />;
    }

    return (
        <div className="size-full">
            {currentScreen === 'tracker' && (
                <StreakTracker
                    isDark={isDark}
                    user={user}
                    onLogout={() => {
                        localStorage.removeItem('picabilityUser');
                        setUser(null);
                    }}
                    onToggleDark={() => setIsDark(!isDark)}
                    onFriends={() => setCurrentScreen('friends-list')}
                    onAddHabit={handleAddHabit}
                    onStreakTap={handleCheckIn}
                    onDismissStreak={handleDismissStreak}
                    streaks={streaks}
                    streakInvites={streakInvites}
                    sentStreakRequests={sentStreakRequests}
                    onAcceptInvite={handleAcceptStreakInvite}
                    onRejectInvite={handleRejectStreakInvite}
                />
            )}

            {currentScreen === 'selector' && (
                <HabitSelector
                    isDark={isDark}
                    user={user}
                    onLogout={() => setUser(null)}
                    onToggleDark={() => setIsDark(!isDark)}
                    onBack={() => setCurrentScreen('tracker')}
                    onFriends={() => setCurrentScreen('friends-list')}
                    onSelectHabit={(id) => {
                        setSelectedHabitType(id);
                        setCurrentScreen('config');
                    }}
                />
            )}

            {currentScreen === 'config' && (
                <HabitConfig
                    isDark={isDark}
                    onToggleDark={() => setIsDark(!isDark)}
                    onBack={() => setCurrentScreen('selector')}
                    onFriends={() => setCurrentScreen('friends-list')}
                    onConfirm={handleConfirmConfig}
                    habitType={selectedHabitType || undefined}
                    presetHabitName={selectedHabitType && typeof selectedHabitType === 'number' ? habitNames[selectedHabitType] : ''}
                    preSelectedFriend={preSelectedFriend}
                />
            )}

            {currentScreen === 'friends-list' && (
                <FriendsList
                    isDark={isDark}
                    onToggleDark={() => setIsDark(!isDark)}
                    onBack={() => setCurrentScreen('tracker')}
                    onSelectFriend={handleSelectFriend}
                    onFindFriends={() => setCurrentScreen('user-search')}
                    currentUserId={user.id}
                    onRemoveFriend={handleRemoveFriend}
                />
            )}

            {currentScreen === 'user-search' && (
                <UserSearch
                    isDark={isDark}
                    onToggleDark={() => setIsDark(!isDark)}
                    onBack={() => setCurrentScreen('friends-list')}
                    onSelectUser={(u) => console.log(u)}
                    selectedUserId={preSelectedFriend?.id}
                    currentUserId={user.id}
                />
            )}

            {currentScreen === 'confirmation' && lastRequestConfig && (
                <RequestConfirmation
                    isDark={isDark}
                    selectedUser={lastRequestConfig.user}
                    habitName={lastRequestConfig.habitName}
                    onComplete={() => {
                        setLastRequestConfig(null);
                        setPreSelectedFriend(null);
                        setCurrentScreen('tracker');
                    }}
                />
            )}
        </div>
    );
}