using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.Models;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace Picability.Controllers;

[ApiController]
[Authorize]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ReportsController(ApplicationDbContext db)
    {
        _db = db;
    }

    public class SubmitReportRequest
    {
        [Required]
        public string ReportedUserId { get; set; } = string.Empty;

        [Required]
        public string Reason { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Details { get; set; }
    }

    [HttpPost("admin/{id:int}/dismiss")]
    public async Task<IActionResult> DismissReport(
        int id,
        [FromServices] IConfiguration configuration)
    {
        var currentUserId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        var adminUserId = configuration["Moderation:AdminUserId"];

        if (string.IsNullOrWhiteSpace(adminUserId) ||
            currentUserId != adminUserId)
        {
            return Forbid();
        }

        var report = await _db.ContentReports
            .FirstOrDefaultAsync(r => r.Id == id);

        if (report == null)
            return NotFound(new { message = "Report not found." });

        if (report.Status != "Pending")
            return Conflict(new { message = "Report has already been reviewed." });

        report.Status = "Dismissed";
        report.ReviewedAt = DateTime.UtcNow;
        report.ReviewedByUserId = currentUserId;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Report dismissed successfully.",
            reportId = report.Id
        });
    }
    [HttpPost("admin/{id:int}/remove-comment")]
    public async Task<IActionResult> RemoveReportedComment(
        int id,
        [FromServices] IConfiguration configuration)
    {
        var currentUserId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        var adminUserId = configuration["Moderation:AdminUserId"];

        if (string.IsNullOrWhiteSpace(adminUserId) ||
            currentUserId != adminUserId)
        {
            return Forbid();
        }

        var report = await _db.ContentReports
            .FirstOrDefaultAsync(r => r.Id == id);

        if (report == null)
            return NotFound(new { message = "Report not found." });

        if (report.Status != "Pending")
            return Conflict(new { message = "Report has already been reviewed." });

        if (report.ContentType != "Comment" ||
            !report.ContentId.HasValue)
        {
            return BadRequest(new
            {
                message = "This report does not reference a comment."
            });
        }

        var comment = await _db.StreakComments
            .FirstOrDefaultAsync(c => c.Id == report.ContentId.Value);

        if (comment == null)
            return NotFound(new { message = "Comment no longer exists." });

        if (comment.UserId != report.ReportedUserId)
            return Conflict(new { message = "Comment author does not match report." });

        _db.StreakComments.Remove(comment);

        report.Status = "ContentRemoved";
        report.ReviewedAt = DateTime.UtcNow;
        report.ReviewedByUserId = currentUserId;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Reported comment removed successfully.",
            reportId = report.Id,
            commentId = comment.Id
        });
    }
    public class SubmitCommentReportRequest
    {
        public int CommentId { get; set; }

        [Required]
        public string Reason { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Details { get; set; }
    }

    [HttpPost("comment")]
    public async Task<IActionResult> SubmitCommentReport(
        [FromBody] SubmitCommentReportRequest request,
        [FromServices] Picability.Services.StreakSocialAccessService accessService)
    {
        var reporterId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(reporterId))
            return Unauthorized();

        var validReasons = new[]
        {
            "Harassment",
            "Inappropriate Content",
            "Spam",
            "Impersonation",
            "Other"
        };

        if (!validReasons.Contains(request.Reason))
            return BadRequest(new { message = "Invalid report reason." });

        var comment = await _db.StreakComments
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == request.CommentId);

        if (comment == null)
            return NotFound(new { message = "Comment not found." });

        var streak = await _db.Streaks
            .Include(s => s.Members)
            .FirstOrDefaultAsync(s => s.Id == comment.StreakId);

        if (streak == null)
            return NotFound(new { message = "Streak not found." });

        if (!await accessService.CanAccessAsync(streak, reporterId))
            return Forbid();

        var currentEventAt =
            Picability.Services.StreakSocialAccessService.CurrentFeedEventAt(streak);

        if (!currentEventAt.HasValue ||
            comment.FeedEventAt != currentEventAt.Value)
        {
            return BadRequest(new
            {
                message = "This comment is no longer available in the current feed."
            });
        }

        if (comment.UserId == reporterId)
            return BadRequest(new { message = "You cannot report yourself." });

        var alreadyReported = await _db.ContentReports
            .AnyAsync(r =>
                r.ReporterId == reporterId &&
                r.ContentType == "Comment" &&
                r.ContentId == comment.Id &&
                r.Status == "Pending");

        if (alreadyReported)
            return Conflict(new { message = "You already reported this comment." });

        var report = new ContentReport
        {
            ReporterId = reporterId,
            ReportedUserId = comment.UserId,
            ContentType = "Comment",
            ContentId = comment.Id,
            Reason = request.Reason,
            Details = request.Details?.Trim(),
            EvidenceSnapshot = comment.Text,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _db.ContentReports.Add(report);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Comment reported successfully.",
            reportId = report.Id
        });
    }
    public class SubmitCheckInContentReportRequest
    {
        public int ContentId { get; set; }

        [Required]
        public string Reason { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Details { get; set; }
    }

    [HttpPost("check-in-content")]
    public async Task<IActionResult> SubmitCheckInContentReport(
        [FromBody] SubmitCheckInContentReportRequest request)
    {
        var reporterId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(reporterId))
            return Unauthorized();

        var validReasons = new[]
        {
            "Harassment",
            "Inappropriate Content",
            "Spam",
            "Impersonation",
            "Other"
        };

        if (!validReasons.Contains(request.Reason))
            return BadRequest(new { message = "Invalid report reason." });

        var content = await _db.CheckInContents
            .AsNoTracking()
            .Include(c => c.Recipients)
            .FirstOrDefaultAsync(c => c.Id == request.ContentId);

        if (content == null)
            return NotFound(new { message = "Content not found." });

        var recipient = content.Recipients
            .FirstOrDefault(r => r.UserId == reporterId);

        if (recipient == null)
            return Forbid();

        if (recipient.IsViewed)
            return BadRequest(new
            {
                message = "This content has already been viewed."
            });

        var streak = await _db.Streaks
            .AsNoTracking()
            .Include(s => s.Members)
            .FirstOrDefaultAsync(s => s.Id == content.StreakId);

        if (streak == null)
            return NotFound(new { message = "Streak not found." });

        var participantIds = streak.Members
            .Select(m => m.UserId)
            .Append(streak.UserOneId)
            .Append(streak.UserTwoId)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct()
            .ToList();

        var blocked = await _db.UserBlocks
            .AsNoTracking()
            .AnyAsync(b =>
                (b.BlockerId == reporterId &&
                 (b.BlockedUserId == content.SenderId ||
                  participantIds.Contains(b.BlockedUserId))) ||
                (b.BlockedUserId == reporterId &&
                 (b.BlockerId == content.SenderId ||
                  participantIds.Contains(b.BlockerId))));

        if (blocked)
            return NotFound(new { message = "Content not found." });

        if (content.SenderId == reporterId)
            return BadRequest(new { message = "You cannot report yourself." });

        var alreadyReported = await _db.ContentReports
            .AnyAsync(r =>
                r.ReporterId == reporterId &&
                r.ContentType == "CheckInContent" &&
                r.ContentId == content.Id &&
                r.Status == "Pending");

        if (alreadyReported)
            return Conflict(new { message = "You already reported this content." });

        var report = new ContentReport
        {
            ReporterId = reporterId,
            ReportedUserId = content.SenderId,
            ContentType = "CheckInContent",
            ContentId = content.Id,
            Reason = request.Reason,
            Details = request.Details?.Trim(),
            EvidenceSnapshot = content.ContentType == "Message"
                ? "[Private message reported; text not retained]"
                : "[Private photo reported; image not retained]",
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _db.ContentReports.Add(report);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Content reported successfully.",
            reportId = report.Id
        });
    }
    [HttpPost("admin/{id:int}/remove-content")]
    public async Task<IActionResult> RemoveReportedContent(
        int id,
        [FromServices] IConfiguration configuration)
    {
        var currentUserId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        var adminUserId = configuration["Moderation:AdminUserId"];

        if (string.IsNullOrWhiteSpace(adminUserId) ||
            currentUserId != adminUserId)
        {
            return Forbid();
        }

        var report = await _db.ContentReports
            .FirstOrDefaultAsync(r => r.Id == id);

        if (report == null)
            return NotFound(new { message = "Report not found." });

        if (report.Status != "Pending")
            return Conflict(new { message = "Report has already been reviewed." });

        if (report.ContentType != "CheckInContent" ||
            !report.ContentId.HasValue)
        {
            return BadRequest(new
            {
                message = "This report does not reference check-in content."
            });
        }

        var content = await _db.CheckInContents
            .FirstOrDefaultAsync(c => c.Id == report.ContentId.Value);

        if (content != null)
        {
            if (content.SenderId != report.ReportedUserId)
            {
                return Conflict(new
                {
                    message = "Content sender does not match report."
                });
            }

            _db.CheckInContents.Remove(content);
        }

        report.Status = content == null
            ? "AlreadyDeleted"
            : "ContentRemoved";

        report.ReviewedAt = DateTime.UtcNow;
        report.ReviewedByUserId = currentUserId;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = content == null
                ? "Content had already disappeared. Report closed."
                : "Reported content removed successfully.",
            reportId = report.Id,
            contentId = report.ContentId,
            status = report.Status
        });
    }
    public class SuspendReportedUserRequest
    {
        [Range(1, 365)]
        public int Days { get; set; } = 7;
    }

    [HttpPost("admin/{id:int}/suspend-user")]
    public async Task<IActionResult> SuspendReportedUser(
        int id,
        [FromBody] SuspendReportedUserRequest request,
        [FromServices] IConfiguration configuration,
        [FromServices] UserManager<ApplicationUser> userManager)
    {
        var currentUserId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        var adminUserId = configuration["Moderation:AdminUserId"];

        if (string.IsNullOrWhiteSpace(adminUserId) ||
            currentUserId != adminUserId)
        {
            return Forbid();
        }

        if (request.Days < 1 || request.Days > 365)
        {
            return BadRequest(new
            {
                message = "Suspension must be between 1 and 365 days."
            });
        }

        var report = await _db.ContentReports
            .FirstOrDefaultAsync(r => r.Id == id);

        if (report == null)
            return NotFound(new { message = "Report not found." });

        if (report.Status != "Pending")
        {
            return Conflict(new
            {
                message = "Report has already been reviewed."
            });
        }

        if (report.ReportedUserId == currentUserId)
        {
            return BadRequest(new
            {
                message = "Administrators cannot suspend themselves."
            });
        }

        var reportedUser = await userManager.FindByIdAsync(
            report.ReportedUserId);

        if (reportedUser == null)
        {
            return NotFound(new
            {
                message = "Reported user no longer exists."
            });
        }

        var suspensionEnds = DateTimeOffset.UtcNow.AddDays(
            request.Days);

        var lockoutEnabledResult =
            await userManager.SetLockoutEnabledAsync(
                reportedUser,
                true);

        if (!lockoutEnabledResult.Succeeded)
        {
            return StatusCode(500, new
            {
                message = "Could not enable account suspension."
            });
        }

        var lockoutResult = await userManager.SetLockoutEndDateAsync(
            reportedUser,
            suspensionEnds);

        if (!lockoutResult.Succeeded)
        {
            return StatusCode(500, new
            {
                message = "Could not suspend account."
            });
        }

        report.Status = "UserSuspended";
        report.ReviewedAt = DateTime.UtcNow;
        report.ReviewedByUserId = currentUserId;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "User suspended successfully.",
            reportId = report.Id,
            reportedUserId = reportedUser.Id,
            suspensionEndsAt = suspensionEnds,
            status = report.Status
        });
    }
    [HttpPost("admin/{id:int}/unsuspend-user")]
    public async Task<IActionResult> UnsuspendReportedUser(
        int id,
        [FromServices] IConfiguration configuration,
        [FromServices] UserManager<ApplicationUser> userManager)
    {
        var currentUserId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        var adminUserId = configuration["Moderation:AdminUserId"];

        if (string.IsNullOrWhiteSpace(adminUserId) ||
            currentUserId != adminUserId)
        {
            return Forbid();
        }

        var report = await _db.ContentReports
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id);

        if (report == null)
            return NotFound(new { message = "Report not found." });

        var reportedUser = await userManager.FindByIdAsync(
            report.ReportedUserId);

        if (reportedUser == null)
        {
            return NotFound(new
            {
                message = "Reported user no longer exists."
            });
        }

        if (!await userManager.IsLockedOutAsync(reportedUser))
        {
            return Conflict(new
            {
                message = "This user is not currently suspended."
            });
        }

        var result = await userManager.SetLockoutEndDateAsync(
            reportedUser,
            DateTimeOffset.UtcNow);

        if (!result.Succeeded)
        {
            return StatusCode(500, new
            {
                message = "Could not lift account suspension."
            });
        }

        return Ok(new
        {
            message = "Account suspension lifted successfully.",
            reportedUserId = reportedUser.Id,
            reportId = report.Id
        });
    }
    [HttpGet("admin")]
    public async Task<IActionResult> GetReports(
        [FromServices] IConfiguration configuration)
    {
        var currentUserId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        var adminUserId = configuration["Moderation:AdminUserId"];

        if (string.IsNullOrWhiteSpace(adminUserId) ||
            currentUserId != adminUserId)
        {
            return Forbid();
        }

        var reports = await _db.ContentReports
            .AsNoTracking()
            .OrderByDescending(r => r.CreatedAt)
            .Take(100)
            .Select(r => new
            {
                r.Id,
                r.ReporterId,
                r.ReportedUserId,
                r.ContentType,
                r.ContentId,
                r.Reason,
                r.Details,
                r.EvidenceSnapshot,
                r.Status,
                r.CreatedAt,
                r.ReviewedAt
            })
            .ToListAsync();

        var reportedUserIds = reports
            .Select(r => r.ReportedUserId)
            .Distinct()
            .ToList();

        var now = DateTimeOffset.UtcNow;

        var suspendedUserIds = await _db.Users
            .AsNoTracking()
            .Where(u => reportedUserIds.Contains(u.Id))
            .Where(u => u.LockoutEnabled &&
                        u.LockoutEnd != null &&
                        u.LockoutEnd > now)
            .Select(u => u.Id)
            .ToListAsync();

        var suspendedSet = suspendedUserIds.ToHashSet();

        var results = reports.Select(r => new
        {
            r.Id,
            r.ReporterId,
            r.ReportedUserId,
            r.ContentType,
            r.ContentId,
            r.Reason,
            r.Details,
            r.EvidenceSnapshot,
            r.Status,
            r.CreatedAt,
            r.ReviewedAt,
            IsSuspended = suspendedSet.Contains(r.ReportedUserId)
        });

        return Ok(results);
    }
    [HttpPost]
    public async Task<IActionResult> SubmitReport(
        [FromBody] SubmitReportRequest request)
    {
        var reporterId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(reporterId))
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.ReportedUserId))
            return BadRequest(new { message = "Reported user is required." });

        if (reporterId == request.ReportedUserId)
            return BadRequest(new { message = "You cannot report yourself." });

        var validReasons = new[]
        {
            "Harassment",
            "Inappropriate Content",
            "Spam",
            "Impersonation",
            "Other"
        };

        if (!validReasons.Contains(request.Reason))
            return BadRequest(new { message = "Invalid report reason." });

        if (!await _db.Users.AnyAsync(
            u => u.Id == request.ReportedUserId))
        {
            return NotFound(new { message = "User not found." });
        }

        var report = new ContentReport
        {
            ReporterId = reporterId,
            ReportedUserId = request.ReportedUserId,
            ContentType = "User",
            Reason = request.Reason,
            Details = request.Details?.Trim(),
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _db.ContentReports.Add(report);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Report submitted successfully.",
            reportId = report.Id
        });
    }
}