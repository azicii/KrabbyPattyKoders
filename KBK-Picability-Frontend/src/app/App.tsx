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
import { consumePushRefreshRequired } from '../pushRefreshStore';

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
const BASE_URL = 'https://kbk-picability-backend.onrender.com';
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
    const [selectedGroupFriends, setSelectedGroupFriends] = useState<User[]>([]);
    const [isSelectingGroupFriends, setIsSelectingGroupFriends] = useState(false);
    const [lastRequestConfig, setLastRequestConfig] = useState<{ user: User; habitName: string } | null>(null);
    const [streakInvites, setStreakInvites] = useState<any[]>([]);
    const [sentStreakRequests, setSentStreakRequests] = useState<any[]>([]);
    const [pendingFriendRequestCount, setPendingFriendRequestCount] = useState(0);
    const [unreadContent, setUnreadContent] = useState<any[]>([]);
    const [draftHabitConfig, setDraftHabitConfig] = useState<Partial<HabitConfiguration> | null>(null);
    const [publicFeed, setPublicFeed] = useState<PublicFeedItem[]>([]);
    const [mobileTab, setMobileTab] = useState<MobileTab>('tracker');
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchStartY, setTouchStartY] = useState<number | null>(null);
    const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
    const [touchDeltaX, setTouchDeltaX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [swipeIntent, setSwipeIntent] = useState<'horizontal' | 'vertical' | null>(null);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSelectingFriendForStreak, setIsSelectingFriendForStreak] = useState(false);
    const [friendsRefreshKey, setFriendsRefreshKey] = useState(0);

    const fetchStreaks = async () => {
        if (!user) return;
        try {
            const response = await fetch(
                `${BASE_URL}/api/Streaks/mine`,
                {
                    headers: getAuthHeaders(user.token)
                }
            ); if (response.ok) {
                const data = await response.json();
                const formattedStreaks: Streak[] = data.map((s: any) => ({
                    id: s.id,
                    habitName: s.habitName,
                    habitIcon: s.habitIcon,
                    color: s.color,
                    userName: s.partnerName,
                    userAvatar: s.partnerName.substring(0, 2).toUpperCase(),
                    streakCount: s.currentCount,
                    requiredCheckIns: s.requiredCheckIns,
                    cycleLength: s.cycleLength,
                    cycleUnit: s.cycleUnit,

                    cycleStartedAt: s.cycleStartedAt,
                    cycleEndsAt: s.cycleEndsAt,

                    userCycleCheckInCount: s.userCycleCheckInCount,
                    partnerCycleCheckInCount: s.partnerCycleCheckInCount,

                    userCompletedCycle: s.userCompletedCycle,
                    partnerCompletedCycle: s.partnerCompletedCycle,
                    bothCompletedCycle: s.bothCompletedCycle,

                    canCheckInCurrentCycle: s.canCheckInCurrentCycle,
                    hoursUntilCycleEnds: s.hoursUntilCycleEnds,
                    cycleProgressMessage: s.cycleProgressMessage,
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

    const refreshTriggerDistance = 65;
    const refreshHoldDistance = 58;
    const visiblePullDistance = isRefreshing
        ? refreshHoldDistance
        : pullDistance;

    const goToPrimaryIndex = (index: number) => {
        const clampedIndex = Math.max(0, Math.min(primaryTabs.length - 1, index));
        handleMobileTabChange(primaryTabs[clampedIndex]);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (window.innerWidth >= 768 || isRefreshing) return;

        setTouchStartX(e.touches[0].clientX);
        setTouchStartY(e.touches[0].clientY);
        setTouchStartTime(Date.now());
        setTouchDeltaX(0);
        setIsDragging(false);
        setSwipeIntent(null);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (window.innerWidth >= 768 || touchStartX === null || touchStartY === null) return;

        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        const isPullingDownAtTop = window.scrollY <= 0 && deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX);

        if (isPullingDownAtTop && swipeIntent !== 'horizontal') {
            setSwipeIntent('vertical');
            setPullDistance(Math.min(deltaY * 0.45, 90));
            return;
        }

        if (swipeIntent === null) {
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            if (absX < 18 && absY < 18) return;

            if (absY > absX * 1.2) {
                setSwipeIntent('vertical');
                setIsDragging(false);
                return;
            }

            if (absX > absY * 1.5) {
                setSwipeIntent('horizontal');
                setIsDragging(true);
            }
        }

        if (swipeIntent === 'horizontal') {
            const isAtLeftEdge = activePrimaryIndex === 0 && deltaX > 0;
            const isAtRightEdge = activePrimaryIndex === primaryTabs.length - 1 && deltaX < 0;

            if (isAtLeftEdge || isAtRightEdge) {
                const resistedDelta = Math.sign(deltaX) * Math.min(Math.abs(deltaX) * 0.28, 48);
                setTouchDeltaX(resistedDelta);
            } else {
                setTouchDeltaX(deltaX);
            }
        }
    };

    const handleTouchEnd = () => {
        if (window.innerWidth >= 768 || touchStartX === null) return;

        const elapsedMs = touchStartTime ? Date.now() - touchStartTime : 999;
        const velocity = Math.abs(touchDeltaX) / Math.max(elapsedMs, 1);

        const distanceThreshold = 110;
        const flickThreshold = 0.65;

        if (swipeIntent === 'vertical' && pullDistance > refreshTriggerDistance) {
            setIsRefreshing(true);
            setPullDistance(refreshHoldDistance);

            refreshAppData().finally(() => {
                setIsRefreshing(false);
                setPullDistance(0);
            });

            setTouchStartX(null);
            setTouchStartY(null);
            setTouchStartTime(null);
            setTouchDeltaX(0);
            setIsDragging(false);
            setSwipeIntent(null);
            return;
        }

        if (swipeIntent === 'horizontal') {
            const shouldMoveByDistance = Math.abs(touchDeltaX) > distanceThreshold;
            const shouldMoveByVelocity = Math.abs(touchDeltaX) > 35 && velocity > flickThreshold;

            if (shouldMoveByDistance || shouldMoveByVelocity) {
                if (touchDeltaX < 0) {
                    goToPrimaryIndex(activePrimaryIndex + 1);
                } else {
                    goToPrimaryIndex(activePrimaryIndex - 1);
                }
            }
        }

        setTouchStartX(null);
        setTouchStartY(null);
        setTouchStartTime(null);
        setTouchDeltaX(0);
        setIsDragging(false);
        setSwipeIntent(null);
        setPullDistance(0);
    };

    const fetchStreakInvites = async () => {
        if (!user) return;
        try {
            const response = await fetch(`${BASE_URL}/api/StreakRequests/incoming`, {
                headers: getAuthHeaders(user.token)
            });
            if (response.ok) {
                const data = await response.json();

                const normalizedInvites = data.map((invite: any) => {
                    const members =
                        invite.members ??
                        invite.Members ??
                        [];

                    return {
                        ...invite,

                        isGroupRequest:
                            invite.isGroupRequest ??
                            invite.IsGroupRequest ??
                            members.length > 1,

                        members: members.map((member: any) => ({
                            userId:
                                member.userId ??
                                member.UserId,

                            userName:
                                member.userName ??
                                member.UserName ??
                                'Unknown user',

                            status:
                                member.status ??
                                member.Status ??
                                'Pending'
                        }))
                    };
                });

                setStreakInvites(normalizedInvites);
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
    ): Promise<boolean> => {
        if (!user) return false;

        try {
            const response = await fetch(
                `${BASE_URL}/api/CheckInContent/message`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(user.token),
                    body: JSON.stringify({
                        streakId,
                        senderId: user.id,
                        messageText,
                        viewDurationSeconds
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();

                alert(
                    errorText ||
                    'Failed to send the check-in message.'
                );

                return false;
            }

            const checkInSucceeded =
                await handleCheckIn(streakId);

            if (!checkInSucceeded) {
                console.error(
                    'Message content was created, but check-in completion failed.'
                );

                return false;
            }

            return true;
        } catch (error) {
            console.error(
                'Check-in message error:',
                error
            );

            alert(
                'Network error while sending the check-in message.'
            );

            return false;
        }
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

                const normalizedRequests = data.map((request: any) => {
                    const members =
                        request.members ??
                        request.Members ??
                        [];

                    return {
                        ...request,

                        receiverName:
                            request.receiverName ??
                            request.ReceiverName,

                        isGroupRequest:
                            request.isGroupRequest ??
                            request.IsGroupRequest ??
                            members.length > 1,

                        members: members.map((member: any) => ({
                            userId:
                                member.userId ??
                                member.UserId,

                            userName:
                                member.userName ??
                                member.UserName ??
                                'Unknown user',

                            status:
                                member.status ??
                                member.Status ??
                                'Pending'
                        }))
                    };
                });

                setSentStreakRequests(normalizedRequests);
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

    useEffect(() => {
        if (!user || !('serviceWorker' in navigator)) return;

        const handleServiceWorkerMessage = (event: MessageEvent) => {
            if (event.data?.type === 'PICABILITY_PUSH_OPENED') {
                void refreshAfterPushOpen();
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void refreshAfterPushOpen();
            }
        };

        const handlePageShow = () => {
            void refreshAfterPushOpen();
        };

        navigator.serviceWorker.addEventListener(
            'message',
            handleServiceWorkerMessage
        );

        document.addEventListener(
            'visibilitychange',
            handleVisibilityChange
        );

        window.addEventListener('pageshow', handlePageShow);
        window.addEventListener('focus', handlePageShow);

        void refreshAfterPushOpen();

        return () => {
            navigator.serviceWorker.removeEventListener(
                'message',
                handleServiceWorkerMessage
            );

            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange
            );

            window.removeEventListener('pageshow', handlePageShow);
            window.removeEventListener('focus', handlePageShow);
        };
    }, [user]);

    useEffect(() => {
        let themeMeta = document.querySelector('meta[name="theme-color"]');

        if (!themeMeta) {
            themeMeta = document.createElement('meta');
            themeMeta.setAttribute('name', 'theme-color');
            document.head.appendChild(themeMeta);
        }

        themeMeta.setAttribute('content', isDark ? '#0f172a' : '#f8fafc');

        document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    }, [isDark]);

    const handleCheckIn = async (
        streakId: number
    ): Promise<boolean> => {
        if (!user) return false;

        try {
            const response = await fetch(
                `${BASE_URL}/api/Streaks/${streakId}/complete`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(user.token),
                    body: JSON.stringify({})
                }
            );

            if (!response.ok) {
                const contentType =
                    response.headers.get('content-type');

                let message =
                    'The check-in could not be completed.';

                if (contentType?.includes('application/json')) {
                    const error = await response.json();

                    message =
                        error.message ??
                        error.title ??
                        message;
                } else {
                    const errorText = await response.text();

                    if (errorText) {
                        message = errorText;
                    }
                }

                console.error(
                    'Check-in failed:',
                    response.status,
                    message
                );

                alert(message);
                await fetchStreaks();

                return false;
            }

            await fetchStreaks();
            await fetchPublicFeed();

            return true;
        } catch (err) {
            console.error('Check-in network error:', err);
            alert('Network error while completing the check-in.');
            return false;
        }
    };

    const handleSendReminderPing = async (streakId: number) => {
        if (!user) return;

        try {
            const response = await fetch(
                `${BASE_URL}/api/Streaks/${streakId}/remind`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(user.token)
                }
            );

            if (!response.ok) {
                const contentType = response.headers.get('content-type');

                if (contentType?.includes('application/json')) {
                    const error = await response.json();
                    alert(error.message || 'Could not send reminder.');
                } else {
                    const errorText = await response.text();
                    alert(errorText || 'Could not send reminder.');
                }

                return;
            }
        } catch (err) {
            console.error('Reminder ping error:', err);
            alert('Network error while sending the reminder.');
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
                    color: streak.color,

                    requiredCheckIns: streak.requiredCheckIns ?? 1,
                    cycleLength: streak.cycleLength ?? 1,
                    cycleUnit: streak.cycleUnit ?? 'Day'
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

    const refreshAppData = async () => {
        if (!user) return;

        await Promise.all([
            fetchStreaks(),
            fetchStreakInvites(),
            fetchSentStreakRequests(),
            fetchPendingFriendRequestCount(),
            fetchUnreadContent(),
            fetchPublicFeed()
        ]);

        setFriendsRefreshKey(prev => prev + 1);
    };

    const refreshAfterPushOpen = async () => {
        if (!user) return;

        const shouldRefresh = await consumePushRefreshRequired();

        if (!shouldRefresh) return;

        setCurrentScreen('tracker');
        setMobileTab('tracker');
        await refreshAppData();
    };

    const handleSelectFriend = (friend: User) => {
        setPreSelectedFriend(friend);

        if (isSelectingFriendForStreak) {
            setIsSelectingFriendForStreak(false);
            setCurrentScreen('config');
            return;
        }

        setSelectedHabitType(null);
        setDraftHabitConfig(null);
        setCurrentScreen('selector');
    };

    const handleToggleGroupFriend = (friend: User) => {
        setSelectedGroupFriends(current => {
            const alreadySelected =
                current.some(selected =>
                    selected.id === friend.id
                );

            if (alreadySelected) {
                return current.filter(selected =>
                    selected.id !== friend.id
                );
            }

            return [
                ...current,
                friend
            ];
        });
    };

    const handleFinishGroupFriendSelection = () => {
        setIsSelectingGroupFriends(false);
        setIsSelectingFriendForStreak(false);
        setCurrentScreen('config');
    };

    const handleAddHabit = () => {
        setPreSelectedFriend(null);
        setSelectedGroupFriends([]);
        setIsSelectingGroupFriends(false);

        setSelectedHabitType(null);
        setCurrentScreen('selector');
        setDraftHabitConfig(null);
    };

    const handleAcceptStreakInvite = async (
        requestId: number,
        isGroupRequest = false
    ) => {
        try {
            const endpoint = isGroupRequest
                ? `${BASE_URL}/api/StreakRequests/group/${requestId}/accept`
                : `${BASE_URL}/api/StreakRequests/accept/${requestId}`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(user.token)
            });

            const contentType =
                response.headers.get('content-type');

            const result =
                contentType?.includes('application/json')
                    ? await response.json()
                    : await response.text();

            if (!response.ok) {
                const message =
                    typeof result === 'string'
                        ? result
                        : result.message ??
                        result.title ??
                        'Failed to accept streak request.';

                alert(message);
                return;
            }

            await Promise.all([
                fetchStreakInvites(),
                fetchSentStreakRequests(),
                fetchStreaks()
            ]);

            if (isGroupRequest) {
                if (result.allAccepted === true) {
                    alert(
                        'Everyone accepted. The group streak has started!'
                    );
                } else {
                    alert(
                        'Request accepted. The group streak will begin once everyone accepts.'
                    );
                }
            }
        } catch (err) {
            console.error(
                'Error accepting streak:',
                err
            );

            alert(
                'Network error while accepting streak request.'
            );
        }
    };

    const handleRejectStreakInvite = async (
        requestId: number,
        isGroupRequest = false
    ) => {
        try {
            const endpoint = isGroupRequest
                ? `${BASE_URL}/api/StreakRequests/group/${requestId}/reject`
                : `${BASE_URL}/api/StreakRequests/reject/${requestId}`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(user.token)
            });

            const contentType =
                response.headers.get('content-type');

            const result =
                contentType?.includes('application/json')
                    ? await response.json()
                    : await response.text();

            if (!response.ok) {
                const message =
                    typeof result === 'string'
                        ? result
                        : result.message ??
                        result.title ??
                        'Failed to reject streak request.';

                alert(message);
                return;
            }

            await Promise.all([
                fetchStreakInvites(),
                fetchSentStreakRequests(),
                fetchStreaks()
            ]);

            if (isGroupRequest) {
                alert(
                    'Group streak declined. The invitation has been cancelled for everyone.'
                );
            }
        } catch (err) {
            console.error(
                'Error rejecting streak:',
                err
            );

            alert(
                'Network error while rejecting streak request.'
            );
        }
    };

    const handleConfirmConfig = async (config: HabitConfiguration) => {
        if (!user) {
            return;
        }

        if (
            config.IsGroupRequest &&
            (!config.participantIds ||
                config.participantIds.length < 2)
        ) {
            alert(
                "Please select at least two friends for the group streak."
            );

            return;
        }

        if (
            !config.IsGroupRequest &&
            !config.friendId
        ) {
            alert(
                "Please select a friend before starting the streak."
            );

            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/StreakRequests`, {
                method: 'POST',
                headers: getAuthHeaders(user.token),
                body: JSON.stringify({
                    senderId: user.id,

                    receiverId:
                        config.IsGroupRequest
                            ? ''
                            : config.friendId,

                    receiverIds:
                        config.IsGroupRequest
                            ? config.participantIds
                            : [],

                    isGroupRequest:
                        config.IsGroupRequest === true,

                    habitName:
                        config.HabitName,

                    habitIcon:
                        config.HabitIcon,

                    color:
                        config.Color,

                    requiredCheckIns:
                        config.RequiredCheckIns,

                    cycleLength:
                        config.CycleLength,

                    cycleUnit:
                        config.CycleUnit
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
    ): Promise<boolean> => {
        if (!user) return false;

        try {
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
                const contentType =
                    response.headers.get('content-type');

                let message =
                    'Failed to send the check-in photo.';

                if (contentType?.includes('application/json')) {
                    const error = await response.json();

                    message =
                        error.message ??
                        error.title ??
                        message;
                } else {
                    const errorText = await response.text();

                    if (errorText) {
                        message = errorText;
                    }
                }

                alert(message);
                return false;
            }

            const checkInSucceeded =
                await handleCheckIn(streakId);

            if (!checkInSucceeded) {
                console.error(
                    'Photo content was created, but check-in completion failed.'
                );

                return false;
            }

            return true;
        } catch (error) {
            console.error(
                'Check-in photo error:',
                error
            );

            alert(
                'Network error while sending the check-in photo.'
            );

            return false;
        }
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
                <>
                    <div
                        className={`relative w-full min-h-screen overflow-x-hidden pb-28 ${isDark ? 'bg-slate-900' : 'bg-slate-50'
                            }`}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div
                        className={`fixed top-5 left-1/2 z-[90] -translate-x-1/2 transition-all duration-200 ${pullDistance > 0 || isRefreshing
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 -translate-y-3 pointer-events-none'
                            }`}
                    >
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md ${isDark ? 'bg-slate-900/40' : 'bg-white/50'
                                }`}
                        >
                            <div
                                className={`w-5 h-5 rounded-full border-2 border-t-transparent ${isDark ? 'border-slate-200' : 'border-slate-700'
                                    } ${isRefreshing ? 'animate-spin' : ''}`}
                                style={{
                                    transform: isRefreshing
                                        ? undefined
                                        : `rotate(${Math.min(visiblePullDistance, 80) * 4}deg)`,
                                    opacity: Math.min(Math.max(visiblePullDistance / refreshTriggerDistance, 0.25), 1)
                                }}
                            />
                        </div>
                    </div>

                    <div
                        className={`flex w-[300%] items-start ${isDragging ? '' : 'transition-transform duration-[360ms] ease-out'}`}
                        style={{
                            transform: `translateX(calc(-${activePrimaryIndex * 33.333333}% + ${touchDeltaX}px)) translateY(${visiblePullDistance}px)`
                        }}
                    >
                        <div className={`w-1/3 shrink-0 ${mobileTab === 'friends' ? '' : 'h-0 overflow-hidden'}`}>
                            <FriendsList
                                isDark={isDark}
                                onToggleDark={() => setIsDark(!isDark)}
                                onBack={() => {
                                    if (isSelectingFriendForStreak) {
                                        setIsSelectingFriendForStreak(false);
                                        setCurrentScreen('config');
                                    } else {
                                        handleMobileTabChange('tracker');
                                    }
                                }}
                                onSelectFriend={handleSelectFriend}
                                onFindFriends={() => setCurrentScreen('user-search')}
                                currentUserId={user.id}
                                onRemoveFriend={handleRemoveFriend}
                                    refreshKey={friendsRefreshKey}
                                    multiSelectMode={isSelectingGroupFriends}

                                    selectedFriendIds={
                                        selectedGroupFriends.map(
                                            friend => friend.id
                                        )
                                    }

                                    onToggleFriendSelection={
                                        handleToggleGroupFriend
                                    }

                                    onFinishMultiSelect={
                                        handleFinishGroupFriendSelection
                                    }
                            />
                        </div>

                        <div className={`w-1/3 shrink-0 ${mobileTab === 'tracker' ? '' : 'h-0 overflow-hidden'}`}>
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
                                onSendReminderPing={handleSendReminderPing}
                            />
                        </div>

                        <div className={`w-1/3 shrink-0 ${mobileTab === 'feed' ? '' : 'h-0 overflow-hidden'}`}>
                            <PublicFeed
                                isDark={isDark}
                                items={publicFeed}
                                onBack={() => handleMobileTabChange('tracker')}
                            />
                        </div>
                    </div>

                    </div>

                    <MobileBottomNav
                        activeTab={mobileTab}
                        onChangeTab={handleMobileTabChange}
                        isDark={isDark}
                    />
                </>
            )}

{
    currentScreen === 'selector' && (
        <HabitSelector
            isDark={isDark}
            user={user}
            onLogout={() => setUser(null)}
            onToggleDark={() => setIsDark(!isDark)}
            onBack={() => handleMobileTabChange('tracker')}
            onFriends={() => {
                setIsSelectingFriendForStreak(true);
                setCurrentScreen('friends-list');
                setMobileTab('friends');
            }}
            onSelectHabit={(id) => {
                setSelectedHabitType(id);
                setCurrentScreen('config');
            }}
        />
    )
}

{
    currentScreen === 'config' && (
        <HabitConfig
            isDark={isDark}
            user={user}
            onToggleDark={() => setIsDark(!isDark)}
            onBack={() => setCurrentScreen('selector')}
            onFriends={() => {
                setIsSelectingFriendForStreak(true);
                setCurrentScreen('friends-list');
                setMobileTab('friends');
            }}
            onConfirm={handleConfirmConfig}
            habitType={selectedHabitType || undefined}
            presetHabitName={selectedHabitType && typeof selectedHabitType === 'number' ? habitNames[selectedHabitType] : ''}
            preSelectedFriend={preSelectedFriend}
            draftConfig={draftHabitConfig}
            onDraftChange={setDraftHabitConfig}
            selectedGroupFriends={selectedGroupFriends}
            onSelectGroupFriends={() => {
                setIsSelectingGroupFriends(true);
                setIsSelectingFriendForStreak(true);
                setCurrentScreen('friends-list');
                setMobileTab('friends');
            }}
        />
    )
}

{
    currentScreen === 'user-search' && (
        <UserSearch
            isDark={isDark}
            onToggleDark={() => setIsDark(!isDark)}
            onBack={() => setCurrentScreen('friends-list')}
            onSelectUser={(u) => console.log(u)}
            selectedUserId={preSelectedFriend?.id}
            currentUserId={user.id}
        />
    )
}

{
    currentScreen === 'confirmation' && lastRequestConfig && (
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
    )
}
        </div >
    );
}