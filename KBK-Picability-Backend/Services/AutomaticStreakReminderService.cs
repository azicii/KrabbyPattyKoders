using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.Models;

namespace Picability.Services
{
    public class AutomaticStreakReminderService
    {
        private readonly ApplicationDbContext _context;
        private readonly PushNotificationService
            _pushNotificationService;

        public AutomaticStreakReminderService(
            ApplicationDbContext context,
            PushNotificationService pushNotificationService)
        {
            _context = context;
            _pushNotificationService =
                pushNotificationService;
        }

        private sealed record ReminderCycleState(
            Streak Streak,
            int RequiredCheckIns,
            StreakCycleWindow CurrentCycle,
            StreakCycleWindow? PreviousCycle
        );

        private sealed record ReminderTrigger(
            int StreakId,
            DateTime CycleStartUtc
        );

        private static TimeZoneInfo
            GetPacificTimeZone()
        {
            try
            {
                return TimeZoneInfo
                    .FindSystemTimeZoneById(
                        "Pacific Standard Time"
                    );
            }
            catch
            {
                return TimeZoneInfo
                    .FindSystemTimeZoneById(
                        "America/Los_Angeles"
                    );
            }
        }

        private static List<string>
            GetMemberIds(
                Streak streak)
        {
            var memberIds =
                streak.Members
                    .Select(member =>
                        member.UserId
                    )
                    .Where(userId =>
                        !string.IsNullOrWhiteSpace(
                            userId
                        )
                    )
                    .Distinct()
                    .ToList();

            if (memberIds.Count == 0)
            {
                if (
                    !string.IsNullOrWhiteSpace(
                        streak.UserOneId
                    )
                )
                {
                    memberIds.Add(
                        streak.UserOneId
                    );
                }

                if (
                    !string.IsNullOrWhiteSpace(
                        streak.UserTwoId
                    ) &&
                    streak.UserTwoId !=
                        streak.UserOneId
                )
                {
                    memberIds.Add(
                        streak.UserTwoId
                    );
                }
            }

            return memberIds;
        }

        private static int
            GetMemberCheckInCount(
                Streak streak,
                string userId,
                int requiredCheckIns,
                StreakCycleWindow cycle,
                IReadOnlyCollection<StreakCheckIn>
                    checkIns)
        {
            if (
                StreakyIdentity.IsStreaky(
                    userId
                )
            )
            {
                return requiredCheckIns;
            }

            var count =
                checkIns.Count(checkIn =>
                    checkIn.StreakId ==
                        streak.Id &&
                    checkIn.UserId ==
                        userId &&
                    checkIn.CheckedInAt >=
                        cycle.StartUtc &&
                    checkIn.CheckedInAt <
                        cycle.EndUtc
                );

            if (
                count == 0 &&
                userId == streak.UserOneId &&
                streak.UserOneLastCheckedInAt
                    .HasValue &&
                streak.UserOneLastCheckedInAt
                    .Value >=
                    cycle.StartUtc &&
                streak.UserOneLastCheckedInAt
                    .Value <
                    cycle.EndUtc
            )
            {
                count = 1;
            }

            if (
                count == 0 &&
                userId == streak.UserTwoId &&
                streak.UserTwoLastCheckedInAt
                    .HasValue &&
                streak.UserTwoLastCheckedInAt
                    .Value >=
                    cycle.StartUtc &&
                streak.UserTwoLastCheckedInAt
                    .Value <
                    cycle.EndUtc
            )
            {
                count = 1;
            }

            return count;
        }

        private static DateTime
            GetLocalDayStartUtc(
                DateTime localDate,
                TimeZoneInfo timeZone)
        {
            return TimeZoneInfo.ConvertTimeToUtc(
                DateTime.SpecifyKind(
                    localDate.Date,
                    DateTimeKind.Unspecified
                ),
                timeZone
            );
        }

        public async Task
            ProcessDueRemindersAsync(
                CancellationToken cancellationToken =
                    default)
        {
            var nowUtc =
                DateTime.UtcNow;

            var pacificTimeZone =
                GetPacificTimeZone();

            var nowPacific =
                TimeZoneInfo.ConvertTimeFromUtc(
                    nowUtc,
                    pacificTimeZone
                );

            var todayStartUtc =
                GetLocalDayStartUtc(
                    nowPacific.Date,
                    pacificTimeZone
                );

            var tomorrowStartUtc =
                GetLocalDayStartUtc(
                    nowPacific.Date.AddDays(1),
                    pacificTimeZone
                );

            var streaks =
                await _context.Streaks
                    .AsNoTracking()
                    .Include(streak =>
                        streak.Members
                    )
                    .Where(streak =>
                        streak.IsActive
                    )
                    .ToListAsync(
                        cancellationToken
                    );

            if (streaks.Count == 0)
            {
                return;
            }

            var cycleStates =
                new List<ReminderCycleState>();

            foreach (var streak in streaks)
            {
                var requiredCheckIns =
                    Math.Max(
                        1,
                        streak.RequiredCheckIns
                    );

                var cycleLength =
                    Math.Max(
                        1,
                        streak.CycleLength
                    );

                var cycleUnit =
                    streak.CycleUnit?
                        .Trim()
                        .ToLowerInvariant() switch
                    {
                        "week" => "Week",
                        "month" => "Month",
                        _ => "Day"
                    };

                var currentCycle =
                    StreakCycleCalculator
                        .GetCurrentCycle(
                            streak.StartedAt,
                            nowUtc,
                            cycleLength,
                            cycleUnit,
                            pacificTimeZone
                        );

                StreakCycleWindow?
                    previousCycle = null;

                if (
                    streak.CycleTrackingStartedAt <
                    currentCycle.StartUtc
                )
                {
                    previousCycle =
                        StreakCycleCalculator
                            .GetPreviousCycle(
                                streak.StartedAt,
                                currentCycle.StartUtc,
                                cycleLength,
                                cycleUnit,
                                pacificTimeZone
                            );
                }

                cycleStates.Add(
                    new ReminderCycleState(
                        streak,
                        requiredCheckIns,
                        currentCycle,
                        previousCycle
                    )
                );
            }

            var streakIds =
                cycleStates
                    .Select(state =>
                        state.Streak.Id
                    )
                    .ToList();

            var earliestNeededUtc =
                cycleStates
                    .Select(state =>
                        state.PreviousCycle?
                            .StartUtc ??
                        state.CurrentCycle
                            .StartUtc
                    )
                    .Min();

            var checkIns =
                await _context.StreakCheckIns
                    .AsNoTracking()
                    .Where(checkIn =>
                        streakIds.Contains(
                            checkIn.StreakId
                        ) &&
                        checkIn.CheckedInAt >=
                            earliestNeededUtc
                    )
                    .ToListAsync(
                        cancellationToken
                    );

            var currentCycleReceipts =
                await _context
                    .AutomaticStreakReminders
                    .AsNoTracking()
                    .Where(reminder =>
                        streakIds.Contains(
                            reminder.StreakId
                        ) &&
                        reminder.CycleStartUtc >=
                            earliestNeededUtc
                    )
                    .ToListAsync(
                        cancellationToken
                    );

            var remindersSentToday =
                await _context
                    .AutomaticStreakReminders
                    .AsNoTracking()
                    .Where(reminder =>
                        reminder.SentAt >=
                            todayStartUtc &&
                        reminder.SentAt <
                            tomorrowStartUtc
                    )
                    .Select(reminder =>
                        reminder.UserId
                    )
                    .Distinct()
                    .ToListAsync(
                        cancellationToken
                    );

            var usersRemindedToday =
                remindersSentToday
                    .ToHashSet();

            var unfinishedCounts =
                new Dictionary<
                    string,
                    int
                >();

            var triggerStreaksByUser =
                new Dictionary<
                    string,
                    List<ReminderTrigger>
                >();

            foreach (var state in cycleStates)
            {
                var streak =
                    state.Streak;

                var memberIds =
                    GetMemberIds(
                        streak
                    );

                if (memberIds.Count == 0)
                {
                    continue;
                }

                /*
                 * If an older tracked cycle has already
                 * failed, this streak is logically dead
                 * even if another request has not yet
                 * persisted IsActive = false.
                 *
                 * Do not send reminders for it.
                 */
                if (
                    state.PreviousCycle != null &&
                    streak.CycleTrackingStartedAt <=
                        state.PreviousCycle.StartUtc
                )
                {
                    var previousCycleCompleted =
                        memberIds.All(userId =>
                            GetMemberCheckInCount(
                                streak,
                                userId,
                                state.RequiredCheckIns,
                                state.PreviousCycle,
                                checkIns
                            ) >=
                            state.RequiredCheckIns
                        );

                    if (!previousCycleCompleted)
                    {
                        continue;
                    }
                }

                var effectiveCycleStart =
                    streak.CycleTrackingStartedAt >
                    state.CurrentCycle.StartUtc
                        ? streak
                            .CycleTrackingStartedAt
                        : state.CurrentCycle
                            .StartUtc;

                if (
                    effectiveCycleStart >=
                    state.CurrentCycle.EndUtc
                )
                {
                    continue;
                }

                var availableDuration =
                    state.CurrentCycle.EndUtc -
                    effectiveCycleStart;

                var reminderThreshold =
                    effectiveCycleStart.AddTicks(
                        availableDuration.Ticks /
                        2
                    );

                var thresholdReached =
                    nowUtc >=
                    reminderThreshold;

                foreach (var userId in memberIds)
                {
                    if (
                        StreakyIdentity.IsStreaky(
                            userId
                        )
                    )
                    {
                        continue;
                    }

                    var currentCheckInCount =
                        GetMemberCheckInCount(
                            streak,
                            userId,
                            state.RequiredCheckIns,
                            state.CurrentCycle,
                            checkIns
                        );

                    if (
                        currentCheckInCount >=
                        state.RequiredCheckIns
                    )
                    {
                        continue;
                    }

                    if (
                        unfinishedCounts
                            .TryGetValue(
                                userId,
                                out var unfinishedCount
                            )
                    )
                    {
                        unfinishedCounts[userId] =
                            unfinishedCount + 1;
                    }
                    else
                    {
                        unfinishedCounts[userId] =
                            1;
                    }

                    if (!thresholdReached)
                    {
                        continue;
                    }

                    var alreadyTriggered =
                        currentCycleReceipts
                            .Any(reminder =>
                                reminder.UserId ==
                                    userId &&
                                reminder.StreakId ==
                                    streak.Id &&
                                reminder.CycleStartUtc ==
                                    state.CurrentCycle
                                        .StartUtc
                            );

                    if (alreadyTriggered)
                    {
                        continue;
                    }

                    if (
                        !triggerStreaksByUser
                            .TryGetValue(
                                userId,
                                out var triggers
                            )
                    )
                    {
                        triggers =
                            new List<
                                ReminderTrigger
                            >();

                        triggerStreaksByUser[
                            userId
                        ] = triggers;
                    }

                    triggers.Add(
                        new ReminderTrigger(
                            streak.Id,
                            state.CurrentCycle
                                .StartUtc
                        )
                    );
                }
            }

            foreach (
                var userTriggers
                in triggerStreaksByUser
            )
            {
                var userId =
                    userTriggers.Key;

                if (
                    usersRemindedToday.Contains(
                        userId
                    )
                )
                {
                    continue;
                }

                if (
                    !unfinishedCounts.TryGetValue(
                        userId,
                        out var unfinishedCount
                    ) ||
                    unfinishedCount <= 0
                )
                {
                    continue;
                }

                var pushResult =
                    await _pushNotificationService
                        .NotifyAutomaticStreakReminderAsync(
                            userId,
                            unfinishedCount
                        );

                /*
                 * Do not consume reminder eligibility if
                 * no push actually reached a subscription.
                 */
                if (pushResult.Sent <= 0)
                {
                    continue;
                }

                var sentAt =
                    DateTime.UtcNow;

                foreach (
                    var trigger
                    in userTriggers.Value
                        .Distinct()
                )
                {
                    _context
                        .AutomaticStreakReminders
                        .Add(
                            new AutomaticStreakReminder
                            {
                                UserId =
                                    userId,

                                StreakId =
                                    trigger.StreakId,

                                CycleStartUtc =
                                    trigger.CycleStartUtc,

                                SentAt =
                                    sentAt
                            }
                        );
                }

                await _context.SaveChangesAsync(
                    cancellationToken
                );

                usersRemindedToday.Add(
                    userId
                );
            }
        }
    }
}