using Microsoft.Data.SqlClient;
using SimulationService.Domain;

namespace SimulationService.Infrastructure;

public sealed class SqlSimulationRepository(IConfiguration configuration) : ISimulationRepository
{
    private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("DefaultConnection is not configured.");

    public void Add(Simulation simulation)
    {
        using var connection = OpenConnection();
        using var transaction = connection.BeginTransaction();

        try
        {
            using (var command = connection.CreateCommand())
            {
                command.Transaction = transaction;
                command.CommandText = """
                    INSERT INTO Simulations (Id, UserId, CreditId, Amount, AnnualInterestRate, TermMonths, AmortizationType, TotalInterest, TotalPayment, CreatedAtUtc)
                    VALUES (@Id, @UserId, @CreditId, @Amount, @AnnualInterestRate, @TermMonths, @AmortizationType, @TotalInterest, @TotalPayment, @CreatedAtUtc);
                    """;
                AddSimulationParameters(command, simulation);
                command.ExecuteNonQuery();
            }

            foreach (var installment in simulation.Schedule)
            {
                using var command = connection.CreateCommand();
                command.Transaction = transaction;
                command.CommandText = """
                    INSERT INTO AmortizationInstallments (SimulationId, Period, Payment, Principal, Interest, Balance)
                    VALUES (@SimulationId, @Period, @Payment, @Principal, @Interest, @Balance);
                    """;
                command.Parameters.AddWithValue("@SimulationId", simulation.Id);
                command.Parameters.AddWithValue("@Period", installment.Period);
                command.Parameters.AddWithValue("@Payment", installment.Payment);
                command.Parameters.AddWithValue("@Principal", installment.Principal);
                command.Parameters.AddWithValue("@Interest", installment.Interest);
                command.Parameters.AddWithValue("@Balance", installment.Balance);
                command.ExecuteNonQuery();
            }

            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public Simulation? Find(Guid userId, Guid id)
    {
        using var connection = OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT Id, UserId, CreditId, Amount, AnnualInterestRate, TermMonths, AmortizationType, TotalInterest, TotalPayment, CreatedAtUtc
            FROM Simulations
            WHERE UserId = @UserId AND Id = @Id;
            """;
        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@Id", id);

        using var reader = command.ExecuteReader();
        if (!reader.Read())
        {
            return null;
        }

        var simulation = ReadSimulation(reader);
        reader.Close();
        simulation.Schedule = ReadSchedule(connection, simulation.Id);
        return simulation;
    }

    public IReadOnlyCollection<Simulation> ListByUser(Guid userId)
    {
        using var connection = OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT Id, UserId, CreditId, Amount, AnnualInterestRate, TermMonths, AmortizationType, TotalInterest, TotalPayment, CreatedAtUtc
            FROM Simulations
            WHERE UserId = @UserId
            ORDER BY CreatedAtUtc DESC;
            """;
        command.Parameters.AddWithValue("@UserId", userId);

        using var reader = command.ExecuteReader();
        var simulations = new List<Simulation>();
        while (reader.Read())
        {
            simulations.Add(ReadSimulation(reader));
        }
        reader.Close();

        foreach (var simulation in simulations)
        {
            simulation.Schedule = ReadSchedule(connection, simulation.Id);
        }

        return simulations;
    }

    private static void AddSimulationParameters(SqlCommand command, Simulation simulation)
    {
        command.Parameters.AddWithValue("@Id", simulation.Id);
        command.Parameters.AddWithValue("@UserId", simulation.UserId);
        command.Parameters.AddWithValue("@CreditId", (object?)simulation.CreditId ?? DBNull.Value);
        command.Parameters.AddWithValue("@Amount", simulation.Amount);
        command.Parameters.AddWithValue("@AnnualInterestRate", simulation.AnnualInterestRate);
        command.Parameters.AddWithValue("@TermMonths", simulation.TermMonths);
        command.Parameters.AddWithValue("@AmortizationType", simulation.AmortizationType);
        command.Parameters.AddWithValue("@TotalInterest", simulation.TotalInterest);
        command.Parameters.AddWithValue("@TotalPayment", simulation.TotalPayment);
        command.Parameters.AddWithValue("@CreatedAtUtc", simulation.CreatedAtUtc);
    }

    private static Simulation ReadSimulation(SqlDataReader reader) => new()
    {
        Id = reader.GetGuid(0),
        UserId = reader.GetGuid(1),
        CreditId = reader.IsDBNull(2) ? null : reader.GetGuid(2),
        Amount = reader.GetDecimal(3),
        AnnualInterestRate = reader.GetDecimal(4),
        TermMonths = reader.GetInt32(5),
        AmortizationType = reader.GetString(6),
        TotalInterest = reader.GetDecimal(7),
        TotalPayment = reader.GetDecimal(8),
        CreatedAtUtc = reader.GetDateTime(9),
        Schedule = []
    };

    private static IReadOnlyCollection<AmortizationInstallment> ReadSchedule(SqlConnection connection, Guid simulationId)
    {
        using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT Period, Payment, Principal, Interest, Balance
            FROM AmortizationInstallments
            WHERE SimulationId = @SimulationId
            ORDER BY Period;
            """;
        command.Parameters.AddWithValue("@SimulationId", simulationId);

        using var reader = command.ExecuteReader();
        var schedule = new List<AmortizationInstallment>();
        while (reader.Read())
        {
            schedule.Add(new AmortizationInstallment(
                reader.GetInt32(0),
                reader.GetDecimal(1),
                reader.GetDecimal(2),
                reader.GetDecimal(3),
                reader.GetDecimal(4)));
        }

        return schedule;
    }

    private SqlConnection OpenConnection()
    {
        var connection = new SqlConnection(_connectionString);
        connection.Open();
        return connection;
    }
}
