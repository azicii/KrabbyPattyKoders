using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using WebPush;

namespace Picability.Services
{
    public class PushNotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public PushNotificationService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task NotifyPartnerCheckedInAsync(
            string receiverId,
            string partnerName,
            string streakName,
            int streakDay,
            bool sentMessage,
            bool sentPhoto)
        {
            var subscriptions = await _context.PushSubscriptions
                .Where(p => p.UserId == receiverId)
                .ToListAsync();

            if (subscriptions.Count == 0)
                return;

            var publicKey = _configuration["VapidPublicKey"];
            var privateKey = _configuration["VapidPrivateKey"];
            var subject = _configuration["VapidSubject"];

            if (string.IsNullOrWhiteSpace(publicKey) ||
                string.IsNullOrWhiteSpace(privateKey) ||
                string.IsNullOrWhiteSpace(subject))
            {
                return;
            }

            var contentLine = sentMessage && sentPhoto
                ? "\n💬📷 Sent you a message and photo"
                : sentMessage
                    ? "\n💬 Sent you a message"
                    : sentPhoto
                        ? "\n📷 Sent you a photo"
                        : "";

            var payload = JsonSerializer.Serialize(new
            {
                title = "🔥 Don't leave them hanging!",
                body = $"{partnerName} completed day {streakDay} of {streakName}.{contentLine}",
                url = "/",
                icon = "/pwa-192x192.png",
                badge = "/pwa-192x192.png"
            });

            var vapidDetails = new VapidDetails(subject, publicKey, privateKey);
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
                    await client.SendNotificationAsync(subscription, payload, vapidDetails);
                    savedSubscription.LastUsedAt = DateTime.UtcNow;
                }
                catch (WebPushException ex) when (
                    ex.StatusCode == HttpStatusCode.Gone ||
                    ex.StatusCode == HttpStatusCode.NotFound)
                {
                    _context.PushSubscriptions.Remove(savedSubscription);
                }
                catch
                {
                    // Do not block streak completion if push fails.
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}