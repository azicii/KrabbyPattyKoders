import { ArrowLeft, Sun, Moon, Search, UserPlus, Check, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  avatar: string;
  username: string;
}

interface UserSearchProps {
  isDark: boolean;
  onToggleDark: () => void;
  onBack?: () => void;
  onSelectUser?: (user: User) => void;
  selectedUserId?: string | null;
  currentUserId: string; 
}

export function UserSearch({
  isDark,
  onToggleDark,
  onBack,
  onSelectUser,
  selectedUserId = null,
  currentUserId
}: UserSearchProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [involvedUserIds, setInvolvedUserIds] =
        useState<Set<string>>(new Set());
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [showCheckmarkId, setShowCheckmarkId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

    // const BASE_URL = 'http://localhost:5232';
    const BASE_URL = 'https://kbk-picability-backend.onrender.com';

    const getToken = () => {
        const savedUser = localStorage.getItem('picabilityUser');
        return savedUser ? JSON.parse(savedUser).token : null;
    };
    


    useEffect(() => {
        const loadFriendRelationships =
            async () => {
                try {
                    const token = getToken();

                    const response = await fetch(
                        `${BASE_URL}/api/FriendRequests`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );

                    if (!response.ok) {
                        throw new Error(
                            'Failed to load friend requests.'
                        );
                    }

                    const requestsData =
                        await response.json();

                    const relatedIds =
                        new Set<string>();

                    requestsData.forEach(
                        (request: any) => {
                            if (
                                request.status ===
                                'Rejected'
                            ) {
                                return;
                            }

                            if (
                                request.senderId ===
                                currentUserId
                            ) {
                                relatedIds.add(
                                    request.receiverId
                                );
                            }

                            if (
                                request.receiverId ===
                                currentUserId
                            ) {
                                relatedIds.add(
                                    request.senderId
                                );
                            }
                        }
                    );

                    setInvolvedUserIds(
                        relatedIds
                    );
                } catch (err) {
                    console.error(
                        'Could not load friend relationships:',
                        err
                    );

                    setError(
                        'Could not load friend search.'
                    );
                }
            };

        void loadFriendRelationships();
    }, [currentUserId]);

    useEffect(() => {
        const normalizedQuery =
            searchQuery.trim();

        if (
            normalizedQuery.length < 2
        ) {
            setUsers([]);
            setLoading(false);
            return;
        }

        const controller =
            new AbortController();

        const timeoutId =
            window.setTimeout(
                async () => {
                    try {
                        setLoading(true);
                        setError(null);

                        const token =
                            getToken();

                        const response =
                            await fetch(
                                `${BASE_URL}/api/Users/search?query=${encodeURIComponent(
                                    normalizedQuery
                                )}`,
                                {
                                    headers: {
                                        Authorization:
                                            `Bearer ${token}`
                                    },

                                    signal:
                                        controller.signal
                                }
                            );

                        if (!response.ok) {
                            throw new Error(
                                'Failed to search users.'
                            );
                        }

                        const usersData =
                            await response.json();

                        const mappedUsers =
                            usersData
                                .filter(
                                    (user: any) =>
                                        user.id !==
                                        currentUserId &&
                                        !involvedUserIds.has(
                                            user.id
                                        )
                                )
                                .map(
                                    (user: any) => ({
                                        id:
                                            user.id,

                                        name:
                                            user.userName,

                                        username:
                                            `@${user.userName
                                                .toLowerCase()
                                                .replace(
                                                    /\s+/g,
                                                    ''
                                                )}`,

                                        avatar:
                                            user.userName
                                                .substring(
                                                    0,
                                                    2
                                                )
                                                .toUpperCase()
                                    })
                                );

                        setUsers(
                            mappedUsers
                        );
                    } catch (err) {
                        if (
                            err instanceof DOMException &&
                            err.name === 'AbortError'
                        ) {
                            return;
                        }

                        console.error(
                            'User search failed:',
                            err
                        );

                        setError(
                            'Could not load search results.'
                        );
                    } finally {
                        if (
                            !controller.signal
                                .aborted
                        ) {
                            setLoading(false);
                        }
                    }
                },
                300
            );

        return () => {
            window.clearTimeout(
                timeoutId
            );

            controller.abort();
        };
    }, [
        searchQuery,
        currentUserId,
        involvedUserIds
    ]);

  const handleAddFriend = async (targetUser: User) => {
    setSendingRequest(targetUser.id);
    try {
        const token = getToken();

        const response = await fetch(`${BASE_URL}/api/FriendRequests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ receiverId: targetUser.id }),
        });

      if (response.ok) {
        setShowCheckmarkId(targetUser.id);
        setToastMessage(`Friend request sent to ${targetUser.name}`);
        setShowToast(true);
        onSelectUser?.(targetUser);

        setTimeout(() => {
          setUsers(prev => prev.filter(u => u.id !== targetUser.id));
          setShowCheckmarkId(null);
        }, 800);

        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingRequest(null);
    }
  };

  

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className={`flex items-center justify-center w-12 h-12 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <ArrowLeft className={isDark ? 'text-slate-300' : 'text-slate-700'} />
        </button>
        <h1 className={`text-2xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Find Friends</h1>
        <button onClick={onToggleDark} className={`flex items-center justify-center w-12 h-12 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          {isDark ? <Sun className="text-amber-400" /> : <Moon className="text-slate-600" />}
        </button>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className={`relative rounded-3xl overflow-hidden ${isDark ? 'bg-slate-800/50' : 'bg-white shadow-sm'}`}>
          <Search className="absolute left-6 top-4 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for new friends..."
            className={`w-full pl-14 pr-6 py-4 bg-transparent focus:outline-none ${isDark ? 'text-slate-100' : 'text-slate-800'}`}
          />
        </div>
      </div>

      {/* List */}
      <div className="max-w-2xl mx-auto space-y-3">
        {loading ? (
            <div className="flex flex-col items-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-teal-500 mb-4" />

                <p
                    className={
                        isDark
                            ? 'text-slate-400'
                            : 'text-slate-500'
                    }
                >
                    Searching...
                </p>
            </div>
        ) : searchQuery.trim().length < 2 ? (
            
        ) : users.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
                No users found.
            </div>
        ) : (
         users.map((user) => (
            <div key={user.id} className={`flex items-center justify-between p-5 rounded-3xl ${isDark ? 'bg-slate-800/50' : 'bg-white shadow-sm'}`}>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl font-bold bg-gradient-to-br from-teal-500 to-cyan-600 text-white">{user.avatar}</div>
                <div className="text-left">
                  <h3 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{user.name}</h3>
                  <p className="text-sm text-slate-500">{user.username}</p>
                </div>
              </div>
              <button
                onClick={() => handleAddFriend(user)}
                disabled={sendingRequest === user.id || showCheckmarkId === user.id}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-600 hover:bg-teal-500 transition-all disabled:bg-teal-700"
              >
                {sendingRequest === user.id ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : showCheckmarkId === user.id ? <Check className="w-5 h-5 text-white" /> : <UserPlus className="w-5 h-5 text-white" />}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-teal-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <Check className="w-5 h-5" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}