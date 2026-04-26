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

// Mock user data
const mockUsers: User[] = [
  { id: '1', name: 'Sarah Johnson', avatar: 'SJ', username: '@sarahj', mutualFriends: 12 },
  { id: '2', name: 'Mike Chen', avatar: 'MC', username: '@mikechen', mutualFriends: 8 },
  { id: '3', name: 'Emily Rodriguez', avatar: 'ER', username: '@emilyrod', mutualFriends: 15 },
  { id: '4', name: 'Alex Kim', avatar: 'AK', username: '@alexk', mutualFriends: 5 },
  { id: '5', name: 'Jordan Taylor', avatar: 'JT', username: '@jtaylor', mutualFriends: 20 },
  { id: '6', name: 'Priya Patel', avatar: 'PP', username: '@priyap', mutualFriends: 7 },
  { id: '7', name: 'Marcus Williams', avatar: 'MW', username: '@marcusw', mutualFriends: 3 },
  { id: '8', name: 'Sofia Garcia', avatar: 'SG', username: '@sofiagarcia', mutualFriends: 11 },
  { id: '9', name: 'David Lee', avatar: 'DL', username: '@davidlee', mutualFriends: 9 },
  { id: '10', name: 'Nina Martinez', avatar: 'NM', username: '@ninam', mutualFriends: 6 },
];


export function UserSearch({
  isDark,
  onToggleDark,
  onBack,
  onSelectUser,
  selectedUserId = null
}: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(selectedUserId);

  // Filter users based on search query
  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (user: User) => {
    setSelectedUser(user.id);
    onSelectUser?.(user);
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
            isDark
              ? 'bg-slate-800 hover:bg-slate-750'
              : 'bg-white'
          }`}
          aria-label="Go back"
        >
          <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
        </button>

        <h1 className={`text-2xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
          Find Friends
        </h1>

        <button
          onClick={onToggleDark}
          className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-750'
              : 'bg-white'
          }`}
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </button>
      </div>

      {/* Search Bar */}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or username..."
            className={`w-full pl-14 pr-6 py-4 bg-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-3xl ${
              isDark
                ? 'text-slate-100 placeholder-slate-400'
                : 'text-slate-800 placeholder-slate-500'
            }`}
          />
        </div>
      </div>

      {/* Users List */}
      <div className="max-w-2xl mx-auto space-y-3">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
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
                  {/* User Info */}
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-14 h-14 rounded-2xl font-semibold transition-all duration-200 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : isDark
                        ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white'
                        : 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white'
                    }`}>
                      {user.avatar}
                    </div>

                    <div className="text-left">
                      <h3 className={`font-semibold transition-colors ${
                        isSelected
                          ? 'text-white'
                          : isDark
                          ? 'text-slate-100 group-hover:text-slate-50'
                          : 'text-slate-800 group-hover:text-slate-900'
                      }`}>
                        {user.name}
                      </h3>
                      <p className={`text-sm transition-colors ${
                        isSelected
                          ? 'text-white/80'
                          : isDark
                          ? 'text-slate-400'
                          : 'text-slate-600'
                      }`}>
                        {user.username}
                      </p>
                      {user.mutualFriends !== undefined && (
                        <p className={`text-xs mt-0.5 transition-colors ${
                          isSelected
                            ? 'text-white/70'
                            : isDark
                            ? 'text-slate-500'
                            : 'text-slate-500'
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

                {/* Subtle gradient overlay on hover (only when not selected) */}
                {!isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-cyan-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl" />
                )}

                {/* Shimmer effect for selected */}
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                )}
              </button>
            );
          })
        ) : (
          <div className="text-center py-16">
            <div className={`text-6xl mb-4 ${isDark ? 'opacity-50' : 'opacity-30'}`}>
              🔍
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              No users found
            </h2>
            <p className={`text-sm ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Try a different search term
            </p>
          </div>
        )}
      </div>

      {/* Results count */}
      {searchQuery && filteredUsers.length > 0 && (
        <div className="max-w-2xl mx-auto mt-4">
          <p className={`text-center text-sm ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Found {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          </p>
        </div>
      )}
    </div>
  );
}