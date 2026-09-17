using AuthService.Domain;
using AuthService.Infrastructure;

namespace AuthService.Application;

public sealed class AuthApplicationService(
    IUserRepository users,
    PasswordHasher passwordHasher,
    TokenService tokens)
{
    public Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var email = NormalizeEmail(request.Email);
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(email) || request.Password.Length < 6)
        {
            throw new InvalidOperationException("Nombre, email y password de al menos 6 caracteres son obligatorios.");
        }

        if (users.FindByEmail(email) is not null)
        {
            throw new InvalidOperationException("Ya existe un usuario con ese email.");
        }

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = email,
            PasswordHash = passwordHasher.Hash(request.Password)
        };
        users.Add(user);
        return Task.FromResult(ToAuthResponse(user));
    }

    public Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = users.FindByEmail(NormalizeEmail(request.Email));
        if (user is null || !passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            return Task.FromResult<AuthResponse?>(null);
        }

        return Task.FromResult<AuthResponse?>(ToAuthResponse(user));
    }

    public Task<UserDto?> GetMeAsync(string? authorization)
    {
        var userId = tokens.ValidateAndGetUserId(authorization);
        var user = userId is null ? null : users.FindById(userId.Value);
        return Task.FromResult(user is null ? null : ToDto(user));
    }

    private AuthResponse ToAuthResponse(User user) => new(tokens.Create(user), ToDto(user));

    private static UserDto ToDto(User user) => new(user.Id, user.Name, user.Email, user.CreatedAtUtc);

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
