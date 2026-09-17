using SimulationService.Domain;

namespace SimulationService.Strategies;

public interface IAmortizationStrategy
{
    string Type { get; }
    IReadOnlyCollection<AmortizationInstallment> BuildSchedule(decimal amount, decimal annualInterestRate, int termMonths);
}
