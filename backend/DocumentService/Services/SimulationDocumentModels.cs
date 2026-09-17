namespace DocumentService.Services;

public sealed record SimulationDto(
    Guid Id,
    Guid UserId,
    Guid? CreditId,
    decimal Amount,
    decimal AnnualInterestRate,
    int TermMonths,
    string AmortizationType,
    decimal TotalInterest,
    decimal TotalPayment,
    IReadOnlyCollection<AmortizationInstallment> Schedule,
    DateTime CreatedAtUtc);

public sealed record AmortizationInstallment(
    int Period,
    decimal Payment,
    decimal Principal,
    decimal Interest,
    decimal Balance);
