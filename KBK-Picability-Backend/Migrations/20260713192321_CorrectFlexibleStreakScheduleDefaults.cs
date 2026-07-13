using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KBK___Picability.Migrations
{
    /// <inheritdoc />
    public partial class CorrectFlexibleStreakScheduleDefaults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "RequiredCheckIns",
                table: "Streaks",
                type: "integer",
                nullable: false,
                defaultValue: 1,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "CycleUnit",
                table: "Streaks",
                type: "text",
                nullable: false,
                defaultValue: "Day",
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<int>(
                name: "CycleLength",
                table: "Streaks",
                type: "integer",
                nullable: false,
                defaultValue: 1,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "RequiredCheckIns",
                table: "StreakRequests",
                type: "integer",
                nullable: false,
                defaultValue: 1,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "CycleUnit",
                table: "StreakRequests",
                type: "text",
                nullable: false,
                defaultValue: "Day",
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<int>(
                name: "CycleLength",
                table: "StreakRequests",
                type: "integer",
                nullable: false,
                defaultValue: 1,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.Sql(
    """
    UPDATE "Streaks"
    SET "RequiredCheckIns" = 1
    WHERE "RequiredCheckIns" <= 0;
    """
);

            migrationBuilder.Sql(
                """
    UPDATE "Streaks"
    SET "CycleLength" = 1
    WHERE "CycleLength" <= 0;
    """
            );

            migrationBuilder.Sql(
                """
    UPDATE "Streaks"
    SET "CycleUnit" = 'Day'
    WHERE "CycleUnit" IS NULL
       OR BTRIM("CycleUnit") = '';
    """
            );

            migrationBuilder.Sql(
                """
    UPDATE "StreakRequests"
    SET "RequiredCheckIns" = 1
    WHERE "RequiredCheckIns" <= 0;
    """
            );

            migrationBuilder.Sql(
                """
    UPDATE "StreakRequests"
    SET "CycleLength" = 1
    WHERE "CycleLength" <= 0;
    """
            );

            migrationBuilder.Sql(
                """
    UPDATE "StreakRequests"
    SET "CycleUnit" = 'Day'
    WHERE "CycleUnit" IS NULL
       OR BTRIM("CycleUnit") = '';
    """
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "RequiredCheckIns",
                table: "Streaks",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 1);

            migrationBuilder.AlterColumn<string>(
                name: "CycleUnit",
                table: "Streaks",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "Day");

            migrationBuilder.AlterColumn<int>(
                name: "CycleLength",
                table: "Streaks",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 1);

            migrationBuilder.AlterColumn<int>(
                name: "RequiredCheckIns",
                table: "StreakRequests",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 1);

            migrationBuilder.AlterColumn<string>(
                name: "CycleUnit",
                table: "StreakRequests",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "Day");

            migrationBuilder.AlterColumn<int>(
                name: "CycleLength",
                table: "StreakRequests",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 1);
        }
    }
}
