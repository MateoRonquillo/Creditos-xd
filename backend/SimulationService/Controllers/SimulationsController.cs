using Microsoft.AspNetCore.Mvc;
using SimulationService.Application;
using SimulationService.Infrastructure;

namespace SimulationService.Controllers;

[ApiController]
[Route("api/simulations")]
public sealed class SimulationsController(SimulationApplicationService simulations, TokenUserContext userContext) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<SimulationDto>> Simulate(SimulationRequest request)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var simulation = await simulations.SimulateAsync(userId.Value, Request.Headers.Authorization, request);
            return Created($"/api/simulations/{simulation.Id}", simulation);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("history")]
    public ActionResult<IReadOnlyCollection<SimulationDto>> History()
    {
        var userId = GetUserId();
        return userId is null ? Unauthorized() : Ok(simulations.List(userId.Value));
    }

    [HttpGet("{id:guid}")]
    public ActionResult<SimulationDto> Get(Guid id)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var simulation = simulations.Get(userId.Value, id);
        return simulation is null ? NotFound() : Ok(simulation);
    }

    private Guid? GetUserId() => userContext.GetUserId(Request.Headers.Authorization);
}
