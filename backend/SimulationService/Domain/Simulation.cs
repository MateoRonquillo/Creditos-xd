namespace SimulationService.Domain;

public sealed class Simulation
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid UserId { get; init; }
    public Guid? CreditId { get; init; }
    public required decimal Amount { get; init; }
    public required decimal AnnualInterestRate { get; init; }
    public required int TermMonths { get; init; }
    public required string AmortizationType { get; init; }
    public required decimal TotalInterest { get; init; }
    public required decimal TotalPayment { get; init; }
    public required IReadOnlyCollection<AmortizationInstallment> Schedule { get; init; }
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
}

public sealed record AmortizationInstallment(
    int Period,
    decimal Payment,
    decimal Principal,
    decimal Interest,
    decimal Balance);
