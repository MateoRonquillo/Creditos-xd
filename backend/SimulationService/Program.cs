var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddSingleton<SimulationService.Infrastructure.ISimulationRepository, SimulationService.Infrastructure.SqlSimulationRepository>();
builder.Services.AddSingleton<SimulationService.Infrastructure.TokenUserContext>();
builder.Services.AddSingleton<SimulationService.Strategies.FrenchAmortizationStrategy>();
builder.Services.AddSingleton<SimulationService.Strategies.GermanAmortizationStrategy>();
builder.Services.AddScoped<SimulationService.Application.SimulationApplicationService>();

var app = builder.Build();

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "simulation-service" }));

app.Run();
