using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;

namespace DocumentService.Services;

public sealed class DocumentApplicationService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
{
    public async Task<(string FileName, string Content)?> BuildSimulationReportAsync(Guid simulationId, string? authorization)
    {
        var baseUrl = configuration["Services:Simulations"] ?? "http://simulation-service:8080";
        var client = httpClientFactory.CreateClient();
        if (!string.IsNullOrWhiteSpace(authorization))
        {
            client.DefaultRequestHeaders.Authorization = AuthenticationHeaderValue.Parse(authorization);
        }

        SimulationDto? simulation;
        try
        {
            simulation = await client.GetFromJsonAsync<SimulationDto>($"{baseUrl}/api/simulations/{simulationId}");
        }
        catch (HttpRequestException)
        {
            return null;
        }

        if (simulation is null)
        {
            return null;
        }

        var content = new StringBuilder();
        content.AppendLine("Simulador de Creditos - Reporte de Simulacion");
        content.AppendLine($"Simulacion: {simulation.Id}");
        content.AppendLine($"Fecha UTC: {simulation.CreatedAtUtc:O}");
        content.AppendLine($"Monto: {simulation.Amount:N2}");
        content.AppendLine($"Tasa anual: {simulation.AnnualInterestRate:N2}%");
        content.AppendLine($"Plazo: {simulation.TermMonths} meses");
        content.AppendLine($"Amortizacion: {simulation.AmortizationType}");
        content.AppendLine($"Interes total: {simulation.TotalInterest:N2}");
        content.AppendLine($"Pago total: {simulation.TotalPayment:N2}");
        content.AppendLine();
        content.AppendLine("Periodo,Pago,Capital,Interes,Saldo");

        foreach (var row in simulation.Schedule)
        {
            content.AppendLine($"{row.Period},{row.Payment:N2},{row.Principal:N2},{row.Interest:N2},{row.Balance:N2}");
        }

        return ($"simulacion-{simulation.Id}.csv", content.ToString());
    }
}
