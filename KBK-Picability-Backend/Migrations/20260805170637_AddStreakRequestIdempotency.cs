using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KBK___Picability.Migrations
{
    /// <inheritdoc />
    public partial class AddStreakRequestIdempotency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_StreakRequests_SenderId",
                table: "StreakRequests");

            migrationBuilder.AddColumn<string>(
                name: "ClientRequestId",
                table: "StreakRequests",
                type: "text",
                nullable: true);

            /*
             * Give every existing request a unique legacy identifier
             * before enforcing the required unique value.
             */
            migrationBuilder.Sql(
                """
        UPDATE "StreakRequests"
        SET "ClientRequestId" =
            'legacy-' || "Id"::text
        WHERE "ClientRequestId" IS NULL;
        """
            );

            migrationBuilder.AlterColumn<string>(
                name: "ClientRequestId",
                table: "StreakRequests",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StreakRequests_SenderId_ClientRequestId",
                table: "StreakRequests",
                columns: new[]
                {
            "SenderId",
            "ClientRequestId"
                },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_StreakRequests_SenderId_ClientRequestId",
                table: "StreakRequests");

            migrationBuilder.DropColumn(
                name: "ClientRequestId",
                table: "StreakRequests");

            migrationBuilder.CreateIndex(
                name: "IX_StreakRequests_SenderId",
                table: "StreakRequests",
                column: "SenderId");
        }
    }
}
