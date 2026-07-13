import { ArrowLeft, Users, Sun, Moon, Dumbbell, BookOpen, Droplets, Moon as MoonIcon, Apple, Heart, Target, Coffee, Bike, Camera, Code, Music, Palette, Plane, Home, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { User } from './UserSearch.tsx';

interface HabitConfigProps {
    isDark: boolean;
    onToggleDark: () => void;
    onBack?: () => void;
    onFriends?: () => void;
    onConfirm?: (config: HabitConfiguration) => void;
    habitType?: number | 'create';
    presetHabitName?: string;
    preSelectedFriend?: User | null;
    existingHabitNames?: string[];
    draftConfig?: Partial<HabitConfiguration> | null;
    onDraftChange?: (config: Partial<HabitConfiguration>) => void;
    user: {
        userName: string;
    };
}

export interface HabitConfiguration {
    HabitName: string;
    HabitIcon: string;
    Color: string;

    RequiredCheckIns: number;
    CycleLength: number;
    CycleUnit: 'Day' | 'Week' | 'Month';

    friendId?: string;
    friendName?: string;
    friendAvatar?: string;
}

const iconOptions = [
    { icon: Dumbbell, label: 'Exercise', componentName: 'Dumbbell' },
    { icon: BookOpen, label: 'Reading', componentName: 'BookOpen' },
    { icon: Droplets, label: 'Hydration', componentName: 'Droplets' },
    { icon: MoonIcon, label: 'Sleep', componentName: 'Moon' },
    { icon: Apple, label: 'Food', componentName: 'Apple' },
    { icon: Heart, label: 'Meditation', componentName: 'Heart' },
    { icon: Target, label: 'Goal', componentName: 'Target' },
    { icon: Coffee, label: 'Coffee', componentName: 'Coffee' },
    { icon: Bike, label: 'Cycling', componentName: 'Bike' },
    { icon: Camera, label: 'Photography', componentName: 'Camera' },
    { icon: Code, label: 'Coding', componentName: 'Code' },
    { icon: Music, label: 'Music', componentName: 'Music' },
    { icon: Palette, label: 'Art', componentName: 'Palette' },
    { icon: Plane, label: 'Travel', componentName: 'Plane' },
    { icon: Home, label: 'Home', componentName: 'Home' },
];

const habitToIconMap: { [key: string]: string } = {
    'Exercise': 'Exercise',
    'Reading': 'Reading',
    'Hydration': 'Hydration',
    'Sleep': 'Sleep',
    'Healthy Eating': 'Food',
    'Meditation': 'Meditation',
    'Goal Setting': 'Goal',
};

const colorOptions = [
    { name: 'Emerald', gradient: 'from-emerald-500 to-teal-600' },
    { name: 'Violet', gradient: 'from-violet-500 to-purple-600' },
    { name: 'Sky', gradient: 'from-sky-500 to-blue-600' },
    { name: 'Rose', gradient: 'from-rose-500 to-pink-600' },
    { name: 'Amber', gradient: 'from-amber-500 to-orange-600' },
];

const requiredCheckInOptions = Array.from(
    { length: 100 },
    (_, index) => index + 1
);

const cycleLengthOptions = Array.from(
    { length: 365 },
    (_, index) => index + 1
);

type CycleUnit = 'Day' | 'Week' | 'Month';

export function HabitConfig({
    isDark,
    user,
    onToggleDark,
    onBack,
    onFriends,
    onConfirm,
    habitType,
    presetHabitName = '',
    preSelectedFriend = null,
    existingHabitNames = [],
    draftConfig = null,
    onDraftChange
}: HabitConfigProps) {
    const isCustomHabit = habitType === 'create';
    const [habitName, setHabitName] = useState(draftConfig?.HabitName || presetHabitName);
    const [selectedIconIndex, setSelectedIconIndex] = useState(() => {
        if (draftConfig?.HabitIcon) {
            const index = iconOptions.findIndex(option => option.componentName === draftConfig.HabitIcon);
            return index !== -1 ? index : 0;
        }
        return 0;
    });
    const [selectedColorIndex, setSelectedColorIndex] = useState(() => {
        if (draftConfig?.Color) {
            const index = colorOptions.findIndex(color => color.gradient === draftConfig.Color);
            return index !== -1 ? index : 0;
        }
        return 0;
    });
    const [showColorPicker, setShowColorPicker] = useState<number | null>(null);
    const [showCustomFrequency, setShowCustomFrequency] = useState(() => {
        return (
            (draftConfig?.RequiredCheckIns ?? 1) !== 1 ||
            (draftConfig?.CycleLength ?? 1) !== 1 ||
            (draftConfig?.CycleUnit ?? 'Day') !== 'Day'
        );
    });

    const [requiredCheckIns, setRequiredCheckIns] = useState(
        draftConfig?.RequiredCheckIns ?? 1
    );

    const [cycleLength, setCycleLength] = useState(
        draftConfig?.CycleLength ?? 1
    );

    const [cycleUnit, setCycleUnit] = useState<CycleUnit>(
        draftConfig?.CycleUnit ?? 'Day'
    );
    const isDuplicate = existingHabitNames.some(
        (name) => name.toLowerCase() === habitName.trim().toLowerCase()
    );
    const canSubmit = habitName.trim().length > 0 && preSelectedFriend !== null && !isDuplicate;
    const handleExternalInvite = async () => {
        const trimmedHabitName = habitName.trim();

        if (!trimmedHabitName) {
            alert('Enter a habit name before sending an invitation.');
            return;
        }

        const senderName = user?.userName || 'Your friend';
        const appUrl = 'https://picability.vercel.app';

        const shareText =
            `${senderName} wants to start '${trimmedHabitName}' habit streak with you on Picability.\n\n` +
            `Join Picability so you can keep each other accountable:`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Picability habit streak invitation',
                    text: shareText,
                    url: appUrl
                });

                return;
            }

            await navigator.clipboard.writeText(
                `${shareText}\n${appUrl}`
            );

            alert('Invitation copied. Paste it into a text message.');
        } catch (error) {
            if (
                error instanceof DOMException &&
                error.name === 'AbortError'
            ) {
                return;
            }

            console.error('Could not share Picability invitation:', error);
            alert('Could not open the share menu.');
        }
    };
    const handleConfirm = () => {
        if (!canSubmit) return;
        if (!preSelectedFriend) return;

        const config: HabitConfiguration = {
            HabitName: habitName || presetHabitName,
            HabitIcon: iconOptions[selectedIconIndex].componentName,

            Color: colorOptions[selectedColorIndex].gradient,

            RequiredCheckIns: requiredCheckIns,
            CycleLength: cycleLength,
            CycleUnit: cycleUnit,

            friendId: preSelectedFriend.id,
            friendName: preSelectedFriend.name,
            friendAvatar: preSelectedFriend.avatar,
        };
        onConfirm?.(config);
    };

    const SelectedIcon = iconOptions[selectedIconIndex].icon;

    useEffect(() => {
        if (presetHabitName) {
            setHabitName(presetHabitName);
            const iconLabel = habitToIconMap[presetHabitName];
            const index = iconOptions.findIndex(option => option.label === iconLabel);
            if (index !== -1) {
                setSelectedIconIndex(index);
            }
        }
    }, [presetHabitName]);

    useEffect(() => {
        onDraftChange?.({
            HabitName: habitName,
            HabitIcon: iconOptions[selectedIconIndex].componentName,
            Color: colorOptions[selectedColorIndex].gradient,

            RequiredCheckIns: requiredCheckIns,
            CycleLength: cycleLength,
            CycleUnit: cycleUnit
        });
    }, [
        habitName,
        selectedIconIndex,
        selectedColorIndex,
        requiredCheckIns,
        cycleLength,
        cycleUnit
    ]);

    return (
        <div className={`min-h-screen p-6 transition-colors duration-300 ${isDark
                ? 'bg-gradient-to-br from-slate-900 to-slate-800'
                : 'bg-gradient-to-br from-slate-50 to-slate-100'
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={onBack}
                    className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'
                        }`}
                >
                    <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
                </button>
                <h1 className={`text-2xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    {isCustomHabit ? 'Create Habit' : 'Configure Habit'}
                </h1>
                <button
                    onClick={onToggleDark}
                    className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'
                        }`}
                >
                    {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
                </button>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Habit Name */}
                <div className={`rounded-3xl p-6 ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
                    <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Habit Name
                    </label>
                    <input
                        type="text"
                        value={habitName}
                        onChange={(e) => setHabitName(e.target.value)}
                        disabled={!isCustomHabit}
                        placeholder="Enter habit name..."
                        className={`w-full px-4 py-3 rounded-2xl outline-none transition-all ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-800'
                            } ${!isCustomHabit ? 'opacity-60 cursor-not-allowed' : 'focus:ring-2 focus:ring-teal-500'}`}
                    />
                </div>

                {/* Icon & Color */}
                <div className={`rounded-3xl p-6 ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
                    <label className="block text-sm font-medium mb-4 text-slate-400">Icon & Theme</label>
                    <div className="grid grid-cols-5 gap-3">
                        {iconOptions.map((option, index) => {
                            const IconComp = option.icon;
                            const isSelected = selectedIconIndex === index;
                            return (
                                <button
                                    key={index}
                                    onClick={() => setSelectedIconIndex(index)}
                                    className={`flex items-center justify-center aspect-square rounded-2xl transition-all ${isSelected ? `bg-gradient-to-br ${colorOptions[selectedColorIndex].gradient} shadow-lg scale-105` : (isDark ? 'bg-slate-700' : 'bg-slate-100')
                                        }`}
                                >
                                    <IconComp className={`w-6 h-6 ${isSelected ? 'text-white' : (isDark ? 'text-slate-400' : 'text-slate-600')}`} />
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex gap-3 mt-6 justify-center">
                        {colorOptions.map((color, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedColorIndex(idx)}
                                className={`w-10 h-10 rounded-full bg-gradient-to-br ${color.gradient} ${selectedColorIndex === idx ? 'ring-4 ring-teal-500/30 ring-offset-2' : ''
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Check-In Frequency */}
                <div
                    className={`rounded-3xl p-6 ${isDark ? 'bg-slate-800/50' : 'bg-white'
                        }`}
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <label
                                className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'
                                    }`}
                            >
                                Check-In Frequency
                            </label>

                            <p
                                className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'
                                    }`}
                            >
                                {requiredCheckIns === 1 &&
                                    cycleLength === 1 &&
                                    cycleUnit === 'Day'
                                    ? 'Once daily'
                                    : `${requiredCheckIns} ${requiredCheckIns === 1
                                        ? 'check-in'
                                        : 'check-ins'
                                    } every ${cycleLength} ${cycleUnit.toLowerCase()}${cycleLength === 1 ? '' : 's'
                                    }`}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setShowCustomFrequency(current => !current)
                            }
                            className={`shrink-0 text-sm font-semibold transition-colors ${isDark
                                    ? 'text-teal-400 hover:text-teal-300'
                                    : 'text-teal-600 hover:text-teal-700'
                                }`}
                        >
                            {showCustomFrequency ? 'Done' : 'Customize'}
                        </button>
                    </div>

                    {showCustomFrequency && (
                        <div
                            className={`mt-5 pt-5 border-t ${isDark
                                    ? 'border-slate-700'
                                    : 'border-slate-200'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2 sm:gap-3">
                                <span
                                    className={`text-sm shrink-0 ${isDark
                                            ? 'text-slate-400'
                                            : 'text-slate-600'
                                        }`}
                                >
                                    Check in
                                </span>

                                <select
                                    value={requiredCheckIns}
                                    onChange={(event) =>
                                        setRequiredCheckIns(
                                            Number(event.target.value)
                                        )
                                    }
                                    aria-label="Required check-ins"
                                    className={`h-11 min-w-[64px] rounded-xl px-3 text-center font-semibold outline-none transition-all ${isDark
                                            ? 'bg-slate-700 text-white focus:ring-2 focus:ring-teal-500'
                                            : 'bg-slate-100 text-slate-800 focus:ring-2 focus:ring-teal-500'
                                        }`}
                                >
                                    {requiredCheckInOptions.map(value => (
                                        <option key={value} value={value}>
                                            {value}
                                        </option>
                                    ))}
                                </select>

                                <span
                                    className={`text-sm shrink-0 ${isDark
                                            ? 'text-slate-400'
                                            : 'text-slate-600'
                                        }`}
                                >
                                    times every
                                </span>

                                <select
                                    value={cycleLength}
                                    onChange={(event) =>
                                        setCycleLength(
                                            Number(event.target.value)
                                        )
                                    }
                                    aria-label="Cycle length"
                                    className={`h-11 min-w-[64px] rounded-xl px-3 text-center font-semibold outline-none transition-all ${isDark
                                            ? 'bg-slate-700 text-white focus:ring-2 focus:ring-teal-500'
                                            : 'bg-slate-100 text-slate-800 focus:ring-2 focus:ring-teal-500'
                                        }`}
                                >
                                    {cycleLengthOptions.map(value => (
                                        <option key={value} value={value}>
                                            {value}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={cycleUnit}
                                    onChange={(event) =>
                                        setCycleUnit(
                                            event.target.value as CycleUnit
                                        )
                                    }
                                    aria-label="Cycle unit"
                                    className={`h-11 min-w-[92px] rounded-xl px-3 font-semibold outline-none transition-all ${isDark
                                            ? 'bg-slate-700 text-white focus:ring-2 focus:ring-teal-500'
                                            : 'bg-slate-100 text-slate-800 focus:ring-2 focus:ring-teal-500'
                                        }`}
                                >
                                    <option value="Day">
                                        {cycleLength === 1 ? 'Day' : 'Days'}
                                    </option>

                                    <option value="Week">
                                        {cycleLength === 1 ? 'Week' : 'Weeks'}
                                    </option>

                                    <option value="Month">
                                        {cycleLength === 1 ? 'Month' : 'Months'}
                                    </option>
                                </select>
                            </div>

                            <p
                                className={`text-xs text-center mt-4 ${isDark
                                        ? 'text-slate-500'
                                        : 'text-slate-400'
                                    }`}
                            >
                                The streak advances once both partners finish
                                this cycle.
                            </p>

                            {!(
                                requiredCheckIns === 1 &&
                                cycleLength === 1 &&
                                cycleUnit === 'Day'
                            ) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRequiredCheckIns(1);
                                            setCycleLength(1);
                                            setCycleUnit('Day');
                                        }}
                                        className={`block mx-auto mt-3 text-xs font-medium transition-colors ${isDark
                                                ? 'text-slate-400 hover:text-teal-400'
                                                : 'text-slate-500 hover:text-teal-600'
                                            }`}
                                    >
                                        Reset to daily
                                    </button>
                                )}
                        </div>
                    )}
                </div>

                {/* Accountability Partner */}
                <div className={`rounded-3xl p-6 ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
                    <label className="block text-sm font-medium mb-4 text-slate-400">
                        Accountability Partner
                    </label>

                    {preSelectedFriend ? (
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">
                                    {preSelectedFriend.avatar}
                                </div>

                                <div>
                                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {preSelectedFriend.name}
                                    </p>

                                    <p className="text-xs text-teal-500">
                                        Selected Partner
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onFriends}
                                className={`text-xs font-medium px-3 py-1 rounded-lg ${isDark
                                        ? 'bg-slate-700 text-slate-300'
                                        : 'bg-slate-200 text-slate-600'
                                    }`}
                            >
                                Change
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={onFriends}
                            className={`w-full p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center gap-2 ${isDark
                                    ? 'border-slate-700 text-slate-500 hover:border-slate-500'
                                    : 'border-slate-200 text-slate-400 hover:border-teal-300 hover:text-teal-500'
                                }`}
                        >
                            <Users className="w-8 h-8" />
                            <span className="font-medium">
                                Select a Friend to Start
                            </span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleExternalInvite}
                        className={`w-full mt-4 py-2 text-sm font-medium transition-colors ${isDark
                                ? 'text-slate-400 hover:text-teal-400'
                                : 'text-slate-500 hover:text-teal-600'
                            }`}
                    >
                        Invite someone who isn't on Picability
                    </button>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleConfirm}
                    disabled={!habitName || !preSelectedFriend}
                    className={`w-full py-5 rounded-3xl font-bold text-lg shadow-xl transition-all ${(!habitName || !preSelectedFriend)
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-teal-600 to-cyan-700 text-white hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-95'
                        }`}
                >
                    <div className="flex items-center justify-center gap-3">
                        <SelectedIcon className="w-6 h-6" />
                        <span>Start Habit Streak</span>
                    </div>
                </button>
            </div>
        </div>
    );
}