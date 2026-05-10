// This component is a UI mockup for the friend list and search functionality. 
// It includes a header with a back button, title, and dark mode toggle, a search bar 
// to filter friends, and a list of friend cards that can be selected. The selected 
// friend is highlighted, and mutual friends are displayed below their name if available. 
// The add friend button currently does nothing, but it can be wired up to send a 
// friend request or open a chat in the future once the backend is implemented.

import { ArrowLeft, Sun, Moon, Search, UserPlus, Check } from 'lucide-react';
import { useState } from 'react';

export interface User {
  id: string;
  name: string;
  avatar: string;
  username: string;
  mutualFriends?: number;
}

interface UserSearchProps {
  isDark: boolean;
  onToggleDark: () => void;
  onBack?: () => void;
  onSelectUser?: (user: User) => void;
  selectedUserId?: string | null;
}

const mockUsers: User[] = [
  { id: '1', name: 'Sarah Johnson', avatar: 'SJ', username: '@sarahj', mutualFriends: 12 },
  { id: '2', name: 'Mike Chen', avatar: 'MC', username: '@mikechen', mutualFriends: 8 },
  { id: '3', name: 'Emily Rodriguez', avatar: 'ER', username: '@emilyrod', mutualFriends: 15 },
  { id: '4', name: 'Alex Kim', avatar: 'AK', username: '@alexk', mutualFriends: 5 },
  { id: '5', name: 'Jordan Taylor', avatar: 'JT', username: '@jtaylor', mutualFriends: 20 },
  { id: '6', name: 'Priya Patel', avatar: 'PP', username: '@priyap', mutualFriends: 7 },
  { id: '7', name: 'Marcus Williams', avatar: 'MW', username: '@marcusw', mutualFriends: 0 },
  { id: '8', name: 'Sofia Garcia', avatar: 'SG', username: '@sofiagarcia', mutualFriends: 11 },
];

export function UserSearch({
  isDark,
  onToggleDark,
  onBack,
  onSelectUser,
  selectedUserId = null
}: UserSearchProps) {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(selectedUserId);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user.id);
    onSelectUser?.(user);
  };

  const searchUsers = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setUsers(mockUsers);
      return;
    }
    const filtered = mockUsers.filter(user =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.username.toLowerCase().includes(query.toLowerCase())
    );
    setUsers(filtered);
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-slate-900 to-slate-800'
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 ${
            isDark ? 'bg-slate-800' : 'bg-white'
          }`}
        >
          <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
        </button>

        <h1 className={`text-2xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
          Find Friends
        </h1>

        <button
          onClick={onToggleDark}
          className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 ${
            isDark ? 'bg-slate-800' : 'bg-white'
          }`}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className={`relative rounded-3xl shadow-sm overflow-hidden ${
          isDark ? 'bg-slate-800/50 backdrop-blur-sm' : 'bg-white'
        }`}>
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => searchUsers(e.target.value)}
            placeholder="Search your friends..."
            className={`w-full pl-14 pr-6 py-4 bg-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-3xl ${
              isDark
                ? 'text-slate-100 placeholder-slate-400'
                : 'text-slate-800 placeholder-slate-500'
            }`}
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="max-w-2xl mx-auto space-y-3">
        {users.length > 0 ? (
          users.map((user) => {
            const isSelected = selectedUser === user.id;
            return (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className={`group w-full relative overflow-hidden rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${
                  isSelected
                    ? 'bg-gradient-to-br from-teal-600 to-cyan-700'
                    : isDark
                    ? 'bg-slate-800/50 backdrop-blur-sm'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-14 h-14 rounded-2xl font-semibold transition-all duration-200 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white'
                    }`}>
                      {user.avatar}
                    </div>

                    <div className="text-left">
                      <h3 className={`font-semibold ${
                        isSelected ? 'text-white' : isDark ? 'text-slate-100' : 'text-slate-800'
                      }`}>
                        {user.name}
                      </h3>
                      <p className={`text-sm ${
                        isSelected ? 'text-white/80' : isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {user.username}
                      </p>
                      {/* Mutual Friends Display */}
                      {user.mutualFriends !== undefined && user.mutualFriends > 0 && (
                        <p className={`text-xs mt-0.5 transition-colors ${
                          isSelected ? 'text-white/70' : 'text-slate-500'
                        }`}>
                          {user.mutualFriends} mutual friends
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Icon */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                    isSelected
                      ? 'bg-white/20'
                      : isDark
                      ? 'bg-slate-700 group-hover:bg-slate-650'
                      : 'bg-slate-100 group-hover:bg-slate-200'
                  }`}>
                    {isSelected ? (
                      <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
                    ) : (
                      <UserPlus className={`w-5 h-5 ${
                        isDark ? 'text-teal-400' : 'text-teal-600'
                      }`} />
                    )}
                  </div>
                </div>

                {!isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-cyan-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl" />
                )}
              </button>
            );
          })
        ) : (
          <div className="text-center py-16">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              No friends found
            </h2>
          </div>
        )}
      </div>
    </div>
  );
}