namespace Picability.Services
{
    public static class StreakyIdentity
    {
        public const string UserId =
            "picability-system-streaky";

        public const string UserName =
            "Streaky";

        public const string Email =
            "streaky@picability.app";

        public static bool IsStreaky(
            string? userId)
        {
            return string.Equals(
                userId,
                UserId,
                StringComparison.Ordinal
            );
        }
    }
}