using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.Services;
using System.Security.Claims;
using Picability.DTOs;

namespace Picability.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var user = await _context.Users
                .Where(u => u.Id == currentUserId)
                .Select(u => new
                {
                    u.Id,
                    u.UserName,
                    u.Email
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound();

            return Ok(user);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers(
    [FromQuery] string query)
        {
            var currentUserId =
                GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized();
            }

            var normalizedQuery =
                query?.Trim();

            if (
                string.IsNullOrWhiteSpace(
                    normalizedQuery
                ) ||
                normalizedQuery.Length < 2
            )
            {
                return Ok(
                    Array.Empty<UserSummaryDto>()
                );
            }

            var users =
                await _context.Users
                    .AsNoTracking()
                    .Where(user =>
                        user.Id != currentUserId &&
                        user.Id !=
                            StreakyIdentity.UserId &&
                        user.UserName != null &&
                        EF.Functions.ILike(
                            user.UserName,
                            $"%{normalizedQuery}%"
                        )
                    )
                    .OrderBy(user =>
                        user.UserName
                    )
                    .Take(20)
                    .Select(user =>
                        new UserSummaryDto
                        {
                            Id = user.Id,

                            UserName =
                                user.UserName ??
                                string.Empty
                        }
                    )
                    .ToListAsync();

            return Ok(users);
        }

        [HttpGet("profile/{userName}")]
        public async Task<IActionResult> GetProfile(
    string userName)
        {
            var currentUserId =
                GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized();
            }

            var normalizedUserName =
                userName.Trim();

            if (string.IsNullOrWhiteSpace(
                normalizedUserName))
            {
                return BadRequest(new
                {
                    message =
                        "A username is required."
                });
            }

            var profileUser =
                await _context.Users
                    .Where(user =>
                        user.UserName ==
                            normalizedUserName)
                    .Select(user => new
                    {
                        user.Id,
                        user.UserName
                    })
                    .FirstOrDefaultAsync();

            if (profileUser == null)
            {
                return NotFound(new
                {
                    message =
                        "User not found."
                });
            }

            /*
             * Streaky is a system account rather than a
             * normal user profile.
             */
            if (
                profileUser.Id ==
                StreakyIdentity.UserId
            )
            {
                return BadRequest(new
                {
                    message =
                        "Streaky does not have a standard user profile."
                });
            }

            string relationshipStatus;

            if (
                profileUser.Id ==
                currentUserId
            )
            {
                relationshipStatus = "Self";
            }
            else
            {
                var friendRequest =
                    await _context.FriendRequests
                        .Where(request =>
                            (
                                request.SenderId ==
                                    currentUserId &&
                                request.ReceiverId ==
                                    profileUser.Id
                            ) ||
                            (
                                request.SenderId ==
                                    profileUser.Id &&
                                request.ReceiverId ==
                                    currentUserId
                            )
                        )
                        .OrderByDescending(
                            request =>
                                request.Id
                        )
                        .FirstOrDefaultAsync();

                if (
                    friendRequest?.Status ==
                    "Accepted"
                )
                {
                    relationshipStatus =
                        "Friends";
                }
                else if (
                    friendRequest?.Status ==
                        "Pending" &&
                    friendRequest.SenderId ==
                        currentUserId
                )
                {
                    relationshipStatus =
                        "RequestSent";
                }
                else if (
                    friendRequest?.Status ==
                        "Pending" &&
                    friendRequest.ReceiverId ==
                        currentUserId
                )
                {
                    relationshipStatus =
                        "RequestReceived";
                }
                else
                {
                    relationshipStatus =
                        "None";
                }
            }

            /*
             * Pull every streak this user has participated
             * in. This supports both modern StreakMember
             * records and older UserOne/UserTwo streaks.
             */
            var userStreaks =
                await _context.Streaks
                    .Where(streak =>
                        streak.Members.Any(member =>
                            member.UserId ==
                                profileUser.Id
                        ) ||
                        streak.UserOneId ==
                            profileUser.Id ||
                        streak.UserTwoId ==
                            profileUser.Id
                    )
                    .Select(streak => new
                    {
                        streak.Id,
                        streak.HabitName,
                        streak.CurrentCount,
                        streak.IsActive
                    })
                    .ToListAsync();

            var highestStreak =
                userStreaks
                    .OrderByDescending(
                        streak =>
                            streak.CurrentCount
                    )
                    .FirstOrDefault();

            var result =
                new UserProfileDto
                {
                    Id = profileUser.Id,

                    UserName =
                        profileUser.UserName ??
                        string.Empty,

                    HighestStreakCount =
                        highestStreak
                            ?.CurrentCount ??
                        0,

                    HighestStreakName =
                        highestStreak
                            ?.HabitName,

                    ActiveStreakCount =
                        userStreaks.Count(
                            streak =>
                                streak.IsActive
                        ),

                    TotalStreakCount =
                        userStreaks.Count,

                    RelationshipStatus =
                        relationshipStatus
                };

            return Ok(result);
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetPublicUser(
            string userId)
        {
            var currentUserId =
                GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized();
            }

            if (
                string.IsNullOrWhiteSpace(
                    userId
                ) ||
                userId ==
                    StreakyIdentity.UserId
            )
            {
                return NotFound();
            }

            var user =
                await _context.Users
                    .AsNoTracking()
                    .Where(user =>
                        user.Id == userId
                    )
                    .Select(user =>
                        new UserSummaryDto
                        {
                            Id = user.Id,

                            UserName =
                                user.UserName ??
                                string.Empty
                        }
                    )
                    .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound();
            }

            return Ok(user);
        }
    }
}