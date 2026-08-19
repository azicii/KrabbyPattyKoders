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

const wrapText = (
    context: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
) => {
    const words =
        text.trim().split(/\s+/);

    const lines: string[] = [];

    let currentLine = '';

    words.forEach(word => {
        const testLine =
            currentLine
                ? `${currentLine} ${word}`
                : word;

        if (
            context.measureText(testLine)
                .width > maxWidth &&
            currentLine
        ) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine =
                testLine;
        }
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
};

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

const getRewardEmoji = (
    count: number
) => {
    if (count >= 1000) return '🚀🌟';
    if (count >= 500) return '🌋';
    if (count >= 400) return '🐉';
    if (count >= 300) return '💎';
    if (count >= 200) return '👑';
    if (count >= 150) return '🏆';
    if (count >= 100) return '☄️';
    if (count >= 80) return '🌶️';
    if (count >= 50) return '💥';
    if (count >= 30) return '⚡';
    if (count >= 20) return '🔥';
    if (count >= 10) return '✨';
    if (count >= 5) return '💨';
    if (count >= 3) return '💧';
    if (count >= 1) return '🧊';

    return '🔥';
};

const getCountUnit = (
    input: StreakShareImageInput
) => {
    if (input.cycleLength > 1) {
        return input.streakCount === 1
            ? 'CYCLE'
            : 'CYCLES';
    }

    const unit =
        input.cycleUnit.toUpperCase();

    if (input.streakCount === 1) {
        return unit;
    }

    return `${unit}S`;
};

const getScheduleText = (
    input: StreakShareImageInput
) => {
    const length =
        Math.max(
            1,
            input.cycleLength
        );

    const checkIns =
        Math.max(
            1,
            input.requiredCheckIns
        );

    const unit =
        input.cycleUnit.toLowerCase();

    const cycleDescription =
        length === 1
            ? unit
            : `${length} ${unit}s`;

    return `${checkIns} ${checkIns === 1
            ? 'check-in'
            : 'check-ins'
        } every ${cycleDescription}`;
};

const drawStreakBackground = (
    context: CanvasRenderingContext2D
) => {
    context.fillStyle =
        '#06182b';

    context.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    /*
     * Picability diagonal streak language.
     */
    context.lineCap = 'square';

    const streaks = [
        [-350, 300, 500, -130, 58],
        [-200, 580, 700, 120, 20],
        [-150, 900, 520, 560, 11],
        [600, 200, 1280, -150, 35],
        [680, 730, 1220, 440, 65],
        [470, 1600, 1270, 1170, 85],
        [-250, 1780, 480, 1400, 34],
        [-180, 1470, 270, 1230, 10]
    ];

    streaks.forEach(
        (
            [
                startX,
                startY,
                endX,
                endY,
                width
            ],
            index
        ) => {
            context.beginPath();

            context.moveTo(
                startX,
                startY
            );

            context.lineTo(
                endX,
                endY
            );

            context.lineWidth =
                width;

            context.strokeStyle =
                index % 3 === 0
                    ? '#020811'
                    : '#0b2741';

            context.globalAlpha =
                index % 2 === 0
                    ? 0.95
                    : 0.75;

            context.stroke();
        }
    );

    context.globalAlpha = 1;

    /*
     * Small teal accent streaks.
     */
    context.strokeStyle =
        '#15c7bd';

    context.globalAlpha = 0.55;

    context.lineWidth = 8;

    [
        [60, 420, 310, 290],
        [760, 1200, 1030, 1055],
        [90, 1520, 320, 1395]
    ].forEach(
        ([
            startX,
            startY,
            endX,
            endY
        ]) => {
            context.beginPath();

            context.moveTo(
                startX,
                startY
            );

            context.lineTo(
                endX,
                endY
            );

            context.stroke();
        }
    );

    context.globalAlpha = 1;
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

        drawStreakBackground(
            context
        );

        /*
         * Main glass-style card.
         */
        context.fillStyle =
            'rgba(10, 29, 52, 0.92)';

        roundedRect(
            context,
            80,
            245,
            920,
            1390,
            70
        );

        context.fill();

        context.strokeStyle =
            'rgba(148, 163, 184, 0.22)';

        context.lineWidth = 3;

        context.stroke();

        /*
         * Picability branding.
         */
        context.textAlign = 'center';

        context.fillStyle =
            '#ffffff';

        context.font =
            '700 48px Arial, sans-serif';

        context.fillText(
            'PICABILITY',
            WIDTH / 2,
            145
        );

        context.fillStyle =
            '#15c7bd';

        context.font =
            '600 25px Arial, sans-serif';

        context.fillText(
            'BUILD HABITS TOGETHER',
            WIDTH / 2,
            190
        );

        /*
         * Completion / progress chip.
         */
        const statusText =
            input.completed
                ? 'STREAK COMPLETE'
                : 'STREAK IN PROGRESS';

        context.font =
            '700 27px Arial, sans-serif';

        const statusWidth =
            context.measureText(
                statusText
            ).width + 90;

        context.fillStyle =
            input.completed
                ? 'rgba(16, 185, 129, 0.18)'
                : 'rgba(59, 130, 246, 0.18)';

        roundedRect(
            context,
            (WIDTH - statusWidth) / 2,
            330,
            statusWidth,
            72,
            36
        );

        context.fill();

        context.fillStyle =
            input.completed
                ? '#34d399'
                : '#60a5fa';

        context.fillText(
            input.completed
                ? `✓ ${statusText}`
                : `● ${statusText}`,
            WIDTH / 2,
            377
        );

        /*
         * Habit name.
         */
        context.fillStyle =
            '#ffffff';

        context.font =
            '700 72px Arial, sans-serif';

        const habitLines =
            wrapText(
                context,
                input.habitName,
                780
            ).slice(
                0,
                3
            );

        let habitY = 535;

        habitLines.forEach(
            line => {
                context.fillText(
                    line,
                    WIDTH / 2,
                    habitY
                );

                habitY += 82;
            }
        );

        /*
         * Streak reward.
         */
        const reward =
            getRewardEmoji(
                input.streakCount
            );

        context.font =
            '82px Arial, sans-serif';

        context.fillText(
            reward,
            WIDTH / 2,
            habitY + 55
        );

        /*
         * Giant streak count.
         */
        const countY =
            habitY + 235;

        context.fillStyle =
            '#ffffff';

        context.font =
            '800 260px Arial, sans-serif';

        context.fillText(
            String(
                input.streakCount
            ),
            WIDTH / 2,
            countY
        );

        context.fillStyle =
            '#94a3b8';

        context.font =
            '700 42px Arial, sans-serif';

        context.fillText(
            getCountUnit(
                input
            ),
            WIDTH / 2,
            countY + 75
        );

        /*
         * Participants.
         */
        const visibleNames =
            input.participantNames
                .filter(Boolean);

        const participantText =
            visibleNames.length <= 4
                ? visibleNames.join(
                    ' + '
                )
                : `${visibleNames
                    .slice(0, 4)
                    .join(' + ')
                } + ${visibleNames.length -
                4
                } more`;

        context.fillStyle =
            '#cbd5e1';

        context.font =
            '600 40px Arial, sans-serif';

        const participantLines =
            wrapText(
                context,
                participantText,
                760
            ).slice(
                0,
                3
            );

        let participantY =
            countY + 205;

        participantLines.forEach(
            line => {
                context.fillText(
                    line,
                    WIDTH / 2,
                    participantY
                );

                participantY += 54;
            }
        );

        /*
         * Schedule.
         */
        context.fillStyle =
            'rgba(30, 41, 59, 0.9)';

        roundedRect(
            context,
            220,
            participantY + 25,
            640,
            86,
            43
        );

        context.fill();

        context.fillStyle =
            '#cbd5e1';

        context.font =
            '600 30px Arial, sans-serif';

        context.fillText(
            getScheduleText(
                input
            ),
            WIDTH / 2,
            participantY + 79
        );

        /*
         * Footer.
         */
        context.fillStyle =
            '#15c7bd';

        context.font =
            '700 32px Arial, sans-serif';

        context.fillText(
            'Built together on Picability',
            WIDTH / 2,
            1710
        );

        context.fillStyle =
            '#64748b';

        context.font =
            '500 25px Arial, sans-serif';

        context.fillText(
            'picability.vercel.app',
            WIDTH / 2,
            1760
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

                        resolve(blob);
                    },
                    'image/png',
                    1
                );
            }
        );
    };