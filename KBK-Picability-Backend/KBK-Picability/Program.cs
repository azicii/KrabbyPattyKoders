using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.Models;

// Here we connect app to database
// also enable email/password auth
var builder = WebApplication.CreateBuilder(args);

// ADD CORS POLICY 
// This tells the server to allow requests coming from React app
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173") // Vite/React port
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// Add database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options => 
{
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// --- 2. ENABLE CORS ---
// This must be placed after builder.Build() but before MapControllers()
app.UseCors("AllowReactApp");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Commented out to avoid local SSL/HTTPS certificate issues during development
// app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();