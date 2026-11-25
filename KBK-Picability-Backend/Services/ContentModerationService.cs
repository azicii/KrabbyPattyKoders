using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Picability.Services
{
    public static class ContentModerationService
    {
        /*
         * PICABILITY_CONTENT_FILTER_V1
         *
         * Intentionally narrow starter list.
         * Ordinary profanity is not prohibited.
         *
         * Add severe objectionable words or phrases
         * here as moderation needs evolve.
         */

        private static readonly string[] ProhibitedTerms =
        {
            "nigger",
            "niggers",
            "kike",
            "kikes",
            "faggot",
            "faggots",
            "chink",
            "chinks",
            "kill yourself",
            "go kill yourself",
            "i will rape you",
            "i will murder you",
            "child pornography",
            "child porn"
        };

        private static readonly Regex ProhibitedPattern =
            new Regex(
                @"(?<![\p{L}\p{N}])(?:" +
                string.Join(
                    "|",
                    ProhibitedTerms.Select(term =>
                        Regex.Escape(Normalize(term))
                            .Replace(@"\ ", @"\s+")
                    )
                ) +
                @")(?![\p{L}\p{N}])",
                RegexOptions.IgnoreCase |
                RegexOptions.CultureInvariant |
                RegexOptions.Compiled,
                TimeSpan.FromMilliseconds(250)
            );

        private static string Normalize(string value)
        {
            var normalized =
                value.Normalize(NormalizationForm.FormKC);

            var builder = new StringBuilder(normalized.Length);

            foreach (var character in normalized)
            {
                if (char.GetUnicodeCategory(character) ==
                    UnicodeCategory.Format)
                {
                    continue;
                }

                builder.Append(character);
            }

            return builder.ToString();
        }

        public static bool ContainsProhibitedContent(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return false;

            try
            {
                return ProhibitedPattern.IsMatch(
                    Normalize(value)
                );
            }
            catch (RegexMatchTimeoutException)
            {
                return true;
            }
            catch (ArgumentException)
            {
                return true;
            }
        }
    }
}