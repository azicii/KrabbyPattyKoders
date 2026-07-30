using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.DTOs;
using Picability.Models;
using Picability.Services;
using System.Security.Claims;

namespace Picability.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CheckInContentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PushNotificationService _pushNotificationService;

        /*
         * Base64 is roughly 33% larger than the original image.
         * 12 million characters allows approximately 9 MB.
         */
        private const int MaxPhotoDataUrlLength = 12_000_000;
        private const int StaleContentRetentionDays = 365;

        public CheckInContentController(
            ApplicationDbContext context,
            PushNotificationService pushNotificationService)
        {
            _context = context;
            _pushNotificationService =
                pushNotificationService;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );
        }

        private static TimeZoneInfo GetPacificTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(
                    "Pacific Standard Time"
                );
            }
            catch
            {
                return TimeZoneInfo.FindSystemTimeZoneById(
                    "America/Los_Angeles"
                );
            }
        }

        private async Task<
            (int CheckInNumber, int RequiredCheckIns)
        > GetNextCheckInPositionAsync(
            Streak streak,
            string currentUserId,
            DateTime nowUtc)
        {
            var requiredCheckIns = Math.Max(
                1,
                streak.RequiredCheckIns
            );

            var cycleLength = Math.Max(
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

            var cycle =
                StreakCycleCalculator.GetCurrentCycle(
                    streak.StartedAt,
                    nowUtc,
                    cycleLength,
                    cycleUnit,
                    GetPacificTimeZone()
                );

            var existingCheckInCount =
                await _context.StreakCheckIns.CountAsync(
                    checkIn =>
                        checkIn.StreakId == streak.Id &&
                        checkIn.UserId == currentUserId &&
                        checkIn.CheckedInAt >= cycle.StartUtc &&
                        checkIn.CheckedInAt < cycle.EndUtc
                );

            /*
             * Only the original two users can have legacy
             * timestamp-only check-ins.
             */
            DateTime? legacyCheckIn = null;

            if (streak.UserOneId == currentUserId)
            {
                legacyCheckIn =
                    streak.UserOneLastCheckedInAt;
            }
            else if (streak.UserTwoId == currentUserId)
            {
                legacyCheckIn =
                    streak.UserTwoLastCheckedInAt;
            }

            if (
                existingCheckInCount == 0 &&
                legacyCheckIn.HasValue &&
                legacyCheckIn.Value >= cycle.StartUtc &&
                legacyCheckIn.Value < cycle.EndUtc
            )
            {
                existingCheckInCount = 1;
            }

            var nextCheckInNumber = Math.Min(
                requiredCheckIns,
                existingCheckInCount + 1
            );

            return (
                nextCheckInNumber,
                requiredCheckIns
            );
        }

        private async Task<Streak?> GetAuthorizedStreakAsync(
            int streakId,
            string currentUserId)
        {
            return await _context.Streaks
                .Include(streak => streak.UserOne)
                .Include(streak => streak.UserTwo)
                .Include(streak => streak.Members)
                    .ThenInclude(member => member.User)
                .FirstOrDefaultAsync(streak =>
                    streak.Id == streakId &&
                    streak.IsActive &&
                    (
                        streak.Members.Any(member =>
                            member.UserId == currentUserId
                        ) ||
                        streak.UserOneId == currentUserId ||
                        streak.UserTwoId == currentUserId
                    )
                );
        }

        private static List<string> GetRecipientIds(
            Streak streak,
            string senderId)
        {
            var memberIds = streak.Members
                .Select(member => member.UserId)
                .Where(userId =>
                    !string.IsNullOrWhiteSpace(userId)
                )
                .Distinct()
                .ToList();

            /*
             * Transitional fallback for old streaks that do not
             * contain StreakMember rows.
             */
            if (memberIds.Count == 0)
            {
                memberIds.Add(streak.UserOneId);
                memberIds.Add(streak.UserTwoId);
            }

            return memberIds
                .Where(userId => userId != senderId)
                .Distinct()
                .ToList();
        }

        private async Task DeleteStaleCheckInContentAsync()
        {
            var cutoffDate =
                DateTime.UtcNow.AddDays(
                    -StaleContentRetentionDays
                );

            var staleContents =
                await _context.CheckInContents
                    .Where(content =>
                        content.CreatedAt < cutoffDate
                    )
                    .ToListAsync();

            if (staleContents.Count == 0)
                return;

            _context.CheckInContents.RemoveRange(
                staleContents
            );

            await _context.SaveChangesAsync();
        }

        private async Task<IActionResult> CreateContentAsync(
    int streakId,
    string currentUserId,
    string contentType,
    string? messageText,
    string? photoDataUrl,
    int viewDurationSeconds)
        {
            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                var streak =
                    await GetAuthorizedStreakAsync(
                        streakId,
                        currentUserId
                    );

                if (streak == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Active streak not found or you are not a member."
                    });
                }

                var recipientIds =
                    GetRecipientIds(
                        streak,
                        currentUserId
                    );

                if (recipientIds.Count == 0)
                {
                    return BadRequest(new
                    {
                        message =
                            "No other streak participants were found."
                    });
                }

                var memberIds = streak.Members
                    .Select(member => member.UserId)
                    .Where(userId =>
                        !string.IsNullOrWhiteSpace(userId)
                    )
                    .Distinct()
                    .ToList();

                /*
                 * Legacy two-person fallback.
                 */
                if (memberIds.Count == 0)
                {
                    memberIds.Add(streak.UserOneId);
                    memberIds.Add(streak.UserTwoId);
                }

                if (!memberIds.Contains(currentUserId))
                {
                    return Forbid();
                }

                var nowUtc = DateTime.UtcNow;

                var requiredCheckIns = Math.Max(
                    1,
                    streak.RequiredCheckIns
                );

                var cycleLength = Math.Max(
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

                var cycle =
                    StreakCycleCalculator.GetCurrentCycle(
                        streak.StartedAt,
                        nowUtc,
                        cycleLength,
                        cycleUnit,
                        GetPacificTimeZone()
                    );

                var cycleCheckIns =
                    await _context.StreakCheckIns
                        .Where(checkIn =>
                            checkIn.StreakId ==
                                streak.Id &&
                            memberIds.Contains(
                                checkIn.UserId
                            ) &&
                            checkIn.CheckedInAt >=
                                cycle.StartUtc &&
                            checkIn.CheckedInAt <
                                cycle.EndUtc
                        )
                        .ToListAsync();

                var memberCounts =
                    memberIds.ToDictionary(
                        memberId => memberId,
                        memberId =>
                            cycleCheckIns.Count(
                                checkIn =>
                                    checkIn.UserId ==
                                    memberId
                            )
                    );

                /*
                 * Preserve legacy timestamp check-ins for the
                 * original two streak participants.
                 */
                if (
                    memberCounts.TryGetValue(
                        streak.UserOneId,
                        out var userOneCount
                    ) &&
                    userOneCount == 0 &&
                    streak.UserOneLastCheckedInAt
                        .HasValue &&
                    streak.UserOneLastCheckedInAt
                        .Value >= cycle.StartUtc &&
                    streak.UserOneLastCheckedInAt
                        .Value < cycle.EndUtc
                )
                {
                    memberCounts[streak.UserOneId] = 1;
                }

                if (
                    memberCounts.TryGetValue(
                        streak.UserTwoId,
                        out var userTwoCount
                    ) &&
                    userTwoCount == 0 &&
                    streak.UserTwoLastCheckedInAt
                        .HasValue &&
                    streak.UserTwoLastCheckedInAt
                        .Value >= cycle.StartUtc &&
                    streak.UserTwoLastCheckedInAt
                        .Value < cycle.EndUtc
                )
                {
                    memberCounts[streak.UserTwoId] = 1;
                }

                var currentCheckInCount =
                    memberCounts[currentUserId];

                if (
    currentCheckInCount >=
    requiredCheckIns
)
                {
                    /*
                     * A stale browser bundle or rapid retry may send the
                     * same content request again after the first request
                     * already completed successfully.
                     *
                     * Treat a very recent matching request as an
                     * idempotent retry rather than showing the user an
                     * erroneous "already checked in" error.
                     */
                    var duplicateCutoff =
                        nowUtc.AddSeconds(-30);

                    var recentMatchingContent =
                        await _context.CheckInContents
                            .Include(existingContent =>
                                existingContent.Recipients
                            )
                            .Where(existingContent =>
                                existingContent.StreakId ==
                                    streak.Id &&
                                existingContent.SenderId ==
                                    currentUserId &&
                                existingContent.ContentType ==
                                    contentType &&
                                existingContent.CreatedAt >=
                                    duplicateCutoff
                            )
                            .OrderByDescending(existingContent =>
                                existingContent.CreatedAt
                            )
                            .FirstOrDefaultAsync();

                    if (recentMatchingContent != null)
                    {
                        await transaction.RollbackAsync();

                        return Ok(new
                        {
                            message =
                                contentType == "Photo"
                                    ? "Photo check-in was already completed."
                                    : "Message check-in was already completed.",

                            recentMatchingContent.Id,

                            recentMatchingContent.StreakId,

                            recentMatchingContent.SenderId,

                            RecipientIds =
                                recentMatchingContent
                                    .Recipients
                                    .Select(recipient =>
                                        recipient.UserId
                                    )
                                    .ToList(),

                            RecipientCount =
                                recentMatchingContent
                                    .Recipients
                                    .Count,

                            recentMatchingContent.ContentType,

                            recentMatchingContent.MessageText,

                            recentMatchingContent.PhotoUrl,

                            recentMatchingContent
                                .ViewDurationSeconds,

                            recentMatchingContent.CreatedAt,

                            recentMatchingContent.CheckInNumber,

                            recentMatchingContent.RequiredCheckIns,

                            CheckInCompleted =
                                true,

                            DuplicateSubmissionIgnored =
                                true,

                            UserCycleCheckInCount =
                                currentCheckInCount,

                            UserCompletedCycle =
                                true,

                            CycleStartedAt =
                                cycle.StartUtc,

                            CycleEndsAt =
                                cycle.EndUtc
                        });
                    }

                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            "You already completed all required check-ins for this cycle.",

                        currentCheckIns =
                            currentCheckInCount,

                        requiredCheckIns,

                        cycleEndsAt =
                            cycle.EndUtc
                    });
                }

                var checkInNumber = Math.Min(
                    requiredCheckIns,
                    currentCheckInCount + 1
                );

                var alreadyCompletedCycle =
                    streak.LastFullyCompletedAt
                        .HasValue &&
                    streak.LastFullyCompletedAt
                        .Value >= cycle.StartUtc &&
                    streak.LastFullyCompletedAt
                        .Value < cycle.EndUtc;

                /*
                 * Add the actual streak check-in.
                 */
                _context.StreakCheckIns.Add(
                    new StreakCheckIn
                    {
                        StreakId =
                            streak.Id,

                        UserId =
                            currentUserId,

                        CheckedInAt =
                            nowUtc
                    }
                );

                currentCheckInCount++;
                memberCounts[currentUserId] =
                    currentCheckInCount;

                /*
                 * Keep legacy fields synchronized for the
                 * original two participants.
                 */
                if (
                    currentUserId ==
                    streak.UserOneId
                )
                {
                    streak.UserOneLastCheckedInAt =
                        nowUtc;
                }

                if (
                    currentUserId ==
                    streak.UserTwoId
                )
                {
                    streak.UserTwoLastCheckedInAt =
                        nowUtc;
                }

                var allMembersCompletedCycle =
                    memberCounts.Values.All(count =>
                        count >= requiredCheckIns
                    );

                if (
                    allMembersCompletedCycle &&
                    !alreadyCompletedCycle
                )
                {
                    streak.CurrentCount++;
                    streak.LastFullyCompletedAt =
                        nowUtc;
                    streak.LastCompletedAt =
                        nowUtc;
                }

                /*
                 * Create one shared content record and one
                 * recipient record for every other member.
                 */
                var content = new CheckInContent
                {
                    StreakId =
                        streak.Id,

                    SenderId =
                        currentUserId,

                    /*
                     * Legacy compatibility only.
                     */
                    ReceiverId =
                        recipientIds[0],

                    ContentType =
                        contentType,

                    CheckInNumber =
                        checkInNumber,

                    RequiredCheckIns =
                        requiredCheckIns,

                    MessageText =
                        messageText,

                    PhotoUrl =
                        photoDataUrl,

                    ViewDurationSeconds =
                        viewDurationSeconds,

                    CreatedAt =
                        nowUtc,

                    IsViewed =
                        false,

                    Recipients =
                        recipientIds.Select(
                            recipientId =>
                                new CheckInContentRecipient
                                {
                                    UserId =
                                        recipientId,

                                    IsViewed =
                                        false
                                }
                        )
                        .ToList()
                };

                _context.CheckInContents.Add(
                    content
                );

                /*
                 * Both the check-in and its content are saved
                 * inside the same database transaction.
                 */
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                /*
                 * Push notifications happen only after the
                 * database transaction succeeds.
                 */
                var senderName =
                    streak.Members
                        .FirstOrDefault(member =>
                            member.UserId ==
                            currentUserId
                        )
                        ?.User
                        ?.UserName;

                if (
                    string.IsNullOrWhiteSpace(
                        senderName
                    )
                )
                {
                    senderName =
                        currentUserId ==
                        streak.UserOneId
                            ? streak.UserOne
                                ?.UserName
                            : streak.UserTwo
                                ?.UserName;
                }

                senderName ??= "A streak member";

                var sentMessage =
                    contentType == "Message";

                var sentPhoto =
                    contentType == "Photo";

                foreach (
                    var recipientId in
                    recipientIds
                )
                {
                    await _pushNotificationService
                        .NotifyPartnerCheckedInAsync(
                            recipientId,
                            senderName,
                            streak.HabitName,
                            currentCheckInCount,
                            requiredCheckIns,
                            cycleLength,
                            cycleUnit,
                            sentMessage,
                            sentPhoto
                        );
                }

                return Ok(new
                {
                    message =
                        contentType == "Photo"
                            ? "Photo check-in completed."
                            : "Message check-in completed.",

                    content.Id,
                    content.StreakId,
                    content.SenderId,

                    RecipientIds =
                        recipientIds,

                    RecipientCount =
                        recipientIds.Count,

                    content.ContentType,
                    content.MessageText,
                    content.PhotoUrl,
                    content.ViewDurationSeconds,
                    content.CreatedAt,
                    content.CheckInNumber,
                    content.RequiredCheckIns,

                    CheckInCompleted =
                        true,

                    UserCycleCheckInCount =
                        currentCheckInCount,

                    UserCompletedCycle =
                        currentCheckInCount >=
                        requiredCheckIns,

                    AllMembersCompletedCycle =
                        allMembersCompletedCycle,

                    streak.CurrentCount,

                    CycleStartedAt =
                        cycle.StartUtc,

                    CycleEndsAt =
                        cycle.EndUtc
                });
            }
            catch (Exception exception)
            {
                await transaction.RollbackAsync();

                Console.WriteLine(
                    "[CHECK-IN CONTENT TRANSACTION ERROR] " +
                    $"StreakId={streakId}, " +
                    $"UserId={currentUserId}, " +
                    $"ContentType={contentType}, " +
                    $"Error={exception}"
                );

                return StatusCode(
                    StatusCodes
                        .Status500InternalServerError,
                    new
                    {
                        message =
                            "The check-in and its content could not be saved.",

                        detail =
                            exception
                                .InnerException
                                ?.Message ??
                            exception.Message
                    }
                );
            }
        }

        [HttpPost("message")]
        public async Task<IActionResult> CreateMessage(
            [FromBody] CreateCheckInMessageDto model)
        {
            if (
                string.IsNullOrWhiteSpace(
                    model.MessageText
                )
            )
            {
                return BadRequest(new
                {
                    message =
                        "Message cannot be empty."
                });
            }

            if (
                model.ViewDurationSeconds < 1 ||
                model.ViewDurationSeconds > 10
            )
            {
                return BadRequest(new
                {
                    message =
                        "View duration must be between 1 and 10 seconds."
                });
            }

            await DeleteStaleCheckInContentAsync();

            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            return await CreateContentAsync(
                model.StreakId,
                currentUserId,
                "Message",
                model.MessageText.Trim(),
                null,
                model.ViewDurationSeconds
            );
        }

        [HttpPost("photo")]
        public async Task<IActionResult> CreatePhoto(
            [FromBody] CreateCheckInPhotoDto model)
        {
            if (
                string.IsNullOrWhiteSpace(
                    model.PhotoDataUrl
                )
            )
            {
                return BadRequest(new
                {
                    message = "Photo is required."
                });
            }

            if (
                !model.PhotoDataUrl.StartsWith(
                    "data:image/png;base64,"
                ) &&
                !model.PhotoDataUrl.StartsWith(
                    "data:image/jpeg;base64,"
                )
            )
            {
                return BadRequest(new
                {
                    message =
                        "Only PNG and JPG images are allowed."
                });
            }

            if (
                model.PhotoDataUrl.Length >
                MaxPhotoDataUrlLength
            )
            {
                return BadRequest(new
                {
                    message =
                        "Photo is too large. Please choose a smaller image."
                });
            }

            if (
                model.ViewDurationSeconds < 1 ||
                model.ViewDurationSeconds > 10
            )
            {
                return BadRequest(new
                {
                    message =
                        "View duration must be between 1 and 10 seconds."
                });
            }

            await DeleteStaleCheckInContentAsync();

            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            return await CreateContentAsync(
                model.StreakId,
                currentUserId,
                "Photo",
                null,
                model.PhotoDataUrl,
                model.ViewDurationSeconds
            );
        }

        [HttpGet("unread")]
        public async Task<IActionResult>
            GetUnreadForCurrentUser()
        {
            await DeleteStaleCheckInContentAsync();

            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var contents =
                await _context.CheckInContentRecipients
                    .Where(recipient =>
                        recipient.UserId == currentUserId &&
                        !recipient.IsViewed &&
                        recipient.CheckInContent.Streak.IsActive
                    )
                    .OrderByDescending(recipient =>
                        recipient.CheckInContent.CreatedAt
                    )
                    .Select(recipient => new
                    {
                        recipient.CheckInContent.Id,

                        recipient.CheckInContent.StreakId,

                        recipient.CheckInContent.SenderId,

                        SenderName =
                            recipient.CheckInContent
                                .Sender
                                .UserName,

                        ReceiverId =
                            recipient.UserId,

                        recipient.CheckInContent.ContentType,

                        recipient.CheckInContent.CheckInNumber,

                        recipient.CheckInContent.RequiredCheckIns,

                        recipient.CheckInContent.MessageText,

                        recipient.CheckInContent.PhotoUrl,

                        recipient.CheckInContent
                            .ViewDurationSeconds,

                        recipient.CheckInContent.CreatedAt
                    })
                    .ToListAsync();

            return Ok(contents);
        }

        [HttpPost("{id}/view")]
        public async Task<IActionResult> MarkViewed(int id)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var content =
                await _context.CheckInContents
                    .Include(item => item.Recipients)
                    .FirstOrDefaultAsync(item =>
                        item.Id == id
                    );

            if (content == null)
                return NotFound();

            var recipient =
                content.Recipients.FirstOrDefault(
                    item =>
                        item.UserId == currentUserId
                );

            if (recipient == null)
                return Forbid();

            var viewedAt = DateTime.UtcNow;

            /*
             * Make retries idempotent.
             */
            if (!recipient.IsViewed)
            {
                recipient.IsViewed = true;
                recipient.ViewedAt = viewedAt;
            }

            var allRecipientsViewed =
                content.Recipients.All(item =>
                    item.IsViewed
                );

            var remainingViewerCount =
                content.Recipients.Count(item =>
                    !item.IsViewed
                );

            var response = new
            {
                content.Id,
                ViewedAt =
                    recipient.ViewedAt ?? viewedAt,

                content.ViewDurationSeconds,

                AllRecipientsViewed =
                    allRecipientsViewed,

                RemainingViewerCount =
                    remainingViewerCount
            };

            if (allRecipientsViewed)
            {
                /*
                 * Cascading deletion removes all recipient rows.
                 */
                _context.CheckInContents.Remove(
                    content
                );
            }

            await _context.SaveChangesAsync();

            return Ok(response);
        }
    }
}