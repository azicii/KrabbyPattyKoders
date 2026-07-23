import { Flame, Home, Users } from 'lucide-react';

export type MobileTab = 'friends' | 'tracker' | 'feed';

interface MobileBottomNavProps {
    activeTab: MobileTab;
    onChangeTab: (tab: MobileTab) => void;
    isDark: boolean;
}

const tabs: {
    id: MobileTab;
    label: string;
    icon: typeof Users;
}[] = [
        {
            id: 'friends',
            label: 'Friends',
            icon: Users
        },
        {
            id: 'tracker',
            label: 'Home',
            icon: Home
        },
        {
            id: 'feed',
            label: 'Feed',
            icon: Flame
        }
    ];

export function MobileBottomNav({
    activeTab,
    onChangeTab,
    isDark
}: MobileBottomNavProps) {
    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-[120] flex justify-center pointer-events-none"
            style={{
                paddingBottom:
                    'max(12px, env(safe-area-inset-bottom))',
                paddingTop: '8px'
            }}
            aria-label="Primary navigation"
        >
            <div
                className={`pointer-events-auto flex items-center gap-2 rounded-full px-3 py-2 shadow-lg border backdrop-blur-xl ${isDark
                        ? 'bg-slate-900/90 border-slate-700/60'
                        : 'bg-white/90 border-slate-200/80'
                    }`}
            >
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onChangeTab(tab.id)}
                            aria-label={tab.label}
                            aria-current={
                                isActive ? 'page' : undefined
                            }
                            className={`h-9 rounded-full transition-all duration-300 flex items-center justify-center ${isActive
                                    ? 'w-16 bg-teal-500/20 text-teal-400'
                                    : isDark
                                        ? 'w-9 text-slate-500 hover:text-slate-300'
                                        : 'w-9 text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {isActive ? (
                                <Icon className="w-4 h-4" />
                            ) : (
                                <span className="w-2 h-2 rounded-full bg-current opacity-70" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}