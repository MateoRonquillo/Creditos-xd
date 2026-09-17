namespace CreditService.Application;

public sealed record CreditRequest(
    string Name,
    decimal Amount,
    decimal AnnualInterestRate,
    int TermMonths,
    string AmortizationType);

public sealed record CreditDto(
    Guid Id,
    Guid UserId,
    string Name,
    decimal Amount,
    decimal AnnualInterestRate,
    int TermMonths,
    string AmortizationType,
    DateTime CreatedAtUtc);
