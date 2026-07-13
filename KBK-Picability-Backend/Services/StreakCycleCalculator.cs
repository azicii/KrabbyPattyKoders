namespace Picability.Services
{
    public class StreakCycleWindow
    {
        public DateTime StartUtc { get; init; }
        public DateTime EndUtc { get; init; }

        public DateTime StartLocal { get; init; }
        public DateTime EndLocal { get; init; }
    }

    public static class StreakCycleCalculator
    {
        public static StreakCycleWindow GetCurrentCycle(
            DateTime streakStartedAtUtc,
            DateTime nowUtc,
            int cycleLength,
            string cycleUnit,
            TimeZoneInfo timeZone)
        {
            var normalizedLength = Math.Max(1, cycleLength);

            var normalizedUnit = cycleUnit?.Trim().ToLowerInvariant() switch
            {
                "week" => "Week",
                "month" => "Month",
                _ => "Day"
            };

            var startedLocal = TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.SpecifyKind(streakStartedAtUtc, DateTimeKind.Utc),
                timeZone
            );

            var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.SpecifyKind(nowUtc, DateTimeKind.Utc),
                timeZone
            );

            DateTime cycleStartLocal;
            DateTime cycleEndLocal;

            switch (normalizedUnit)
            {
                case "Week":
                    {
                        var anchorMonday = StartOfWeek(startedLocal.Date);

                        var currentMonday = StartOfWeek(nowLocal.Date);

                        var elapsedWeeks =
                            (int)((currentMonday - anchorMonday).TotalDays / 7);

                        var cycleIndex = Math.Max(
                            0,
                            elapsedWeeks / normalizedLength
                        );

                        cycleStartLocal = anchorMonday.AddDays(
                            cycleIndex * normalizedLength * 7
                        );

                        cycleEndLocal = cycleStartLocal.AddDays(
                            normalizedLength * 7
                        );

                        break;
                    }

                case "Month":
                    {
                        var anchorMonth = new DateTime(
                            startedLocal.Year,
                            startedLocal.Month,
                            1
                        );

                        var currentMonth = new DateTime(
                            nowLocal.Year,
                            nowLocal.Month,
                            1
                        );

                        var elapsedMonths =
                            ((currentMonth.Year - anchorMonth.Year) * 12) +
                            currentMonth.Month -
                            anchorMonth.Month;

                        var cycleIndex = Math.Max(
                            0,
                            elapsedMonths / normalizedLength
                        );

                        cycleStartLocal = anchorMonth.AddMonths(
                            cycleIndex * normalizedLength
                        );

                        cycleEndLocal = cycleStartLocal.AddMonths(
                            normalizedLength
                        );

                        break;
                    }

                default:
                    {
                        var anchorDate = startedLocal.Date;

                        var elapsedDays =
                            Math.Max(
                                0,
                                (int)(nowLocal.Date - anchorDate).TotalDays
                            );

                        var cycleIndex =
                            elapsedDays / normalizedLength;

                        cycleStartLocal = anchorDate.AddDays(
                            cycleIndex * normalizedLength
                        );

                        cycleEndLocal = cycleStartLocal.AddDays(
                            normalizedLength
                        );

                        break;
                    }
            }

            var cycleStartUtc = TimeZoneInfo.ConvertTimeToUtc(
                DateTime.SpecifyKind(
                    cycleStartLocal,
                    DateTimeKind.Unspecified
                ),
                timeZone
            );

            var cycleEndUtc = TimeZoneInfo.ConvertTimeToUtc(
                DateTime.SpecifyKind(
                    cycleEndLocal,
                    DateTimeKind.Unspecified
                ),
                timeZone
            );

            return new StreakCycleWindow
            {
                StartUtc = cycleStartUtc,
                EndUtc = cycleEndUtc,
                StartLocal = cycleStartLocal,
                EndLocal = cycleEndLocal
            };
        }

        public static StreakCycleWindow GetPreviousCycle(
            DateTime streakStartedAtUtc,
            DateTime currentCycleStartUtc,
            int cycleLength,
            string cycleUnit,
            TimeZoneInfo timeZone)
        {
            /*
             * Moving one tick before the current cycle boundary places
             * the timestamp inside the immediately preceding cycle.
             */
            var previousCycleMomentUtc =
                currentCycleStartUtc.AddTicks(-1);

            return GetCurrentCycle(
                streakStartedAtUtc,
                previousCycleMomentUtc,
                cycleLength,
                cycleUnit,
                timeZone
            );
        }

        private static DateTime StartOfWeek(DateTime date)
        {
            var daysSinceMonday =
                ((int)date.DayOfWeek -
                 (int)DayOfWeek.Monday +
                 7) % 7;

            return date.AddDays(-daysSinceMonday).Date;
        }
    }
}