export interface StreakShareImageInput {
    habitName: string;

    streakCount: number;

    cycleLength: number;

    cycleUnit:
    | 'Day'
    | 'Week'
    | 'Month';

    requiredCheckIns: number;

    participantNames: string[];

    completed: boolean;
}

const WIDTH = 1080;
const HEIGHT = 1920;

interface ShareRank {
    emoji: string;
    title: string;
}

interface ShareHype {
    eyebrow: string;
    headline: string;
    caption: string;
}

const getRank = (
    count: number
): ShareRank => {
    if (count >= 1000)
        return {
            emoji: '🚀🌟',
            title: 'LEGENDARY'
        };

    if (count >= 500)
        return {
            emoji: '🌋',
            title: 'VOLCANIC'
        };

    if (count >= 400)
        return {
            emoji: '🐉',
            title: 'DRAGON'
        };

    if (count >= 300)
        return {
            emoji: '💎',
            title: 'DIAMOND'
        };

    if (count >= 200)
        return {
            emoji: '👑',
            title: 'ROYAL'
        };

    if (count >= 150)
        return {
            emoji: '🏆',
            title: 'CHAMPION'
        };

    if (count >= 100)
        return {
            emoji: '☄️',
            title: 'COMET'
        };

    if (count >= 80)
        return {
            emoji: '🌶️',
            title: 'RED HOT'
        };

    if (count >= 50)
        return {
            emoji: '💥',
            title: 'EXPLOSIVE'
        };

    if (count >= 30)
        return {
            emoji: '⚡',
            title: 'CHARGED'
        };

    if (count >= 20)
        return {
            emoji: '🔥',
            title: 'ON FIRE'
        };

    if (count >= 10)
        return {
            emoji: '✨',
            title: 'SPARK'
        };

    if (count >= 5)
        return {
            emoji: '💨',
            title: 'MOMENTUM'
        };

    if (count >= 3)
        return {
            emoji: '💧',
            title: 'DRIP'
        };

    if (count >= 1)
        return {
            emoji: '🧊',
            title: 'ICEBOUND'
        };

    return {
        emoji: '🔥',
        title: 'JUST GETTING STARTED'
    };
};

const getHype = (
    count: number,
    completed: boolean
): ShareHype => {
    if (count >= 1000) {
        return {
            eyebrow:
                completed
                    ? 'STREAK SECURED'
                    : 'STILL GOING',
            headline:
                'ABSOLUTE LEGENDS.',
            caption:
                'THIS STOPPED BEING NORMAL A LONG TIME AGO.'
        };
    }

    if (count >= 500) {
        return {
            eyebrow:
                completed
                    ? 'ANOTHER ONE LOCKED IN'
                    : 'THE RUN CONTINUES',
            headline:
                'BUILT DIFFERENT.',
            caption:
                'CONSISTENCY AT AN UNREASONABLE LEVEL.'
        };
    }

    if (count >= 100) {
        return {
            eyebrow:
                completed
                    ? 'STREAK SECURED'
                    : 'STILL STANDING',
            headline:
                'TRIPLE DIGITS.',
            caption:
                'CONSISTENCY IS THE FLEX.'
        };
    }

    if (count >= 50) {
        return {
            eyebrow:
                completed
                    ? 'ANOTHER ONE'
                    : 'STILL LOCKED IN',
            headline:
                'NO SIGNS OF STOPPING.',
            caption:
                'THE RESULTS ARE STARTING TO SPEAK FOR THEMSELVES.'
        };
    }

    if (count >= 30) {
        return {
            eyebrow:
                completed
                    ? 'MISSION COMPLETE'
                    : 'LOCKED IN',
            headline:
                'WE ARE DIALED IN.',
            caption:
                'DISCIPLINE LOOKS GOOD ON US.'
        };
    }

    if (count >= 20) {
        return {
            eyebrow:
                completed
                    ? 'STREAK SECURED'
                    : 'STILL MOVING',
            headline:
                'THIS IS GETTING SERIOUS.',
            caption:
                'MOMENTUM HAS ENTERED THE CHAT.'
        };
    }

    if (count >= 10) {
        return {
            eyebrow:
                completed
                    ? 'ANOTHER ONE LOCKED IN'
                    : 'THE RUN CONTINUES',
            headline:
                'DOUBLE DIGITS.',
            caption:
                'THIS IS A HABIT NOW.'
        };
    }

    if (count >= 5) {
        return {
            eyebrow:
                completed
                    ? 'STREAK SECURED'
                    : 'MOMENTUM BUILDING',
            headline:
                'WE KEEP SHOWING UP.',
            caption:
                'KEEP WATCHING.'
        };
    }

    if (count >= 3) {
        return {
            eyebrow:
                completed
                    ? 'ANOTHER DAY WON'
                    : 'STILL BUILDING',
            headline:
                'MOMENTUM.',
            caption:
                'THE STREAK IS STARTING TO TALK.'
        };
    }

    if (count >= 2) {
        return {
            eyebrow:
                completed
                    ? 'STREAK SECURED'
                    : 'ROUND TWO',
            headline:
                'WE CAME BACK.',
            caption:
                'THAT IS HOW STREAKS GET BUILT.'
        };
    }

    return {
        eyebrow:
            completed
                ? 'DAY ONE SECURED'
                : 'THE RUN STARTS HERE',
        headline:
            'WE ARE ON THE BOARD.',
        caption:
            'EVERY LEGENDARY STREAK STARTS AT 1.'
    };
};

const roundedRect = (
    context:
        CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) => {
    context.beginPath();

    context.roundRect(
        x,
        y,
        width,
        height,
        radius
    );
};

const wrapText = (
    context:
        CanvasRenderingContext2D,
    text: string,
    maxWidth: number
) => {
    const words =
        text
            .trim()
            .split(/\s+/);

    const lines: string[] =
        [];

    let line = '';

    words.forEach(word => {
        const test =
            line
                ? `${line} ${word}`
                : word;

        if (
            line &&
            context
                .measureText(test)
                .width >
            maxWidth
        ) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    });

    if (line) {
        lines.push(line);
    }

    return lines;
};

const fitFontSize = (
    context:
        CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    initialSize: number,
    minimumSize: number,
    weight = 800
) => {
    let size =
        initialSize;

    while (
        size > minimumSize
    ) {
        context.font =
            `${weight} ${size}px Arial, sans-serif`;

        if (
            context.measureText(text)
                .width <=
            maxWidth
        ) {
            break;
        }

        size -= 2;
    }

    return size;
};

const getCountUnit = (
    input:
        StreakShareImageInput
) => {
    if (
        input.cycleLength >
        1
    ) {
        return input.streakCount ===
            1
            ? 'CYCLE STRONG'
            : 'CYCLES STRONG';
    }

    const unit =
        input.cycleUnit
            .toUpperCase();

    return input.streakCount ===
        1
        ? `${unit} STRONG`
        : `${unit}S STRONG`;
};

const getScheduleText = (
    input:
        StreakShareImageInput
) => {
    const checkIns =
        Math.max(
            1,
            input.requiredCheckIns
        );

    const length =
        Math.max(
            1,
            input.cycleLength
        );

    const unit =
        input.cycleUnit
            .toLowerCase();

    return `${checkIns === 1
            ? '1 CHECK-IN'
            : `${checkIns} CHECK-INS`
        } EVERY ${length === 1
            ? unit.toUpperCase()
            : `${length} ${unit.toUpperCase()}S`
        }`;
};

const drawPosterBackground = (
    context:
        CanvasRenderingContext2D
) => {
    const gradient =
        context.createLinearGradient(
            0,
            0,
            WIDTH,
            HEIGHT
        );

    gradient.addColorStop(
        0,
        '#03182c'
    );

    gradient.addColorStop(
        0.55,
        '#061629'
    );

    gradient.addColorStop(
        1,
        '#020a13'
    );

    context.fillStyle =
        gradient;

    context.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    /*
     * Large Picability-style diagonal
     * streaks.
     */
    const strokes = [
        [-350, 380, 550, -80, 94],
        [-260, 650, 680, 165, 25],
        [-300, 805, 520, 385, 10],

        [630, 250, 1260, -85, 72],
        [720, 560, 1220, 300, 17],

        [-260, 1530, 600, 1090, 110],
        [-180, 1760, 535, 1390, 25],

        [590, 1960, 1300, 1590, 130],
        [690, 1680, 1210, 1410, 17]
    ];

    strokes.forEach(
        (
            [
                x1,
                y1,
                x2,
                y2,
                width
            ],
            index
        ) => {
            context.beginPath();

            context.moveTo(
                x1,
                y1
            );

            context.lineTo(
                x2,
                y2
            );

            context.lineWidth =
                width;

            context.lineCap =
                'square';

            context.strokeStyle =
                index % 3 === 0
                    ? '#01050a'
                    : '#102a45';

            context.globalAlpha =
                index % 2 === 0
                    ? 0.92
                    : 0.65;

            context.stroke();
        }
    );

    context.globalAlpha = 1;

    /*
     * Accent streaks.
     */
    context.strokeStyle =
        '#16d7cb';

    context.lineWidth = 7;

    context.globalAlpha =
        0.85;

    [
        [35, 430, 255, 315],
        [730, 270, 955, 150],
        [85, 1610, 330, 1485],
        [780, 1480, 1040, 1345]
    ].forEach(
        ([x1, y1, x2, y2]) => {
            context.beginPath();

            context.moveTo(
                x1,
                y1
            );

            context.lineTo(
                x2,
                y2
            );

            context.stroke();
        }
    );

    context.globalAlpha = 1;
};

const drawGlow = (
    context:
        CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number
) => {
    const glow =
        context.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            radius
        );

    glow.addColorStop(
        0,
        'rgba(22, 215, 203, 0.26)'
    );

    glow.addColorStop(
        1,
        'rgba(22, 215, 203, 0)'
    );

    context.fillStyle =
        glow;

    context.beginPath();

    context.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    context.fill();
};

export const generateStreakShareImage =
    async (
        input:
            StreakShareImageInput
    ) => {
        const canvas =
            document.createElement(
                'canvas'
            );

        canvas.width = WIDTH;
        canvas.height = HEIGHT;

        const context =
            canvas.getContext(
                '2d'
            );

        if (!context) {
            throw new Error(
                'Could not create share image.'
            );
        }

        const rank =
            getRank(
                input.streakCount
            );

        const hype =
            getHype(
                input.streakCount,
                input.completed
            );

        drawPosterBackground(
            context
        );

        /*
         * Soft center glow makes the main
         * statistic jump forward.
         */
        drawGlow(
            context,
            WIDTH / 2,
            900,
            500
        );

        context.textAlign =
            'center';

        /*
         * Small branding. Picability is
         * present, but the USER is the star.
         */
        context.fillStyle =
            '#16d7cb';

        context.font =
            '800 30px Arial, sans-serif';

        context.fillText(
            'PICABILITY',
            WIDTH / 2,
            105
        );

        /*
         * Top achievement chip.
         */
        const eyebrow =
            hype.eyebrow;

        context.font =
            '800 28px Arial, sans-serif';

        const eyebrowWidth =
            Math.min(
                710,
                context
                    .measureText(
                        eyebrow
                    )
                    .width +
                110
            );

        roundedRect(
            context,
            (
                WIDTH -
                eyebrowWidth
            ) / 2,
            165,
            eyebrowWidth,
            76,
            38
        );

        context.fillStyle =
            input.completed
                ? 'rgba(16, 185, 129, 0.17)'
                : 'rgba(22, 215, 203, 0.14)';

        context.fill();

        context.strokeStyle =
            input.completed
                ? 'rgba(52, 211, 153, 0.55)'
                : 'rgba(22, 215, 203, 0.45)';

        context.lineWidth = 2;

        context.stroke();

        context.fillStyle =
            input.completed
                ? '#34d399'
                : '#16d7cb';

        context.fillText(
            input.completed
                ? `✓ ${eyebrow}`
                : eyebrow,
            WIDTH / 2,
            214
        );

        /*
         * Hype headline.
         */
        context.fillStyle =
            '#ffffff';

        const headlineSize =
            fitFontSize(
                context,
                hype.headline,
                890,
                76,
                50
            );

        context.font =
            `900 ${headlineSize}px Arial, sans-serif`;

        context.fillText(
            hype.headline,
            WIDTH / 2,
            350
        );

        /*
         * Habit name.
         */
        context.fillStyle =
            '#a9b8ca';

        context.font =
            '800 34px Arial, sans-serif';

        const habitLines =
            wrapText(
                context,
                input.habitName
                    .toUpperCase(),
                800
            ).slice(
                0,
                2
            );

        let habitY = 425;

        habitLines.forEach(
            line => {
                context.fillText(
                    line,
                    WIDTH / 2,
                    habitY
                );

                habitY += 45;
            }
        );

        /*
         * Giant number.
         */
        const countY =
            habitY + 330;

        context.fillStyle =
            '#ffffff';

        context.font =
            '900 330px Arial, sans-serif';

        context.shadowColor =
            'rgba(22, 215, 203, 0.32)';

        context.shadowBlur = 55;

        context.fillText(
            String(
                input.streakCount
            ),
            WIDTH / 2,
            countY
        );

        context.shadowBlur = 0;

        context.fillStyle =
            '#cbd5e1';

        context.font =
            '800 43px Arial, sans-serif';

        context.fillText(
            getCountUnit(
                input
            ),
            WIDTH / 2,
            countY + 85
        );

        /*
         * Rank badge.
         */
        const rankY =
            countY + 155;

        roundedRect(
            context,
            270,
            rankY,
            540,
            100,
            50
        );

        context.fillStyle =
            'rgba(15, 37, 61, 0.95)';

        context.fill();

        context.strokeStyle =
            'rgba(22, 215, 203, 0.35)';

        context.lineWidth = 2;

        context.stroke();

        context.font =
            '52px Arial, sans-serif';

        context.fillStyle =
            '#ffffff';

        context.fillText(
            rank.emoji,
            350,
            rankY + 67
        );

        context.fillStyle =
            '#16d7cb';

        context.font =
            '900 31px Arial, sans-serif';

        context.textAlign =
            'left';

        context.fillText(
            rank.title,
            410,
            rankY + 61
        );

        context.textAlign =
            'center';

        /*
         * Hype caption.
         */
        const captionY =
            rankY + 210;

        context.fillStyle =
            '#ffffff';

        context.font =
            '900 50px Arial, sans-serif';

        const captionLines =
            wrapText(
                context,
                hype.caption,
                830
            ).slice(
                0,
                3
            );

        let captionLineY =
            captionY;

        captionLines.forEach(
            line => {
                context.fillText(
                    line,
                    WIDTH / 2,
                    captionLineY
                );

                captionLineY += 62;
            }
        );

        /*
         * Participant section.
         */
        const names =
            input.participantNames
                .filter(Boolean)
                .map(name =>
                    name.toUpperCase()
                );

        const participantText =
            names.length <= 3
                ? names.join(' × ')
                : `${names
                    .slice(0, 3)
                    .join(' × ')} +${names.length - 3
                }`;

        const partnersY =
            Math.max(
                captionLineY + 115,
                1390
            );

        context.fillStyle =
            '#64748b';

        context.font =
            '800 22px Arial, sans-serif';

        context.fillText(
            names.length > 1
                ? 'BUILT TOGETHER'
                : 'BUILT BY',
            WIDTH / 2,
            partnersY
        );

        context.fillStyle =
            '#ffffff';

        const participantFontSize =
            fitFontSize(
                context,
                participantText,
                820,
                44,
                27,
                800
            );

        context.font =
            `800 ${participantFontSize}px Arial, sans-serif`;

        context.fillText(
            participantText,
            WIDTH / 2,
            partnersY + 58
        );

        /*
         * Habit schedule.
         */
        const scheduleY =
            partnersY + 120;

        roundedRect(
            context,
            240,
            scheduleY,
            600,
            70,
            35
        );

        context.fillStyle =
            'rgba(15, 37, 61, 0.88)';

        context.fill();

        context.fillStyle =
            '#94a3b8';

        context.font =
            '700 24px Arial, sans-serif';

        context.fillText(
            getScheduleText(
                input
            ),
            WIDTH / 2,
            scheduleY + 45
        );

        /*
         * Bottom signature.
         */
        context.fillStyle =
            '#16d7cb';

        context.font =
            '900 28px Arial, sans-serif';

        context.fillText(
            'PICABILITY',
            WIDTH / 2,
            1775
        );

        context.fillStyle =
            '#64748b';

        context.font =
            '600 22px Arial, sans-serif';

        context.fillText(
            'BUILD HABITS TOGETHER.',
            WIDTH / 2,
            1815
        );

        /*
         * Export.
         */
        return await new Promise<Blob>(
            (
                resolve,
                reject
            ) => {
                canvas.toBlob(
                    blob => {
                        if (!blob) {
                            reject(
                                new Error(
                                    'Could not render share image.'
                                )
                            );

                            return;
                        }

                        resolve(
                            blob
                        );
                    },
                    'image/png',
                    1
                );
            }
        );
    };