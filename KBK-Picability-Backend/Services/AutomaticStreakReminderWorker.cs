namespace Picability.Services
{
    public class AutomaticStreakReminderWorker
        : BackgroundService
    {
        private readonly IServiceScopeFactory
            _scopeFactory;

        private readonly ILogger<
            AutomaticStreakReminderWorker
        > _logger;

        public AutomaticStreakReminderWorker(
            IServiceScopeFactory scopeFactory,
            ILogger<
                AutomaticStreakReminderWorker
            > logger)
        {
            _scopeFactory =
                scopeFactory;

            _logger =
                logger;
        }

        protected override async Task
            ExecuteAsync(
                CancellationToken
                    stoppingToken)
        {
            while (
                !stoppingToken
                    .IsCancellationRequested
            )
            {
                try
                {
                    using var scope =
                        _scopeFactory
                            .CreateScope();

                    var reminderService =
                        scope.ServiceProvider
                            .GetRequiredService<
                                AutomaticStreakReminderService
                            >();

                    // CHECKIN_30_DAY_BACKGROUND_CLEANUP_V1
                    // Remove expired private content without retaining copies.
                    try
                    {
                        var db = scope.ServiceProvider
                            .GetRequiredService<Picability.Data.ApplicationDbContext>();

                        var cutoff = DateTime.UtcNow.AddDays(-30);

                        await Microsoft.EntityFrameworkCore
                            .RelationalQueryableExtensions
                            .ExecuteDeleteAsync(
                                db.CheckInContents.Where(
                                    content => content.CreatedAt < cutoff
                                ),
                                stoppingToken
                            );
                    }
                    catch (Exception cleanupException)
                    {
                        _logger.LogError(
                            cleanupException,
                            "Expired check-in content cleanup failed."
                        );
                    }

                    // PRIVACY_REPORT_RETENTION_V2
                    try
                    {
                        var reportDb = scope.ServiceProvider
                            .GetRequiredService<Picability.Data.ApplicationDbContext>();

                        var reportCutoff = DateTime.UtcNow.AddDays(-90);

                        await Microsoft.EntityFrameworkCore
                            .RelationalQueryableExtensions
                            .ExecuteDeleteAsync(
                                reportDb.ContentReports.Where(
                                    report => report.CreatedAt < reportCutoff
                                ),
                                stoppingToken
                            );
                    }
                    catch (Exception reportCleanupException)
                    {
                        _logger.LogError(
                            reportCleanupException,
                            "Moderation report cleanup failed."
                        );
                    }
                    await reminderService
                        .ProcessDueRemindersAsync(
                            stoppingToken
                        );
}
                catch (
                    OperationCanceledException
                ) when (
                    stoppingToken
                        .IsCancellationRequested
                )
                {
                    break;
                }
                catch (Exception exception)
                {
                    _logger.LogError(
                        exception,
                        "Automatic streak reminder processing failed."
                    );
                }

                try
                {
                    await Task.Delay(
                        TimeSpan.FromMinutes(
                            10
                        ),
                        stoppingToken
                    );
                }
                catch (
                    OperationCanceledException
                ) when (
                    stoppingToken
                        .IsCancellationRequested
                )
                {
                    break;
                }
            }
        }
    }
}