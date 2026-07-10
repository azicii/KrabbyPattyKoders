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
            int streakDay,
            bool sentMessage,
            bool sentPhoto,
            bool receiverAlreadyCheckedInToday)
        {
            var contentLine = sentMessage && sentPhoto
                ? "\n💬📷 Sent you a message and photo"
                : sentMessage
                    ? "\n💬 Sent you a message"
                    : sentPhoto
                        ? "\n📷 Sent you a photo"
                        : "";

            var notificationTitle = receiverAlreadyCheckedInToday
                ? "🔥 Your partner checked in!"
                : "🔥 Don't leave them hanging!";

            var notificationBody =
                $"{partnerName} completed day {streakDay} of {streakName}.{contentLine}";

            return await SendPushAsync(
                receiverId,
                notificationTitle,
                notificationBody,
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