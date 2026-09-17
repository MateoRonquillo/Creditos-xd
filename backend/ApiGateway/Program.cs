var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:3000"];
        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddHttpClient();

var app = builder.Build();

app.UseCors();

app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "api-gateway" }));
app.MapMethods("/api/{service}/{**path}", ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], ProxyAsync);

app.Run();

static async Task<IResult> ProxyAsync(
    string service,
    string? path,
    HttpContext context,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration)
{
    if (HttpMethods.IsOptions(context.Request.Method))
    {
        return Results.Ok();
    }

    var targetBase = ResolveServiceBaseUrl(service, configuration);
    if (targetBase is null)
    {
        return Results.NotFound(new { message = "Servicio no registrado en el gateway." });
    }

    var targetUri = BuildTargetUri(targetBase, service, path, context.Request.QueryString.Value);
    using var request = new HttpRequestMessage(new HttpMethod(context.Request.Method), targetUri);

    foreach (var header in context.Request.Headers)
    {
        if (!request.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray()))
        {
            request.Content ??= new StreamContent(context.Request.Body);
            request.Content.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
        }
    }

    if (context.Request.ContentLength > 0 && request.Content is null)
    {
        request.Content = new StreamContent(context.Request.Body);
        if (!string.IsNullOrWhiteSpace(context.Request.ContentType))
        {
            request.Content.Headers.TryAddWithoutValidation("Content-Type", context.Request.ContentType);
        }
    }

    var client = httpClientFactory.CreateClient();
    using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, context.RequestAborted);

    context.Response.StatusCode = (int)response.StatusCode;
    foreach (var header in response.Headers)
    {
        context.Response.Headers[header.Key] = header.Value.ToArray();
    }

    foreach (var header in response.Content.Headers)
    {
        context.Response.Headers[header.Key] = header.Value.ToArray();
    }

    context.Response.Headers.Remove("transfer-encoding");
    await response.Content.CopyToAsync(context.Response.Body, context.RequestAborted);
    return Results.Empty;
}

static string? ResolveServiceBaseUrl(string service, IConfiguration configuration) =>
    service.ToLowerInvariant() switch
    {
        "auth" => configuration["Services:Auth"],
        "credits" => configuration["Services:Credits"],
        "simulations" => configuration["Services:Simulations"],
        "documents" => configuration["Services:Documents"],
        _ => null
    };

static string BuildTargetUri(string targetBase, string service, string? path, string? queryString)
{
    var normalizedPath = string.IsNullOrWhiteSpace(path) ? string.Empty : $"/{path}";
    return $"{targetBase.TrimEnd('/')}/api/{service}{normalizedPath}{queryString}";
}
