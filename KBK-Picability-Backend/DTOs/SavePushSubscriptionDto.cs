namespace Picability.DTOs
{
    public class SavePushSubscriptionDto
    {
        public string Endpoint { get; set; } = string.Empty;
        public PushSubscriptionKeysDto Keys { get; set; } = new();
    }

    public class PushSubscriptionKeysDto
    {
        public string P256dh { get; set; } = string.Empty;
        public string Auth { get; set; } = string.Empty;
    }
}