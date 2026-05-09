using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.Models;

var builder = WebApplication.CreateBuilder(args);

// Add CORS Policy - Allows React to talk to the API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:3000") // Common React ports
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// Add database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS policy
app.UseCors("AllowReactApp");

// Commenting out HttpsRedirection for easier local dev 
// app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();