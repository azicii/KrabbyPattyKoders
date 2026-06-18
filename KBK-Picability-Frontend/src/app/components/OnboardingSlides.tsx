import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import onboardingFlow from '../onboarding-flow/onboarding-flow.png';

interface OnboardingSlidesProps {
    isDark: boolean;
    onComplete: () => void;
}

const slides = [
    {
        title: 'Add a friend',
        text: 'Search for a friend and send them a request.',
        bgPosition: 'left top'
    },
    {
        title: 'Start a streak',
        text: 'Pick a habit and invite your accountability partner.',
        bgPosition: 'right top'
    },
    {
        title: 'Check in daily',
        text: 'Complete your streak every day to keep it alive.',
        bgPosition: 'left bottom'
    },
    {
        title: 'Support your friends',
        text: 'React to streaks and celebrate progress together.',
        bgPosition: 'right bottom'
    }
];

export function OnboardingSlides({ isDark, onComplete }: OnboardingSlidesProps) {
    const [index, setIndex] = useState(0);
    const slide = slides[index];
    const isLast = index === slides.length - 1;

    const handleContinue = () => {
        if (isLast) onComplete();
        else setIndex(prev => prev + 1);
    };

    return (
        <div className={`min-h-screen p-6 flex flex-col transition-colors duration-300 ${isDark
                ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100'
                : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800'
            }`}>
            <div className="flex-1 flex items-center justify-center">
                <div className={`w-full max-w-md rounded-3xl p-6 text-center shadow-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'
                    }`}>
                    <div
                        className="w-full aspect-[3/2] rounded-3xl overflow-hidden mb-8 bg-slate-950 bg-no-repeat"
                        style={{
                            backgroundImage: `url(${onboardingFlow})`,
                            backgroundSize: '200% 200%',
                            backgroundPosition: slide.bgPosition
                        }}
                    />

                    <h1 className="text-3xl font-bold mb-3">{slide.title}</h1>

                    <p className={`text-base leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                        {slide.text}
                    </p>

                    <div className="flex justify-center gap-2 mt-6">
                        {slides.map((_, dotIndex) => (
                            <div
                                key={dotIndex}
                                className={`h-2 rounded-full transition-all ${dotIndex === index
                                        ? 'w-8 bg-teal-500'
                                        : isDark ? 'w-2 bg-slate-600' : 'w-2 bg-slate-300'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={handleContinue}
                className="w-full max-w-md mx-auto py-5 rounded-3xl font-bold text-lg shadow-xl bg-gradient-to-r from-teal-600 to-cyan-700 text-white hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
                <span>{isLast ? 'Start using Picability' : 'Continue'}</span>
                <ChevronRight className="w-6 h-6" />
            </button>
        </div>
    );
}