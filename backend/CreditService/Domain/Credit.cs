namespace CreditService.Domain;

public sealed class Credit
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid UserId { get; init; }
    public required string Name { get; set; }
    public required decimal Amount { get; set; }
    public required decimal AnnualInterestRate { get; set; }
    public required int TermMonths { get; set; }
    public required string AmortizationType { get; set; }
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
}
