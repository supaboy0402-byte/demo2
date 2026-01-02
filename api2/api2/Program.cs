using Microsoft.EntityFrameworkCore;
using api2.Models;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Authentication;
using System;
using System.Linq;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Register DbContext
builder.Services.AddDbContext<MusicStoreDbFinal2Context>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var originsEnv = builder.Configuration["CORS_ORIGINS"] ?? "";
        var origins = originsEnv.Split(new[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries)
                                .Select(s => s.Trim())
                                .Where(s => !string.IsNullOrWhiteSpace(s))
                                .ToArray();
        var defaultOrigins = new[] { "http://localhost:3000", "https://localhost:3000" };
        policy.WithOrigins(origins.Length > 0 ? origins : defaultOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseRouting();
// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();

app.UseCors("Frontend");

app.UseAuthorization();

app.MapControllers();

app.Run();
