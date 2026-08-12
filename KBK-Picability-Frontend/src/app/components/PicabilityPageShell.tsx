import React from 'react';

export type PicabilityPageVariant =
    | 'tracker'
    | 'friends'
    | 'feed'
    | 'auth'
    | 'selector'
    | 'config'
    | 'search'
    | 'confirmation'
    | 'onboarding';

interface PicabilityPageShellProps {
    children: React.ReactNode;
    variant: PicabilityPageVariant;
    accentColor?: string;
    isDark?: boolean;
    className?: string;
}

interface MotifProps {
    name: 'corner' | 'edge' | 'cluster' | 'micro';
    accentColor: string;
    className: string;
    opacity?: number;
    rotate?: string;
}

function PicabilityMotif({
    name,
    accentColor,
    className,
    opacity = 1,
    rotate = '0deg'
}: MotifProps) {
    const structure =
        `/streak-designs/streak-${name}-structure.png`;

    const accentMask =
        `/streak-designs/streak-${name}-accent-mask.png`;

    return (
        <div
            aria-hidden="true"
            className={`pointer-events-none absolute ${className}`}
            style={{
                opacity,
                transform: `rotate(${rotate})`,
                transformOrigin: 'center'
            }}
        >
            <img
                src={structure}
                alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-contain select-none"
            />

            <div
                className="absolute inset-0"
                style={{
                    backgroundColor: accentColor,
                    WebkitMaskImage:
                        `url("${accentMask}")`,
                    maskImage:
                        `url("${accentMask}")`,
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain'
                }}
            />
        </div>
    );
}

interface FullBleedProps {
    src: string;
    accentColor: string;
    opacity: number;
    backgroundSize?: string;
    backgroundPosition?: string;
    repeat?: boolean;
    flip?: boolean;
}

function FullBleedStreaks({
    src,
    accentColor,
    opacity,
    backgroundSize = '100% auto',
    backgroundPosition = 'top center',
    repeat = true,
    flip = false
}: FullBleedProps) {
    return (
        <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{
                opacity,
                transform: flip
                    ? 'scaleX(-1)'
                    : undefined
            }}
        >
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage:
                        `url("${src}")`,
                    backgroundRepeat:
                        repeat
                            ? 'repeat-y'
                            : 'no-repeat',
                    backgroundSize,
                    backgroundPosition
                }}
            />

            {/*
                Color blend changes the cyan/blue hue while
                retaining the original black/white luminosity.
            */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundColor: accentColor,
                    mixBlendMode: 'color'
                }}
            />
        </div>
    );
}

export function PicabilityPageShell({
    children,
    variant,
    accentColor = '#0ea5e9',
    isDark = true,
    className = ''
}: PicabilityPageShellProps) {
    const baseBackground =
        isDark
            ? '#020d1f'
            : '#f8fafc';

    const accentBackground = isDark
        ? `color-mix(in srgb, ${accentColor} 18%, #020d1f)`
        : `color-mix(in srgb, ${accentColor} 10%, #f8fafc)`;

    const renderArtwork = () => {
        switch (variant) {
            case 'tracker':
                return (
                    <>
                        <FullBleedStreaks
                            src="/streak-designs/streak-ambient.jpg"
                            accentColor={accentColor}
                            opacity={0.19}
                            backgroundSize="100% auto"
                        />

                        <PicabilityMotif
                            name="cluster"
                            accentColor={accentColor}
                            opacity={0.20}
                            className="
                                hidden sm:block
                                right-[-8rem]
                                bottom-[6rem]
                                w-[34rem]
                                h-[34rem]
                            "
                        />

                        <PicabilityMotif
                            name="micro"
                            accentColor={accentColor}
                            opacity={0.26}
                            className="
                                right-4
                                top-[7rem]
                                w-24
                                h-24
                                sm:right-16
                                sm:w-36
                                sm:h-36
                            "
                        />
                    </>
                );

            case 'friends':
                return (
                    <>
                        <FullBleedStreaks
                            src="/streak-designs/streak-ambient.jpg"
                            accentColor={accentColor}
                            opacity={0.13}
                            backgroundSize="115% auto"
                            flip
                        />

                        <PicabilityMotif
                            name="corner"
                            accentColor={accentColor}
                            opacity={0.28}
                            rotate="180deg"
                            className="
                                -top-20
                                -right-20
                                w-[24rem]
                                h-[24rem]
                                sm:w-[34rem]
                                sm:h-[34rem]
                            "
                        />

                        <PicabilityMotif
                            name="micro"
                            accentColor={accentColor}
                            opacity={0.22}
                            className="
                                left-4
                                bottom-28
                                w-28
                                h-28
                            "
                        />
                    </>
                );

            case 'feed':
                return (
                    <>
                        <FullBleedStreaks
                            src="/streak-designs/streak-master.jpg"
                            accentColor={accentColor}
                            opacity={0.075}
                            backgroundSize="125% auto"
                        />

                        <PicabilityMotif
                            name="cluster"
                            accentColor={accentColor}
                            opacity={0.18}
                            rotate="180deg"
                            className="
                                -left-24
                                top-[14rem]
                                w-[27rem]
                                h-[27rem]
                                sm:w-[38rem]
                                sm:h-[38rem]
                            "
                        />

                        <PicabilityMotif
                            name="micro"
                            accentColor={accentColor}
                            opacity={0.30}
                            className="
                                right-5
                                top-24
                                w-28
                                h-28
                            "
                        />
                    </>
                );

            case 'auth':
                return (
                    <>
                        <FullBleedStreaks
                            src="/streak-designs/streak-master.jpg"
                            accentColor={accentColor}
                            opacity={0.15}
                            backgroundSize="cover"
                            repeat={false}
                        />
                    </>
                );

            case 'selector':
                return (
                    <>
                        <FullBleedStreaks
                            src="/streak-designs/streak-ambient.jpg"
                            accentColor={accentColor}
                            opacity={0.12}
                            backgroundSize="115% auto"
                        />

                        <PicabilityMotif
                            name="micro"
                            accentColor={accentColor}
                            opacity={0.30}
                            className="
                                right-6
                                top-24
                                w-32
                                h-32
                            "
                        />

                        <PicabilityMotif
                            name="corner"
                            accentColor={accentColor}
                            opacity={0.20}
                            className="
                                -left-20
                                -bottom-20
                                w-80
                                h-80
                            "
                        />
                    </>
                );

            case 'config':
                return (
                    <>
                        <FullBleedStreaks
                            src="/streak-designs/streak-ambient.jpg"
                            accentColor={accentColor}
                            opacity={0.105}
                            backgroundSize="125% auto"
                            flip
                        />
                        <PicabilityMotif
                            name="cluster"
                            accentColor={accentColor}
                            opacity={0.16}
                            className="
                                -right-28
                                bottom-20
                                w-[30rem]
                                h-[30rem]
                            "
                        />
                    </>
                );

            case 'search':
                return (
                    <>
                        <FullBleedStreaks
                            src="/streak-designs/streak-ambient.jpg"
                            accentColor={accentColor}
                            opacity={0.10}
                            backgroundSize="120% auto"
                        />

                        <PicabilityMotif
                            name="corner"
                            accentColor={accentColor}
                            opacity={0.27}
                            rotate="90deg"
                            className="
                                -right-20
                                -top-20
                                w-[26rem]
                                h-[26rem]
                            "
                        />
                    </>
                );

            case 'confirmation':
                return (
                    <>
                        <FullBleedStreaks
                            src="/streak-designs/streak-master.jpg"
                            accentColor={accentColor}
                            opacity={0.105}
                            backgroundSize="cover"
                            repeat={false}
                        />

                        <PicabilityMotif
                            name="cluster"
                            accentColor={accentColor}
                            opacity={0.24}
                            className="
                                left-1/2
                                bottom-[-10rem]
                                -translate-x-1/2
                                w-[36rem]
                                h-[36rem]
                            "
                        />
                    </>
                );

            case 'onboarding':
                return (
                    <>
                        <FullBleedStreaks
                            src="/streak-designs/streak-master.jpg"
                            accentColor={accentColor}
                            opacity={0.13}
                            backgroundSize="cover"
                            repeat={false}
                        />
                    </>
                );
        }
    };

    return (
        <div
            className={`picability-page-shell relative min-h-screen overflow-hidden ${className}`}
            style={{
                backgroundColor: accentBackground
            }}
        >
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {renderArtwork()}

                {/*
                    Slight dark scrim prevents the streak artwork
                    from fighting with cards/text.
                */}
                {isDark && (
                    <div className="absolute inset-0 bg-slate-950/10" />
                )}
            </div>

            <div className="picability-page-surface relative z-10 min-h-screen">
                {children}
            </div>

            <style>
                {`
                    /*
                     * Pages currently own their own full-page
                     * slate backgrounds. The shell now owns the
                     * page background instead.
                     *
                     * Only clear the immediate page root.
                     * Cards and inner surfaces stay untouched.
                     */
                    .picability-page-surface > * {
                        background-color: transparent !important;
                        background-image: none !important;
                    }
                `}
            </style>
        </div>
    );
}