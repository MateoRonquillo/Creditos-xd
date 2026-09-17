using System.Net.Http.Headers;
using System.Net.Http.Json;
using SimulationService.Domain;
using SimulationService.Infrastructure;
using SimulationService.Strategies;

namespace SimulationService.Application;

public sealed class SimulationApplicationService(
    ISimulationRepository simulations,
    FrenchAmortizationStrategy french,
    GermanAmortizationStrategy german,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration)
{
    public async Task<SimulationDto> SimulateAsync(Guid userId, string? authorization, SimulationRequest request)
    {
        var input = request;
        if (request.CreditId is not null)
        {
            var credit = await GetCreditAsync(request.CreditId.Value, authorization);
            if (credit is null)
            {
                throw new KeyNotFoundException("No se encontro el credito solicitado.");
            }

            input = new SimulationRequest(credit.Id, credit.Amount, credit.AnnualInterestRate, credit.TermMonths, credit.AmortizationType);
        }

        Validate(input);
        var strategy = ResolveStrategy(input.AmortizationType);
        var schedule = strategy.BuildSchedule(input.Amount, input.AnnualInterestRate, input.TermMonths);
        var totalPayment = schedule.Sum(row => row.Payment);
        var simulation = new Simulation
        {
            UserId = userId,
            CreditId = input.CreditId,
            Amount = input.Amount,
            AnnualInterestRate = input.AnnualInterestRate,
            TermMonths = input.TermMonths,
            AmortizationType = strategy.Type,
            TotalInterest = Math.Round(schedule.Sum(row => row.Interest), 2, MidpointRounding.AwayFromZero),
            TotalPayment = Math.Round(totalPayment, 2, MidpointRounding.AwayFromZero),
            Schedule = schedule
        };

        simulations.Add(simulation);
        return ToDto(simulation);
    }

    public IReadOnlyCollection<SimulationDto> List(Guid userId) =>
        simulations.ListByUser(userId).Select(ToDto).OrderByDescending(simulation => simulation.CreatedAtUtc).ToArray();

    public SimulationDto? Get(Guid userId, Guid id)
    {
        var simulation = simulations.Find(userId, id);
        return simulation is null ? null : ToDto(simulation);
    }

    private async Task<CreditSnapshot?> GetCreditAsync(Guid creditId, string? authorization)
    {
        var baseUrl = configuration["Services:Credits"] ?? "http://credit-service:8080";
        var client = httpClientFactory.CreateClient();
        if (!string.IsNullOrWhiteSpace(authorization))
        {
            client.DefaultRequestHeaders.Authorization = AuthenticationHeaderValue.Parse(authorization);
        }

        try
        {
            return await client.GetFromJsonAsync<CreditSnapshot>($"{baseUrl}/api/credits/{creditId}");
        }
        catch (HttpRequestException)
        {
            return null;
        }
    }

    private IAmortizationStrategy ResolveStrategy(string amortizationType)
    {
        var value = amortizationType.Trim().ToLowerInvariant();
        return value switch
        {
            "french" or "frances" or "francesa" => french,
            "german" or "aleman" or "alemana" => german,
            _ => throw new InvalidOperationException("Tipo de amortizacion no soportado. Use french o german.")
        };
    }

    private static void Validate(SimulationRequest request)
    {
        if (request.Amount <= 0 || request.AnnualInterestRate < 0 || request.TermMonths <= 0)
        {
            throw new InvalidOperationException("Monto, tasa y plazo deben ser valores validos.");
        }
    }

    private static SimulationDto ToDto(Simulation simulation) =>
        new(
            simulation.Id,
            simulation.UserId,
            simulation.CreditId,
            simulation.Amount,
            simulation.AnnualInterestRate,
            simulation.TermMonths,
            simulation.AmortizationType,
            simulation.TotalInterest,
            simulation.TotalPayment,
            simulation.Schedule,
            simulation.CreatedAtUtc);
}
