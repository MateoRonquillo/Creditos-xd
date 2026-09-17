using SimulationService.Domain;

namespace SimulationService.Strategies;

public sealed class GermanAmortizationStrategy : IAmortizationStrategy
{
    public string Type => "german";

    public IReadOnlyCollection<AmortizationInstallment> BuildSchedule(decimal amount, decimal annualInterestRate, int termMonths)
    {
        var monthlyRate = annualInterestRate / 100m / 12m;
        var fixedPrincipal = amount / termMonths;
        var balance = amount;
        var schedule = new List<AmortizationInstallment>(termMonths);

        for (var period = 1; period <= termMonths; period++)
        {
            var interest = balance * monthlyRate;
            var principal = period == termMonths ? balance : fixedPrincipal;
            var payment = principal + interest;
            balance -= principal;

            schedule.Add(new AmortizationInstallment(
                period,
                RoundMoney(payment),
                RoundMoney(principal),
                RoundMoney(interest),
                RoundMoney(Math.Max(balance, 0))));
        }

        return schedule;
    }

    private static decimal RoundMoney(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);
}
