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