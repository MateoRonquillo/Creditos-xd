using CreditService.Application;
using CreditService.Infrastructure;
using Microsoft.AspNetCore.Mvc;

namespace CreditService.Controllers;

[ApiController]
[Route("api/credits")]
public sealed class CreditsController(CreditApplicationService credits, TokenUserContext userContext) : ControllerBase
{
    [HttpGet]
    public ActionResult<IReadOnlyCollection<CreditDto>> List()
    {
        var userId = GetUserId();
        return userId is null ? Unauthorized() : Ok(credits.List(userId.Value));
    }

    [HttpGet("{id:guid}")]
    public ActionResult<CreditDto> Get(Guid id)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var credit = credits.Get(userId.Value, id);
        return credit is null ? NotFound() : Ok(credit);
    }

    [HttpPost]
    public ActionResult<CreditDto> Create(CreditRequest request)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var created = credits.Create(userId.Value, request);
            return Created($"/api/credits/{created.Id}", created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public ActionResult<CreditDto> Update(Guid id, CreditRequest request)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var updated = credits.Update(userId.Value, id, request);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        return credits.Delete(userId.Value, id) ? NoContent() : NotFound();
    }

    private Guid? GetUserId() => userContext.GetUserId(Request.Headers.Authorization);
}
