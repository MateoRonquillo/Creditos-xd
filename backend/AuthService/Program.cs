var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<AuthService.Infrastructure.IUserRepository, AuthService.Infrastructure.InMemoryUserRepository>();
builder.Services.AddSingleton<AuthService.Application.PasswordHasher>();
builder.Services.AddSingleton<AuthService.Application.TokenService>();
builder.Services.AddScoped<AuthService.Application.AuthApplicationService>();

var app = builder.Build();

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "auth-service" }));

app.Run();
