import { ArrowLeft, Sun, Moon, UserPlus, Zap, Clock, Check, X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { User } from './UserSearch';

export interface PendingRequest {
  friendId: string;
  habitName: string;
  icon: string;
  color: string;
}

// Internal interface for raw database requests
interface DBRequest {
  id: number;
  senderId: string;
  receiverId: string;
  status: string;
}

interface FriendsListProps {
  isDark: boolean;
  onToggleDark: () => void;
  onBack?: () => void;
  onSelectFriend?: (user: User) => void;
  onFindFriends?: () => void;
  currentUserId: string; // From App.tsx
}

export function FriendsList({
  isDark,
  onToggleDark,
  onBack,
  onSelectFriend,
  onFindFriends,
  currentUserId
}: FriendsListProps) {
  const [friends, setFriends] = useState<User[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<(User & { requestId: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const BASE_URL = 'http://localhost:5232';

  useEffect(() => {
    fetchData();
  }, [currentUserId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch real friends and pending requests in parallel
      const [friendsRes, requestsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/Friends/${currentUserId}`),
        fetch(`${BASE_URL}/api/FriendRequests`)
      ]);

      const friendsData = await friendsRes.json();
      const requestsData = await requestsRes.json();

      // 1. Map real friends from the /api/Friends table
      setFriends(friendsData.map((u: any) => ({
        id: u.id,
        name: u.userName,
        username: `@${u.userName.toLowerCase().replace(/\s+/g, '')}`,
        avatar: u.userName.substring(0, 2).toUpperCase()
      })));

      // 2. Map only INCOMING pending requests for the alert section
      // We still use Users list to get the sender's display info
      const usersRes = await fetch(`${BASE_URL}/api/Users`);
      const allUsers: any[] = await usersRes.json();

      const incoming = requestsData
        .filter((r: any) => r.status === 'Pending' && r.receiverId === currentUserId)
        .map((r: any) => {
          const sender = allUsers.find(u => u.id === r.senderId);
          return {
            id: sender?.id || '',
            requestId: r.id,
            name: sender?.userName || 'Unknown',
            username: `@${sender?.userName.toLowerCase() || 'user'}`,
            avatar: sender?.userName.substring(0, 2).toUpperCase() || '??'
          };
        });

      setIncomingRequests(incoming);
    } catch (err) {
      console.error("Error loading friends:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: number) => {
    setActionId(requestId);
    try {
      const res = await fetch(`${BASE_URL}/api/Friends/accept/${requestId}`, { method: 'POST' });
      if (res.ok) fetchData(); // Refresh list
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setActionId(requestId);
    try {
      const res = await fetch(`${BASE_URL}/api/Friends/reject/${requestId}`, { method: 'POST' });
      if (res.ok) fetchData(); // Refresh list
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className={`p-3 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'}`}><ArrowLeft className={isDark ? 'text-slate-300' : 'text-slate-700'} /></button>
        <h1 className={`text-2xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>My Friends</h1>
        <button onClick={onToggleDark} className={`p-3 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>{isDark ? <Sun className="text-amber-400" /> : <Moon className="text-slate-600" />}</button>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Find Friends Button */}
        <button onClick={onFindFriends} className={`w-full flex items-center justify-center gap-3 p-5 rounded-3xl font-semibold transition-all ${isDark ? 'bg-slate-800/50 text-slate-100 hover:bg-slate-800' : 'bg-white text-slate-800 hover:bg-slate-50 shadow-sm'}`}>
          <UserPlus className="text-teal-500" /> Find New Friends
        </button>

        {/* Incoming Requests Section */}
        {incomingRequests.length > 0 && (
          <div className="space-y-3">
            <h2 className={`text-sm font-bold uppercase tracking-wider px-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Pending Invites</h2>
            {incomingRequests.map(req => (
              <div key={req.requestId} className={`flex items-center justify-between p-4 rounded-3xl ${isDark ? 'bg-amber-900/10 border border-amber-900/20' : 'bg-amber-50 border border-amber-100'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold">{req.avatar}</div>
                  <div>
                    <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{req.name}</p>
                    <p className="text-xs text-slate-500">wants to be friends</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(req.requestId)} disabled={actionId === req.requestId} className="p-2 rounded-xl bg-teal-600 text-white hover:bg-teal-500"><Check className="w-5 h-5" /></button>
                  <button onClick={() => handleReject(req.requestId)} disabled={actionId === req.requestId} className="p-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-red-500"><X className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Friends List Section */}
        <div className="space-y-3">
          <h2 className={`text-sm font-bold uppercase tracking-wider px-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Friends</h2>
          {loading ? (
             <div className="flex justify-center py-10"><Loader2 className="animate-spin text-teal-500" /></div>
          ) : friends.length > 0 ? (
            friends.map(friend => (
              <button key={friend.id} onClick={() => onSelectFriend?.(friend)} className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all ${isDark ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-white hover:bg-slate-50 shadow-sm'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold">{friend.avatar}</div>
                  <div className="text-left">
                    <h3 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{friend.name}</h3>
                    <p className="text-sm text-slate-500">{friend.username}</p>
                  </div>
                </div>
                <Zap className="text-teal-500 w-5 h-5" />
              </button>
            ))
          ) : (
            <div className="text-center py-10 text-slate-500">No friends yet. Start searching!</div>
          )}
        </div>
      </div>
    </div>
  );
}