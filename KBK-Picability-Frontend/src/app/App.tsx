import { useState, useEffect } from 'react';
import { HabitSelector } from './components/HabitSelector.tsx';
import { StreakTracker, Streak } from './components/StreakTracker.tsx';
import { HabitConfig, HabitConfiguration } from './components/HabitConfig.tsx';
import { AuthScreen } from './components/AuthScreen';
import { UserSearch, User } from './components/UserSearch.tsx';
import { FriendsList, PendingRequest } from './components/FriendList.tsx';
import { RequestConfirmation } from './components/RequestConfirmation.tsx';
import { PublicFeed, PublicFeedItem } from './components/PublicFeed.tsx';
import { OnboardingSlides } from './components/OnboardingSlides.tsx';
import { MobileBottomNav, MobileTab } from './components/MobileBottomNav.tsx';

type Screen =
    | 'auth'
    | 'tracker'
    | 'public-feed'
    | 'selector'
    | 'config'
    | 'friends-list'
    | 'user-search'
    | 'confirmation'
    | 'onboarding';

interface AuthUser {
    id: string;
    userName: string;
    email: string;
    token: string;
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
const getAuthHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
});


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
    const [pendingFriendRequestCount, setPendingFriendRequestCount] = useState(0);
    const [unreadContent, setUnreadContent] = useState<any[]>([]);
    const [draftHabitConfig, setDraftHabitConfig] = useState<Partial<HabitConfiguration> | null>(null);
    const [publicFeed, setPublicFeed] = useState<PublicFeedItem[]>([]);
    const [mobileTab, setMobileTab] = useState<MobileTab>('tracker');

    const fetchStreaks = async () => {
        if (!user) return;
        try {
            const response = await fetch(
                `${BASE_URL}/api/Streaks/mine`,
                {
                    headers: getAuthHeaders(user.token)
                }
            );            if (response.ok) {
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
                    brokenMessage: s.brokenMessage,
                    isActive: s.isActive,
                    isPublic: s.isPublic ?? true,
                    canCheckInToday: s.canCheckInToday,
                    hoursUntilMidnight: s.hoursUntilMidnight,
                    timeMessage: s.timeMessage,
                    partnerId: s.partnerId
                }));
                setStreaks(formattedStreaks);
            }
        } catch (err) {
            console.error("Error fetching streaks:", err);
        }
    };

    const fetchPublicFeed = async () => {
        if (!user) return;

        try {
            const response = await fetch(
                `${BASE_URL}/api/Streaks/public-feed`,
                {
                    headers: getAuthHeaders(user.token)
                }
            );

            if (response.ok) {
                const data = await response.json();
                setPublicFeed(data);
            }
        } catch (err) {
            console.error("Error fetching public feed:", err);
        }
    };

    const handleMobileTabChange = (tab: MobileTab) => {
        setMobileTab(tab);

        if (tab === 'friends') {
            setCurrentScreen('friends-list');
        }

        if (tab === 'tracker') {
            setCurrentScreen('tracker');
        }

        if (tab === 'feed') {
            setCurrentScreen('public-feed');
        }
    };

    const primaryTabs: MobileTab[] = ['friends', 'tracker', 'feed'];
    const activePrimaryIndex = primaryTabs.indexOf(mobileTab);
    const isPrimaryScreen = ['tracker', 'friends-list', 'public-feed'].includes(currentScreen);

    const fetchStreakInvites = async () => {
        if (!user) return;
        try {
            const response = await fetch(`${BASE_URL}/api/StreakRequests/incoming`, {
                headers: getAuthHeaders(user.token)
            });
            if (response.ok) {
                const data = await response.json();
                setStreakInvites(data);
            }
        } catch (err) {
            console.error("Error fetching streak invites:", err);
        }
    };

    const fetchPendingFriendRequestCount = async () => {
        if (!user) return;

        try {
            const response = await fetch(`${BASE_URL}/api/FriendRequests`, {
                headers: getAuthHeaders(user.token)
            });
            if (response.ok) {
                const data = await response.json();
                const count = data.filter(
                    (r: any) => r.status === 'Pending' && r.receiverId === user.id
                ).length;

                setPendingFriendRequestCount(count);
            }
        } catch (err) {
            console.error("Error fetching friend request count:", err);
        }
    };

    const handleToggleStreakVisibility = async (streakId: number, isPublic: boolean) => {
        if (!user) return;

        try {
            const response = await fetch(`${BASE_URL}/api/Streaks/${streakId}/visibility`, {
                method: 'PUT',
                headers: getAuthHeaders(user.token),
                body: JSON.stringify({ isPublic })
            });

            if (response.ok) {
                await fetchStreaks();
                await fetchPublicFeed();
            } else {
                const errorText = await response.text();
                alert(errorText || "Failed to update streak visibility.");
            }
        } catch (err) {
            console.error("Visibility update error:", err);
            alert("Network error while updating streak visibility.");
        }
    };

    const handleSendCheckInMessage = async (
        streakId: number,
        messageText: string,
        viewDurationSeconds: number
    ) => {
        if (!user) return;

        const response = await fetch(`${BASE_URL}/api/CheckInContent/message`, {
            method: 'POST',
            headers: getAuthHeaders(user.token),
            body: JSON.stringify({
                streakId,
                senderId: user.id,
                messageText,
                viewDurationSeconds
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            alert(errorText || "Failed to send message.");
            return;
        }

        await handleCheckIn(streakId);
    };

    const handleViewCheckInContent = async (contentId: number) => {
        try {
            await fetch(`${BASE_URL}/api/CheckInContent/${contentId}/view`, {
                method: 'POST',
                headers: getAuthHeaders(user.token)
            });

            await fetchUnreadContent();
        } catch (err) {
            console.error("Error marking content viewed:", err);
        }
    };

    const fetchUnreadContent = async () => {
        if (!user) return;

        const response = await fetch(
            `${BASE_URL}/api/CheckInContent/unread`,
            {
                headers: getAuthHeaders(user.token)
            }
        );

        if (!response.ok) return;

        const data = await response.json();
        setUnreadContent(data);
    };

    const fetchSentStreakRequests = async () => {
        if (!user) return;
        try {
            const response = await fetch(`${BASE_URL}/api/StreakRequests/outgoing`, {
                headers: getAuthHeaders(user.token)
            });
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
            fetchPendingFriendRequestCount();
            fetchUnreadContent();
            fetchPublicFeed();
        }
    }, [user]);

    const handleCheckIn = async (streakId: number) => {
        if (!user) return;
        try {
            const response = await fetch(`${BASE_URL}/api/Streaks/${streakId}/complete`, {
                method: 'POST',
                headers: getAuthHeaders(user.token),
                body: JSON.stringify({})
            });
            if (response.ok) fetchStreaks();
        } catch (err) {
            console.error("Check-in error:", err);
        }
    };

    const handleRestartStreak = async (streak: Streak) => {
        if (!user || !streak.partnerId) return;

        try {
            const response = await fetch(`${BASE_URL}/api/StreakRequests`, {
                method: 'POST',
                headers: getAuthHeaders(user.token),
                body: JSON.stringify({
                    senderId: user.id,
                    receiverId: streak.partnerId,
                    habitName: streak.habitName,
                    habitIcon: streak.habitIcon,
                    color: streak.color
                })
            });

            if (response.ok) {
                await fetchStreaks();
                await fetchSentStreakRequests();
                alert("Streak request sent!");
            } else {
                const errorText = await response.text();
                alert(errorText || "Failed to restart streak.");
            }
        } catch (err) {
            console.error("Restart streak error:", err);
        }
    };

    const handleDismissStreak = async (streakId: number) => {
        try {
            const response = await fetch(`${BASE_URL}/api/Streaks/${streakId}/dismiss`, {
                method: 'DELETE',
                headers: getAuthHeaders(user.token)
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
            await fetch(`${BASE_URL}/api/Streaks/remove-connection/${friendId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(user.token)
            });

            // 2. Remove the Friendship
            const response = await fetch(`${BASE_URL}/api/Friends/${friendId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(user.token)
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

    const handleCancelPendingStreakRequest = async (requestId: number) => {
        if (!user) return;

        try {
            const response = await fetch(`${BASE_URL}/api/StreakRequests/cancel/${requestId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(user.token)
            });

            if (response.ok) {
                await fetchSentStreakRequests();
            } else {
                const errorText = await response.text();
                alert(errorText || "Failed to cancel streak request.");
            }
        } catch (err) {
            console.error("Error cancelling streak request:", err);
            alert("Network error while cancelling streak request.");
        }
    };

    const handleAuthSuccess = (userData: AuthUser, showOnboarding = false) => {
        localStorage.setItem('picabilityUser', JSON.stringify(userData));
        setUser(userData);

        const onboardingKey = `picabilityOnboardingComplete:${userData.id}`;

        if (showOnboarding && localStorage.getItem(onboardingKey) !== 'true') {
            setCurrentScreen('onboarding');
        } else {
            setCurrentScreen('tracker');
        }
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
        setDraftHabitConfig(null);
    };

    const handleAcceptStreakInvite = async (requestId: number) => {
        try {
            const response = await fetch(`${BASE_URL}/api/StreakRequests/accept/${requestId}`, {
                method: 'POST',
                headers: getAuthHeaders(user.token)
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
                method: 'POST',
                headers: getAuthHeaders(user.token)
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
                headers: getAuthHeaders(user.token),
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
                setDraftHabitConfig(null);
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

    const handleSendCheckInPhoto = async (
        streakId: number,
        photoDataUrl: string,
        viewDurationSeconds: number
    ) => {
        if (!user) return;

        const response = await fetch(
            `${BASE_URL}/api/CheckInContent/photo`,
            {
                method: 'POST',
                headers: getAuthHeaders(user.token),
                body: JSON.stringify({
                    streakId,
                    senderId: user.id,
                    photoDataUrl,
                    viewDurationSeconds
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            alert(errorText || "Failed to send photo.");
            return;
        }

        await handleCheckIn(streakId);
    };

    if (!user) {
        return <AuthScreen isDark={isDark} onToggleDark={() => setIsDark(!isDark)} onSuccess={handleAuthSuccess} />;
    }

    return (
        <div className="size-full">
            {currentScreen === 'onboarding' && user && (
                <OnboardingSlides
                    isDark={isDark}
                    onComplete={() => {
                        localStorage.setItem(`picabilityOnboardingComplete:${user.id}`, 'true');
                        setCurrentScreen('tracker');
                    }}
                />
            )}

            {isPrimaryScreen && (
                <div className="relative size-full overflow-hidden pb-20">
                    <div
                        className="flex w-[300%] transition-transform duration-300 ease-out"
                        style={{ transform: `translateX(-${activePrimaryIndex * 33.333333}%)` }}
                    >
                        <div className="w-1/3 shrink-0">
                            <FriendsList
                                isDark={isDark}
                                onToggleDark={() => setIsDark(!isDark)}
                                onBack={() => handleMobileTabChange('tracker')}
                                onSelectFriend={handleSelectFriend}
                                onFindFriends={() => setCurrentScreen('user-search')}
                                currentUserId={user.id}
                                onRemoveFriend={handleRemoveFriend}
                            />
                        </div>

                        <div className="w-1/3 shrink-0">
                            <StreakTracker
                                isDark={isDark}
                                user={user}
                                onLogout={() => {
                                    localStorage.removeItem('picabilityUser');
                                    setUser(null);
                                }}
                                onToggleDark={() => setIsDark(!isDark)}
                                onFriends={() => handleMobileTabChange('friends')}
                                onAddHabit={handleAddHabit}
                                onStreakTap={handleCheckIn}
                                onDismissStreak={handleDismissStreak}
                                streaks={streaks}
                                streakInvites={streakInvites}
                                sentStreakRequests={sentStreakRequests}
                                onAcceptInvite={handleAcceptStreakInvite}
                                onRejectInvite={handleRejectStreakInvite}
                                onCancelPendingStreakRequest={handleCancelPendingStreakRequest}
                                onRestartStreak={handleRestartStreak}
                                pendingFriendRequestCount={pendingFriendRequestCount}
                                onSendCheckInMessage={handleSendCheckInMessage}
                                unreadContent={unreadContent}
                                onViewCheckInContent={handleViewCheckInContent}
                                onSendCheckInPhoto={handleSendCheckInPhoto}
                                onPublicFeed={() => handleMobileTabChange('feed')}
                                onToggleVisibility={handleToggleStreakVisibility}
                            />
                        </div>

                        <div className="w-1/3 shrink-0">
                            <PublicFeed
                                isDark={isDark}
                                items={publicFeed}
                                onBack={() => handleMobileTabChange('tracker')}
                            />
                        </div>
                    </div>

                    <MobileBottomNav
                        activeTab={mobileTab}
                        onChangeTab={handleMobileTabChange}
                        isDark={isDark}
                    />
                </div>
            )}

            {currentScreen === 'selector' && (
                <HabitSelector
                    isDark={isDark}
                    user={user}
                    onLogout={() => setUser(null)}
                    onToggleDark={() => setIsDark(!isDark)}
                    onBack={() => handleMobileTabChange('tracker')}
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
                    draftConfig={draftHabitConfig}
                    onDraftChange={setDraftHabitConfig}
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