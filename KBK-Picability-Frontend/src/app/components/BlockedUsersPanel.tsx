import { useEffect, useState } from 'react';
import { Loader2, ShieldBan } from 'lucide-react';

const BASE_URL = 'https://kbk-picability-backend.onrender.com';

type BlockedUser = {
    userId: string;
    userName: string | null;
    blockedAt: string;
};

type BlockedUsersPanelProps = {
    isDark: boolean;
    onUnblockSuccess?: () => void;
};

export function BlockedUsersPanel({
    isDark,
    onUnblockSuccess
}: BlockedUsersPanelProps) {
    const [users, setUsers] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyUserId, setBusyUserId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const getToken = (): string | null => {
        try {
            const raw = localStorage.getItem('picabilityUser');
            if (!raw) return null;

            const parsed = JSON.parse(raw);
            return parsed?.token ?? null;
        } catch {
            return null;
        }
    };

    useEffect(() => {
        let cancelled = false;

        const loadBlockedUsers = async () => {
            const token = getToken();

            if (!token) {
                if (!cancelled) {
                    setError('Please sign in again.');
                    setLoading(false);
                }
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}/api/user-blocks`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Unable to load blocked users (${response.status}).`);
                }

                const data: BlockedUser[] = await response.json();

                if (!cancelled) {
                    setUsers(data);
                    setError('');
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Unable to load blocked users.'
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadBlockedUsers();

        return () => {
            cancelled = true;
        };
    }, []);

    const unblockUser = async (user: BlockedUser) => {
        if (busyUserId) return;

        const confirmed = window.confirm(
            `Unblock ${user.userName || 'this user'}?

You may interact with each other again, but deleted friendships and streaks will not be restored.`
        );

        if (!confirmed) return;

        const token = getToken();

        if (!token) {
            setError('Please sign in again.');
            return;
        }

        try {
            setBusyUserId(user.userId);
            setError('');

            const response = await fetch(
                `${BASE_URL}/api/user-blocks/${encodeURIComponent(user.userId)}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Unable to unblock user (${response.status}).`);
            }

            setUsers(previous =>
                previous.filter(item => item.userId !== user.userId)
            );

            onUnblockSuccess?.();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to unblock user.'
            );
        } finally {
            setBusyUserId(null);
        }
    };

    return (
        <section className="mt-4">
            <div className="flex items-center gap-2 mb-2">
                <ShieldBan className="w-5 h-5 text-rose-500" />
                <h3 className="font-semibold">Blocked Users</h3>
            </div>

            <p className="text-xs opacity-70 mb-3">
                Manage people you have blocked. Unblocking does not
                restore deleted friendships or streaks.
            </p>

            {loading ? (
                <div className="flex items-center gap-2 py-3 text-sm opacity-70">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading blocked users...
                </div>
            ) : (
                <>
                    {error && (
                        <p role="alert" className="text-sm text-rose-500 mb-3">
                            {error}
                        </p>
                    )}

                    {!error && users.length === 0 && (
                        <p className="text-sm opacity-60 py-2">
                            You haven't blocked anyone.
                        </p>
                    )}

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {users.map(user => (
                            <div
                                key={user.userId}
                                className={`flex items-center justify-between gap-2 rounded-xl p-3 ${
                                    isDark ? 'bg-slate-800' : 'bg-slate-100'
                                }`}
                            >
                                <span className="text-sm font-medium truncate">
                                    {user.userName || 'Unknown user'}
                                </span>

                                <button
                                    type="button"
                                    disabled={busyUserId !== null}
                                    onClick={() => void unblockUser(user)}
                                    className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-500/10 disabled:opacity-50"
                                >
                                    {busyUserId === user.userId
                                        ? 'Unblocking...'
                                        : 'Unblock'}
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}