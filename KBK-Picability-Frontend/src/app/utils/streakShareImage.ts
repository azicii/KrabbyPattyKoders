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

    /*
     * Existing Picability streak color.
     *
     * Example:
     * "from-pink-500 to-rose-600"
     */
    streakColor?: string;
}

const WIDTH = 1080;
const HEIGHT = 1920;

const WEBSITE_URL =
    'picability.vercel.app';

const roundedRect = (
    context: CanvasRenderingContext2D,
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
    context: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
) => {
    const words =
        text
            .trim()
            .split(/\s+/);

    const lines: string[] =
        [];

    let currentLine = '';

    words.forEach(word => {
        const testLine =
            currentLine
                ? `${currentLine} ${word}`
                : word;

        if (
            currentLine &&
            context
                .measureText(testLine)
                .width >
            maxWidth
        ) {
            lines.push(
                currentLine
            );

            currentLine =
                word;
        } else {
            currentLine =
                testLine;
        }
    });

    if (currentLine) {
        lines.push(
            currentLine
        );
    }

    return lines;
};

const fitFontSize = (
    context: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    initialSize: number,
    minimumSize: number,
    weight = 800
) => {
    let size =
        initialSize;

    while (
        size >
        minimumSize
    ) {
        context.font =
            `${weight} ${size}px Arial, sans-serif`;

        if (
            context
                .measureText(text)
                .width <=
            maxWidth
        ) {
            return size;
        }

        size -= 2;
    }

    return minimumSize;
};

/*
 * Convert the existing Tailwind streak color into a
 * representative poster accent.
 *
 * No backend work is required. The streak already carries
 * this color information to the frontend.
 */
const getAccentColor = (
    streakColor?: string
) => {
    const color =
        streakColor
            ?.toLowerCase() ??
        '';

    if (
        color.includes('pink') ||
        color.includes('rose')
    ) {
        return '#ec4899';
    }

    if (
        color.includes('red')
    ) {
        return '#ef4444';
    }

    if (
        color.includes('orange')
    ) {
        return '#f97316';
    }

    if (
        color.includes('amber') ||
        color.includes('yellow')
    ) {
        return '#f59e0b';
    }

    if (
        color.includes('lime')
    ) {
        return '#84cc16';
    }

    if (
        color.includes('green') ||
        color.includes('emerald')
    ) {
        return '#10b981';
    }

    if (
        color.includes('cyan')
    ) {
        return '#06b6d4';
    }

    if (
        color.includes('sky')
    ) {
        return '#0ea5e9';
    }

    if (
        color.includes('blue')
    ) {
        return '#3b82f6';
    }

    if (
        color.includes('indigo')
    ) {
        return '#6366f1';
    }

    if (
        color.includes('violet')
    ) {
        return '#8b5cf6';
    }

    if (
        color.includes('purple')
    ) {
        return '#a855f7';
    }

    if (
        color.includes('fuchsia')
    ) {
        return '#d946ef';
    }

    /*
     * Picability teal fallback.
     */
    return '#14b8a6';
};

const hexToRgba = (
    hex: string,
    alpha: number
) => {
    const normalized =
        hex.replace(
            '#',
            ''
        );

    const red =
        parseInt(
            normalized.slice(
                0,
                2
            ),
            16
        );

    const green =
        parseInt(
            normalized.slice(
                2,
                4
            ),
            16
        );

    const blue =
        parseInt(
            normalized.slice(
                4,
                6
            ),
            16
        );

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

/*
 * One phrase per Picability rank tier.
 *
 * We intentionally do NOT show the rank title itself
 * on the share poster anymore.
 */
const getRankPhrase = (
    streakCount: number
) => {
    if (streakCount >= 1000)
        return 'LEGEND STATUS. NO NOTES.';

    if (streakCount >= 500)
        return 'THIS IS WHAT RELENTLESS LOOKS LIKE.';

    if (streakCount >= 400)
        return 'BUILT TO LAST. STILL GOING.';

    if (streakCount >= 300)
        return 'CONSISTENCY BECAME SECOND NATURE.';

    if (streakCount >= 200)
        return 'WE MADE DISCIPLINE LOOK EASY.';

    if (streakCount >= 150)
        return 'THE WORK SPEAKS FOR ITSELF.';

    if (streakCount >= 100)
        return 'TRIPLE DIGITS. WE REALLY DID THAT.';

    if (streakCount >= 80)
        return 'AT THIS POINT, WE ARE LOCKED IN.';

    if (streakCount >= 50)
        return 'FIFTY STRONG AND STILL MOVING.';

    if (streakCount >= 30)
        return 'A MONTH OF SHOWING UP HITS DIFFERENT.';

    if (streakCount >= 20)
        return 'MOMENTUM IS DOING ITS THING.';

    if (streakCount >= 10)
        return 'DOUBLE DIGITS. NOW WE ARE TALKING.';

    if (streakCount >= 5)
        return 'WE ARE STARTING TO COOK.';

    if (streakCount >= 3)
        return 'THE MOMENTUM IS REAL.';

    if (streakCount === 2)
        return 'WE CAME BACK AND CONQUERED.';

    return 'EVERY GREAT STREAK STARTS SOMEWHERE.';
};

const getCycleUnitLabel = (
    input: StreakShareImageInput
) => {
    /*
     * For the ordinary Picability schedules this gives
     * DAY / DAYS, WEEK / WEEKS, MONTH / MONTHS.
     */
    if (
        input.cycleLength === 1
    ) {
        if (
            input.streakCount === 1
        ) {
            return input.cycleUnit
                .toUpperCase();
        }

        return `${input.cycleUnit.toUpperCase()}S`;
    }

    /*
     * Multi-unit cycles are themselves the streak unit.
     */
    return input.streakCount === 1
        ? 'CYCLE'
        : 'CYCLES';
};

const getScheduleText = (
    input: StreakShareImageInput
) => {
    const checkIns =
        Math.max(
            1,
            input.requiredCheckIns
        );

    const cycleLength =
        Math.max(
            1,
            input.cycleLength
        );

    const unit =
        input.cycleUnit
            .toUpperCase();

    const cycleLabel =
        cycleLength === 1
            ? unit
            : `${cycleLength} ${unit}${cycleLength === 1
                ? ''
                : 'S'
            }`;

    return `${checkIns === 1
            ? '1 CHECK-IN'
            : `${checkIns} CHECK-INS`
        } EVERY ${cycleLabel}`;
};

const getParticipantHeadline = (
    participantNames: string[]
) => {
    const names =
        participantNames
            .filter(Boolean)
            .map(name =>
                name.toUpperCase()
            );

    if (
        names.length === 0
    ) {
        return 'PICABILITY USER';
    }

    if (
        names.length === 1
    ) {
        return names[0];
    }

    if (
        names.length === 2
    ) {
        return `${names[0]} & ${names[1]}`;
    }

    return `${names
            .slice(
                0,
                2
            )
            .join(' & ')
        } + ${names.length - 2} MORE`;
};

const getParticipantSignature = (
    participantNames: string[]
) => {
    const names =
        participantNames
            .filter(Boolean)
            .map(name =>
                name.toUpperCase()
            );

    if (
        names.length <= 3
    ) {
        return names.join(
            ' × '
        );
    }

    return `${names
            .slice(
                0,
                3
            )
            .join(' × ')
        } +${names.length - 3}`;
};

const drawBackground = (
    context: CanvasRenderingContext2D,
    accentColor: string
) => {
    const backgroundGradient =
        context.createLinearGradient(
            0,
            0,
            WIDTH,
            HEIGHT
        );

    backgroundGradient.addColorStop(
        0,
        '#07182b'
    );

    backgroundGradient.addColorStop(
        0.55,
        '#061425'
    );

    backgroundGradient.addColorStop(
        1,
        '#020811'
    );

    context.fillStyle =
        backgroundGradient;

    context.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    /*
     * Subtle black/navy Picability streaks.
     * These deliberately stay dark regardless of
     * the streak's selected accent color.
     */
    const darkStreaks = [
        [-240, 350, 520, -40, 72],
        [-180, 600, 600, 195, 28],
        [-250, 930, 410, 590, 13],

        [665, 255, 1260, -55, 65],
        [705, 650, 1245, 365, 22],

        [-250, 1515, 585, 1080, 80],
        [-180, 1790, 550, 1410, 22],

        [630, 1960, 1280, 1620, 95],
        [745, 1660, 1230, 1410, 17]
    ];

    darkStreaks.forEach(
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

            context.lineCap =
                'square';

            context.lineWidth =
                width;

            context.strokeStyle =
                index % 3 === 0
                    ? '#01050b'
                    : '#102640';

            context.globalAlpha =
                index % 2 === 0
                    ? 0.92
                    : 0.58;

            context.stroke();
        }
    );

    context.globalAlpha = 1;

    /*
     * A few thin streak-color accents.
     */
    context.strokeStyle =
        accentColor;

    context.lineWidth = 7;

    context.globalAlpha =
        0.88;

    [
        [35, 300, 235, 195],
        [820, 280, 1035, 168],
        [70, 1605, 280, 1495],
        [805, 1570, 1045, 1445]
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

const drawNumberAura = (
    context: CanvasRenderingContext2D,
    accentColor: string
) => {
    const glow =
        context.createRadialGradient(
            WIDTH / 2,
            800,
            0,
            WIDTH / 2,
            800,
            410
        );

    glow.addColorStop(
        0,
        hexToRgba(
            accentColor,
            0.34
        )
    );

    glow.addColorStop(
        0.42,
        hexToRgba(
            accentColor,
            0.17
        )
    );

    glow.addColorStop(
        1,
        hexToRgba(
            accentColor,
            0
        )
    );

    context.fillStyle =
        glow;

    context.beginPath();

    context.arc(
        WIDTH / 2,
        800,
        410,
        0,
        Math.PI * 2
    );

    context.fill();
};

export const generateStreakShareImage =
    async (
        input: StreakShareImageInput
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

        const accentColor =
            getAccentColor(
                input.streakColor
            );

        const rankPhrase =
            getRankPhrase(
                input.streakCount
            );

        const participantHeadline =
            getParticipantHeadline(
                input.participantNames
            );

        const participantSignature =
            getParticipantSignature(
                input.participantNames
            );

        drawBackground(
            context,
            accentColor
        );

        drawNumberAura(
            context,
            accentColor
        );

        context.textAlign =
            'center';

        /*
         * PICABILITY
         */
        context.fillStyle =
            accentColor;

        context.font =
            '800 31px Arial, sans-serif';

        context.fillText(
            'PICABILITY',
            WIDTH / 2,
            100
        );

        /*
         * Small cycle badge.
         */
        const cycleBadge =
            input.streakCount === 1
                ? 'DAY ONE'
                : input.streakCount === 2
                    ? 'ROUND TWO'
                    : 'STREAK PROGRESS';

        context.font =
            '800 27px Arial, sans-serif';

        const badgeWidth =
            Math.max(
                250,
                context
                    .measureText(
                        cycleBadge
                    )
                    .width +
                100
            );

        roundedRect(
            context,
            (
                WIDTH -
                badgeWidth
            ) / 2,
            145,
            badgeWidth,
            68,
            34
        );

        context.fillStyle =
            hexToRgba(
                accentColor,
                0.08
            );

        context.fill();

        context.strokeStyle =
            hexToRgba(
                accentColor,
                0.75
            );

        context.lineWidth = 2;

        context.stroke();

        context.fillStyle =
            accentColor;

        context.fillText(
            cycleBadge,
            WIDTH / 2,
            189
        );

        /*
         * Who did it.
         */
        context.fillStyle =
            '#ffffff';

        const headlineSize =
            fitFontSize(
                context,
                participantHeadline,
                900,
                55,
                31,
                800
            );

        context.font =
            `800 ${headlineSize}px Arial, sans-serif`;

        context.fillText(
            participantHeadline,
            WIDTH / 2,
            305
        );

        context.fillStyle =
            accentColor;

        context.font =
            '800 26px Arial, sans-serif';

        context.fillText(
            input.completed
                ? 'FINISHED'
                : 'IS WORKING ON',
            WIDTH / 2,
            360
        );

        /*
         * Massive streak count.
         */
        const numberText =
            String(
                input.streakCount
            );

        context.fillStyle =
            '#ffffff';

        context.font =
            '900 350px Arial, sans-serif';

        context.shadowColor =
            hexToRgba(
                accentColor,
                0.95
            );

        context.shadowBlur = 55;

        context.fillText(
            numberText,
            WIDTH / 2,
            720
        );

        context.shadowBlur = 0;

        /*
         * DAY / DAYS / WEEK / etc.
         */
        context.fillStyle =
            '#f8fafc';

        context.font =
            '900 96px Arial, sans-serif';

        context.fillText(
            getCycleUnitLabel(
                input
            ),
            WIDTH / 2,
            835
        );

        /*
         * Tie the streak name directly to the number.
         */
        context.fillStyle =
            accentColor;

        context.font =
            '800 38px Arial, sans-serif';

        context.fillText(
            'OF OUR',
            WIDTH / 2,
            900
        );

        const habitName =
            input.habitName
                .toUpperCase();

        context.fillStyle =
            '#ffffff';

        const habitFontSize =
            fitFontSize(
                context,
                habitName,
                900,
                68,
                40,
                900
            );

        context.font =
            `900 ${habitFontSize}px Arial, sans-serif`;

        const habitLines =
            wrapText(
                context,
                habitName,
                900
            ).slice(
                0,
                2
            );

        let habitY =
            975;

        habitLines.forEach(
            line => {
                context.fillText(
                    line,
                    WIDTH / 2,
                    habitY
                );

                habitY +=
                    habitFontSize +
                    10;
            }
        );

        context.fillStyle =
            accentColor;

        context.font =
            '800 36px Arial, sans-serif';

        context.fillText(
            'STREAK',
            WIDTH / 2,
            habitY + 12
        );

        /*
         * Schedule capsule.
         */
        const scheduleY =
            habitY + 95;

        roundedRect(
            context,
            185,
            scheduleY,
            710,
            86,
            43
        );

        context.fillStyle =
            'rgba(15, 37, 61, 0.88)';

        context.fill();

        context.strokeStyle =
            hexToRgba(
                accentColor,
                0.28
            );

        context.lineWidth = 2;

        context.stroke();

        context.fillStyle =
            '#cbd5e1';

        context.font =
            '700 30px Arial, sans-serif';

        context.fillText(
            getScheduleText(
                input
            ),
            WIDTH / 2,
            scheduleY + 55
        );

        /*
         * Exactly one dynamic hype phrase.
         */
        const phraseY =
            scheduleY + 145;

        context.fillStyle =
            accentColor;

        context.font =
            '900 40px Arial, sans-serif';

        const phraseLines =
            wrapText(
                context,
                rankPhrase,
                800
            ).slice(
                0,
                2
            );

        let currentPhraseY =
            phraseY;

        phraseLines.forEach(
            line => {
                context.fillText(
                    line,
                    WIDTH / 2,
                    currentPhraseY
                );

                currentPhraseY +=
                    52;
            }
        );

        /*
         * Participants.
         */
        const builtTogetherY =
            Math.max(
                currentPhraseY +
                75,
                1365
            );

        context.fillStyle =
            '#64748b';

        context.font =
            '800 29px Arial, sans-serif';

        context.fillText(
            input.participantNames.length >
                1
                ? 'BUILT TOGETHER'
                : 'BUILT BY',
            WIDTH / 2,
            builtTogetherY
        );

        context.fillStyle =
            '#ffffff';

        const participantFontSize =
            fitFontSize(
                context,
                participantSignature,
                900,
                48,
                30,
                800
            );

        context.font =
            `800 ${participantFontSize}px Arial, sans-serif`;

        context.fillText(
            participantSignature,
            WIDTH / 2,
            builtTogetherY + 66
        );

        /*
         * Footer branding.
         */
        context.fillStyle =
            accentColor;

        context.font =
            '900 29px Arial, sans-serif';

        context.fillText(
            'PICABILITY',
            WIDTH / 2,
            1605
        );

        context.fillStyle =
            '#64748b';

        context.font =
            '700 26px Arial, sans-serif'

        context.fillText(
            'BUILD HABITS TOGETHER.',
            WIDTH / 2,
            1650
        );

        /*
         * Website capsule.
         *
         * This is visible in the PNG. The PNG itself
         * cannot contain a functional hyperlink.
         */
        roundedRect(
            context,
            275,
            1700,
            530,
            82,
            41
        );

        context.fillStyle =
            'rgba(5, 15, 27, 0.8)';

        context.fill();

        context.strokeStyle =
            hexToRgba(
                accentColor,
                0.65
            );

        context.lineWidth = 2;

        context.stroke();

        context.fillStyle =
            accentColor;

        context.font =
            '700 30px Arial, sans-serif';

        context.fillText(
            WEBSITE_URL,
            WIDTH / 2,
            1753
        );

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