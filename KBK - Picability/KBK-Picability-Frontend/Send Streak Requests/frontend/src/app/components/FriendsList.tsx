import { ArrowLeft, Sun, Moon, UserPlus, Zap, Clock } from 'lucide-react';
import { User } from '../../imports/UserSearch';

export interface PendingRequest {
  friendId: string;
  habitName: string;
  icon: string;
  color: string;
}

interface FriendsListProps {
  isDark: boolean;
  onToggleDark: () => void;
  onBack?: () => void;
  onSelectFriend?: (user: User) => void;
  onFindFriends?: () => void;
  pendingRequests?: PendingRequest[];
}

// Mock friends data - these are friends the user has already added
// These match the accountability partners available in HabitConfig
/*
const mockFriends: User[] = [
  { id: '1', name: 'Sarah Johnson', avatar: 'SJ', username: '@sarahj' },
  { id: '2', name: 'Mike Chen', avatar: 'MC', username: '@mikechen' },
  { id: '3', name: 'Emily Rodriguez', avatar: 'ER', username: '@emilyrod' },
  { id: '4', name: 'Alex Kim', avatar: 'AK', username: '@alexk' },
  { id: '5', name: 'Jordan Taylor', avatar: 'JT', username: '@jtaylor' },
];
*/

export function FriendsList({
  isDark,
  onToggleDark,
  onBack,
  onSelectFriend,
  onFindFriends,
  pendingRequests = []
}: FriendsListProps) {

  const handleFriendSelect = (user: User) => {
    onSelectFriend?.(user);
  };

  const getPendingRequestForFriend = (friendId: string) => {
    return pendingRequests.find(req => req.friendId === friendId);
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
          My Friends
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

      {/* Add Friends Button */}
      <div className="max-w-2xl mx-auto mb-6">
        <button
          onClick={onFindFriends}
          className={`w-full rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${
            isDark
              ? 'bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/70'
              : 'bg-white hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            <UserPlus className={`w-5 h-5 ${
              isDark ? 'text-teal-400' : 'text-teal-600'
            }`} />
            <span className={`font-semibold ${
              isDark ? 'text-slate-100' : 'text-slate-800'
            }`}>
              Find Friends
            </span>
          </div>
        </button>
      </div>

      {/* Friends List */}
      <div className="max-w-2xl mx-auto space-y-3">
        {mockFriends.length > 0 ? (
          mockFriends.map((user) => {
            const pendingRequest = getPendingRequestForFriend(user.id);
            const hasPending = !!pendingRequest;

            return (
              <div key={user.id}>
                <button
                  onClick={() => !hasPending && handleFriendSelect(user)}
                  disabled={hasPending}
                  className={`group w-full relative overflow-hidden rounded-3xl p-5 shadow-sm transition-all duration-300 ${
                    hasPending
                      ? 'cursor-default'
                      : 'hover:shadow-xl hover:scale-[1.02]'
                  } ${
                    isDark
                      ? 'bg-slate-800/50 backdrop-blur-sm'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-14 h-14 rounded-2xl font-semibold bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
                        {user.avatar}
                      </div>

                      <div className="text-left">
                        <h3 className={`font-semibold transition-colors ${
                          isDark
                            ? 'text-slate-100 group-hover:text-slate-50'
                            : 'text-slate-800 group-hover:text-slate-900'
                        }`}>
                          {user.name}
                        </h3>
                        <p className={`text-sm transition-colors ${
                          isDark
                            ? 'text-slate-400'
                            : 'text-slate-600'
                        }`}>
                          {user.username}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    {!hasPending ? (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                        isDark
                          ? 'bg-slate-700 group-hover:bg-teal-600'
                          : 'bg-slate-100 group-hover:bg-teal-600'
                      }`}>
                        <Zap className={`w-5 h-5 transition-colors ${
                          isDark
                            ? 'text-teal-400 group-hover:text-white'
                            : 'text-teal-600 group-hover:text-white'
                        }`} />
                        <span className={`text-sm font-medium transition-colors ${
                          isDark
                            ? 'text-slate-200 group-hover:text-white'
                            : 'text-slate-800 group-hover:text-white'
                        }`}>
                          Send Request
                        </span>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                        isDark
                          ? 'bg-amber-900/30'
                          : 'bg-amber-100'
                      }`}>
                        <Clock className={`w-5 h-5 ${
                          isDark ? 'text-amber-400' : 'text-amber-600'
                        }`} />
                        <span className={`text-sm font-medium ${
                          isDark ? 'text-amber-400' : 'text-amber-700'
                        }`}>
                          Pending
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Gradient overlay on hover */}
                  {!hasPending && (
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-cyan-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl" />
                  )}
                </button>

                {/* Pending Request Details */}
                {hasPending && pendingRequest && (
                  <div className={`mt-2 ml-4 p-3 rounded-2xl ${
                    isDark ? 'bg-slate-800/30' : 'bg-slate-100/50'
                  }`}>
                    <p className={`text-xs ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Pending: <span className="font-semibold">{pendingRequest.habitName}</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16">
            <div className={`text-6xl mb-4 ${isDark ? 'opacity-50' : 'opacity-30'}`}>
              👥
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              No friends yet
            </h2>
            <p className={`text-sm ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Add friends to start accountability streaks
            </p>
          </div>
        )}
      </div>

      {/* Friends count */}
      {mockFriends.length > 0 && (
        <div className="max-w-2xl mx-auto mt-6">
          <p className={`text-center text-sm ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {mockFriends.length} {mockFriends.length === 1 ? 'friend' : 'friends'}
          </p>
        </div>
      )}
    </div>
  );
}
