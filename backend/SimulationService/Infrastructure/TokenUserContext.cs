using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace SimulationService.Infrastructure;

public sealed class TokenUserContext(IConfiguration configuration)
{
    private readonly string _key = configuration["Jwt:Key"] ?? "CAMBIAR_ESTA_CLAVE_JWT_LOCAL_DE_AL_MENOS_32_CARACTERES";

    public Guid? GetUserId(string? authorization)
    {
        var token = ExtractBearer(authorization);
        if (token is null)
        {
            return null;
        }

        var parts = token.Split('.');
        if (parts.Length != 3 || !CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(Sign($"{parts[0]}.{parts[1]}")),
                Encoding.UTF8.GetBytes(parts[2])))
        {
            return null;
        }

        using var doc = JsonDocument.Parse(Base64UrlDecode(parts[1]));
        var root = doc.RootElement;
        if (!root.TryGetProperty("exp", out var exp) ||
            exp.GetInt64() < DateTimeOffset.UtcNow.ToUnixTimeSeconds() ||
            !root.TryGetProperty("sub", out var sub) ||
            !Guid.TryParse(sub.GetString(), out var userId))
        {
            return null;
        }

        return userId;
    }

    private static string? ExtractBearer(string? authorization)
    {
        const string prefix = "Bearer ";
        return authorization?.StartsWith(prefix, StringComparison.OrdinalIgnoreCase) == true
            ? authorization[prefix.Length..].Trim()
            : null;
    }

    private string Sign(string value)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_key));
        return Base64Url(hmac.ComputeHash(Encoding.UTF8.GetBytes(value)));
    }

    private static string Base64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] Base64UrlDecode(string value)
    {
        var padded = value.Replace('-', '+').Replace('_', '/');
        padded = padded.PadRight(padded.Length + (4 - padded.Length % 4) % 4, '=');
        return Convert.FromBase64String(padded);
    }
}
