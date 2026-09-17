using DocumentService.Services;
using Microsoft.AspNetCore.Mvc;

namespace DocumentService.Controllers;

[ApiController]
[Route("api/documents")]
public sealed class DocumentsController(DocumentApplicationService documents) : ControllerBase
{
    [HttpGet("simulations/{simulationId:guid}")]
    public async Task<IActionResult> DownloadSimulation(Guid simulationId)
    {
        var report = await documents.BuildSimulationReportAsync(simulationId, Request.Headers.Authorization);
        return report is null
            ? NotFound(new { message = "No se pudo generar el documento para la simulacion solicitada." })
            : File(System.Text.Encoding.UTF8.GetBytes(report.Value.Content), "text/csv", report.Value.FileName);
    }
}
