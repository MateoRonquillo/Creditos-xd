namespace AuthService.Application;

public sealed record RegisterRequest(string Name, string Email, string Password);

public sealed record LoginRequest(string Email, string Password);

public sealed record AuthResponse(string Token, UserDto User);

public sealed record UserDto(Guid Id, string Name, string Email, DateTime CreatedAtUtc);
