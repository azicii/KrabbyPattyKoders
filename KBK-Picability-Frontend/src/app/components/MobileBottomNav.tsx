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
        <div className="fixed bottom-4 left-1/2 z-[80] -translate-x-1/2 md:hidden">
            <div
                className={`flex items-center gap-2 rounded-full px-3 py-2 shadow-lg border backdrop-blur-xl ${isDark
                        ? 'bg-slate-900/45 border-slate-700/40'
                        : 'bg-white/50 border-slate-200/60'
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
        </div>
    );
}