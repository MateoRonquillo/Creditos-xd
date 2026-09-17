using CreditService.Domain;
using CreditService.Infrastructure;

namespace CreditService.Application;

public sealed class CreditApplicationService(ICreditRepository credits)
{
    public IReadOnlyCollection<CreditDto> List(Guid userId) =>
        credits.ListByUser(userId).Select(ToDto).OrderByDescending(credit => credit.CreatedAtUtc).ToArray();

    public CreditDto? Get(Guid userId, Guid id)
    {
        var credit = credits.Find(userId, id);
        return credit is null ? null : ToDto(credit);
    }

    public CreditDto Create(Guid userId, CreditRequest request)
    {
        Validate(request);
        var credit = new Credit
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Amount = request.Amount,
            AnnualInterestRate = request.AnnualInterestRate,
            TermMonths = request.TermMonths,
            AmortizationType = NormalizeAmortization(request.AmortizationType)
        };

        credits.Upsert(credit);
        return ToDto(credit);
    }

    public CreditDto? Update(Guid userId, Guid id, CreditRequest request)
    {
        Validate(request);
        var credit = credits.Find(userId, id);
        if (credit is null)
        {
            return null;
        }

        credit.Name = request.Name.Trim();
        credit.Amount = request.Amount;
        credit.AnnualInterestRate = request.AnnualInterestRate;
        credit.TermMonths = request.TermMonths;
        credit.AmortizationType = NormalizeAmortization(request.AmortizationType);
        credits.Upsert(credit);
        return ToDto(credit);
    }

    public bool Delete(Guid userId, Guid id) => credits.Delete(userId, id);

    private static void Validate(CreditRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new InvalidOperationException("El nombre del credito es obligatorio.");
        }

        if (request.Amount <= 0 || request.AnnualInterestRate < 0 || request.TermMonths <= 0)
        {
            throw new InvalidOperationException("Monto, tasa y plazo deben ser valores validos.");
        }

        NormalizeAmortization(request.AmortizationType);
    }

    private static string NormalizeAmortization(string amortizationType)
    {
        var value = amortizationType.Trim().ToLowerInvariant();
        return value switch
        {
            "french" or "frances" or "francesa" => "french",
            "german" or "aleman" or "alemana" => "german",
            _ => throw new InvalidOperationException("Tipo de amortizacion no soportado. Use french o german.")
        };
    }

    private static CreditDto ToDto(Credit credit) =>
        new(credit.Id, credit.UserId, credit.Name, credit.Amount, credit.AnnualInterestRate, credit.TermMonths, credit.AmortizationType, credit.CreatedAtUtc);
}
