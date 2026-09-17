using AuthService.Application;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(AuthApplicationService auth) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        try
        {
            return Created("/api/auth/me", await auth.RegisterAsync(request));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var response = await auth.LoginAsync(request);
        return response is null ? Unauthorized(new { message = "Credenciales invalidas." }) : Ok(response);
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var user = await auth.GetMeAsync(Request.Headers.Authorization);
        return user is null ? Unauthorized(new { message = "Token invalido o expirado." }) : Ok(user);
    }
}
