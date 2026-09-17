using SimulationService.Domain;

namespace SimulationService.Strategies;

public sealed class FrenchAmortizationStrategy : IAmortizationStrategy
{
    public string Type => "french";

    public IReadOnlyCollection<AmortizationInstallment> BuildSchedule(decimal amount, decimal annualInterestRate, int termMonths)
    {
        var monthlyRate = annualInterestRate / 100m / 12m;
        var payment = monthlyRate == 0
            ? amount / termMonths
            : amount * monthlyRate / (1 - (decimal)Math.Pow((double)(1 + monthlyRate), -termMonths));

        var balance = amount;
        var schedule = new List<AmortizationInstallment>(termMonths);

        for (var period = 1; period <= termMonths; period++)
        {
            var interest = balance * monthlyRate;
            var principal = payment - interest;
            if (period == termMonths)
            {
                principal = balance;
                payment = principal + interest;
            }

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
