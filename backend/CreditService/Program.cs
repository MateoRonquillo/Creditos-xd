var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<CreditService.Infrastructure.ICreditRepository, CreditService.Infrastructure.InMemoryCreditRepository>();
builder.Services.AddSingleton<CreditService.Infrastructure.TokenUserContext>();
builder.Services.AddScoped<CreditService.Application.CreditApplicationService>();

var app = builder.Build();

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "credit-service" }));

app.Run();
