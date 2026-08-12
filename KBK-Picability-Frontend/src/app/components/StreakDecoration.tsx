interface StreakDecorationProps {
    src: string;
    accentColor?: string;
    opacity?: number;
    className?: string;
    imageClassName?: string;
    repeat?: boolean;
}

export function StreakDecoration({
    src,
    accentColor = '#0ea5e9',
    opacity = 1,
    className = '',
    imageClassName = '',
    repeat = false
}: StreakDecorationProps) {
    return (
        <div
            aria-hidden="true"
            className={`pointer-events-none absolute overflow-hidden ${className}`}
            style={{
                opacity,
                isolation: 'isolate'
            }}
        >
            {repeat ? (
                <>
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `url(${src})`,
                            backgroundRepeat: 'repeat-y',
                            backgroundSize: '100% auto',
                            backgroundPosition: 'top center'
                        }}
                    />

                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundColor: accentColor,
                            mixBlendMode: 'color'
                        }}
                    />
                </>
            ) : (
                <>
                    <img
                        src={src}
                        alt=""
                        draggable={false}
                        className={`absolute inset-0 w-full h-full select-none ${imageClassName || 'object-cover'
                            }`}
                    />

                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundColor: accentColor,
                            mixBlendMode: 'color'
                        }}
                    />
                </>
            )}
        </div>
    );
}