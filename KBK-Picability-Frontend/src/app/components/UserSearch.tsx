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
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [showCheckmarkId, setShowCheckmarkId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

    // const BASE_URL = 'http://localhost:5232';
    const BASE_URL = 'https://kbk-picability20260528161204-dwgwf6eehmf5bjeu.canadacentral-01.azurewebsites.net';
    


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, requestsRes] = await Promise.all([
          fetch(`${BASE_URL}/api/Users`),
          fetch(`${BASE_URL}/api/FriendRequests`)
        ]);

        if (!usersRes.ok || !requestsRes.ok) throw new Error('Failed to fetch data');
        
        const usersData = await usersRes.json();
        const requestsData = await requestsRes.json();

        const involvedUserIds = new Set<string>();
        requestsData.forEach((req: any) => {
          if (req.status !== 'Rejected') {
            if (req.senderId === currentUserId) involvedUserIds.add(req.receiverId);
            if (req.receiverId === currentUserId) involvedUserIds.add(req.senderId);
          }
        });
        
        const mappedUsers = usersData
          .filter((u: any) => u.id !== currentUserId && !involvedUserIds.has(u.id))
          .map((u: any) => ({
            id: u.id,
            name: u.userName,
            username: `@${u.userName.toLowerCase().replace(/\s+/g, '')}`,
            avatar: u.userName.substring(0, 2).toUpperCase(),
          }));
          
        setUsers(mappedUsers);
      } catch (err) {
        setError('Could not load search results.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUserId]);

  const handleAddFriend = async (targetUser: User) => {
    setSendingRequest(targetUser.id);
    try {
      const response = await fetch(`${BASE_URL}/api/FriendRequests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUserId, receiverId: targetUser.id }),
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

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Syncing...</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
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