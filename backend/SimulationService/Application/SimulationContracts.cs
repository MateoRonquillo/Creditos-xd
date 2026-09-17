using SimulationService.Domain;

namespace SimulationService.Application;

public sealed record SimulationRequest(
    Guid? CreditId,
    decimal Amount,
    decimal AnnualInterestRate,
    int TermMonths,
    string AmortizationType);

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

public sealed record CreditSnapshot(
    Guid Id,
    Guid UserId,
    string Name,
    decimal Amount,
    decimal AnnualInterestRate,
    int TermMonths,
    string AmortizationType,
    DateTime CreatedAtUtc);
