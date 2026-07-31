using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using WebPush;

namespace Picability.Services
{
    public class PushSendResult
    {
        public int SubscriptionsFound { get; set; }
        public int Sent { get; set; }
        public int Removed { get; set; }
        public int Failed { get; set; }
        public List<string> Errors { get; set; } = new();
    }

    public class PushNotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public PushNotificationService(
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<PushSendResult> NotifyPartnerCheckedInAsync(
    string receiverId,
    string partnerName,
    string streakName,
    int partnerCheckInNumber,
    int requiredCheckIns,
    int cycleLength,
    string cycleUnit,
    bool sentMessage,
    bool sentPhoto)
        {
            var normalizedRequiredCheckIns = Math.Max(
                1,
                requiredCheckIns
            );

            var normalizedCheckInNumber = Math.Clamp(
                partnerCheckInNumber,
                1,
                normalizedRequiredCheckIns
            );

            var normalizedCycleLength = Math.Max(
                1,
                cycleLength
            );

            var normalizedCycleUnit =
                cycleUnit?.Trim().ToLowerInvariant() switch
                {
                    "week" => "week",
                    "month" => "month",
                    _ => "day"
                };

            var isDefaultDailyStreak =
    normalizedRequiredCheckIns == 1 &&
    normalizedCycleLength == 1 &&
    normalizedCycleUnit == "day";

            var cycleDescription =
                normalizedCycleLength == 1
                    ? normalizedCycleUnit switch
                    {
                        "week" => "this week",
                        "month" => "this month",
                        _ => "today"
                    }
                    : $"this {normalizedCycleLength}-{normalizedCycleUnit} cycle";

            var contentLine =
                sentMessage && sentPhoto
                    ? "\n💬📷 Sent you a message and photo."
                    : sentMessage
                        ? "\n💬 Sent you a message."
                        : sentPhoto
                            ? "\n📷 Sent you a photo."
                            : string.Empty;

            var usesMultipleCheckIns =
                normalizedRequiredCheckIns > 1;

            var title =
                isDefaultDailyStreak
                    ? "Streak completed"
                    : usesMultipleCheckIns
                        ? "Streak progress"
                        : "Streak completed";

            var body =
                isDefaultDailyStreak
                    ? $"{partnerName} completed their " +
                      $"\"{streakName}\" streak today." +
                      contentLine
                    : usesMultipleCheckIns
                        ? $"{partnerName} completed check-in " +
                          $"{normalizedCheckInNumber} of " +
                          $"{normalizedRequiredCheckIns} for " +
                          $"\"{streakName}\" {cycleDescription}." +
                          contentLine
                        : $"{partnerName} completed their " +
                          $"\"{streakName}\" streak " +
                          $"{cycleDescription}." +
                          contentLine;

            return await SendPushAsync(
                receiverId,
                title,
                body,
                "/"
            );
        }

        public async Task<PushSendResult> NotifyFriendRequestAsync(
            string receiverId,
            string senderName)
        {
            return await SendPushAsync(
                receiverId,
                "New friend request",
                $"{senderName} sent you a friend request.",
                "/"
            );
        }

        public async Task<PushSendResult> NotifyStreakRequestAsync(
            string receiverId,
            string senderName,
            string streakName)
        {
            return await SendPushAsync(
                receiverId,
                "New streak request 🔥",
                $"{senderName} invited you to start \"{streakName}\".",
                "/"
            );
        }

        public async Task<PushSendResult> NotifyStreakReminderAsync(
            string receiverId,
            string senderName,
            string streakName)
        {
            return await SendPushAsync(
                receiverId,
                "Streak reminder",
                $"{senderName} sent a reminder about your " +
                $"\"{streakName}\" streak.",
                "/"
            );
        }

        private async Task<PushSendResult> SendPushAsync(
            string receiverId,
            string title,
            string body,
            string url)
        {
            var subscriptions = await _context.PushSubscriptions
                .Where(p => p.UserId == receiverId)
                .ToListAsync();

            var result = new PushSendResult
            {
                SubscriptionsFound = subscriptions.Count
            };

            if (subscriptions.Count == 0)
            {
                return result;
            }

            var publicKey = _configuration["VapidPublicKey"];
            var privateKey = _configuration["VapidPrivateKey"];
            var subject = _configuration["VapidSubject"];

            if (string.IsNullOrWhiteSpace(publicKey) ||
                string.IsNullOrWhiteSpace(privateKey) ||
                string.IsNullOrWhiteSpace(subject))
            {
                result.Failed = subscriptions.Count;
                result.Errors.Add("Missing VAPID environment variables.");
                return result;
            }

            var payload = JsonSerializer.Serialize(new
            {
                title,
                body,
                url,
                icon = "/pwa-192x192.png",
                badge = "/pwa-192x192.png"
            });

            var vapidDetails = new VapidDetails(
                subject,
                publicKey,
                privateKey
            );

            var client = new WebPushClient();

            foreach (var savedSubscription in subscriptions)
            {
                var subscription = new WebPush.PushSubscription(
                    savedSubscription.Endpoint,
                    savedSubscription.P256dh,
                    savedSubscription.Auth
                );

                try
                {
                    await client.SendNotificationAsync(
                        subscription,
                        payload,
                        vapidDetails
                    );

                    savedSubscription.LastUsedAt = DateTime.UtcNow;
                    result.Sent++;
                }
                catch (WebPushException ex) when (
                    ex.StatusCode == HttpStatusCode.Gone ||
                    ex.StatusCode == HttpStatusCode.NotFound)
                {
                    _context.PushSubscriptions.Remove(savedSubscription);

                    result.Removed++;
                    result.Errors.Add(
                        $"Removed expired subscription. Status: {ex.StatusCode}"
                    );
                }
                catch (WebPushException ex)
                {
                    result.Failed++;
                    result.Errors.Add(
                        $"WebPush error: {ex.StatusCode} - {ex.Message}"
                    );
                }
                catch (Exception ex)
                {
                    result.Failed++;
                    result.Errors.Add(
                        $"Unexpected error: {ex.Message}"
                    );
                }
            }

            await _context.SaveChangesAsync();

            return result;
        }
    }
}