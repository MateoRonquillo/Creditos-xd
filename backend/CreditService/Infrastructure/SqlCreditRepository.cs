using CreditService.Domain;
using Microsoft.Data.SqlClient;

namespace CreditService.Infrastructure;

public sealed class SqlCreditRepository(IConfiguration configuration) : ICreditRepository
{
    private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("DefaultConnection is not configured.");

    public IReadOnlyCollection<Credit> ListByUser(Guid userId)
    {
        using var connection = OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT Id, UserId, Name, Amount, AnnualInterestRate, TermMonths, AmortizationType, CreatedAtUtc
            FROM Credits
            WHERE UserId = @UserId
            ORDER BY CreatedAtUtc DESC;
            """;
        command.Parameters.AddWithValue("@UserId", userId);

        using var reader = command.ExecuteReader();
        var credits = new List<Credit>();
        while (reader.Read())
        {
            credits.Add(ReadCredit(reader));
        }

        return credits;
    }

    public Credit? Find(Guid userId, Guid id)
    {
        using var connection = OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT Id, UserId, Name, Amount, AnnualInterestRate, TermMonths, AmortizationType, CreatedAtUtc
            FROM Credits
            WHERE UserId = @UserId AND Id = @Id;
            """;
        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@Id", id);

        using var reader = command.ExecuteReader();
        return reader.Read() ? ReadCredit(reader) : null;
    }

    public void Upsert(Credit credit)
    {
        using var connection = OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE Credits
            SET Name = @Name,
                Amount = @Amount,
                AnnualInterestRate = @AnnualInterestRate,
                TermMonths = @TermMonths,
                AmortizationType = @AmortizationType
            WHERE Id = @Id AND UserId = @UserId;

            IF @@ROWCOUNT = 0
            BEGIN
                INSERT INTO Credits (Id, UserId, Name, Amount, AnnualInterestRate, TermMonths, AmortizationType, CreatedAtUtc)
                VALUES (@Id, @UserId, @Name, @Amount, @AnnualInterestRate, @TermMonths, @AmortizationType, @CreatedAtUtc);
            END;
            """;
        AddParameters(command, credit);
        command.ExecuteNonQuery();
    }

    public bool Delete(Guid userId, Guid id)
    {
        using var connection = OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM Credits WHERE UserId = @UserId AND Id = @Id;";
        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@Id", id);
        return command.ExecuteNonQuery() > 0;
    }

    private static void AddParameters(SqlCommand command, Credit credit)
    {
        command.Parameters.AddWithValue("@Id", credit.Id);
        command.Parameters.AddWithValue("@UserId", credit.UserId);
        command.Parameters.AddWithValue("@Name", credit.Name);
        command.Parameters.AddWithValue("@Amount", credit.Amount);
        command.Parameters.AddWithValue("@AnnualInterestRate", credit.AnnualInterestRate);
        command.Parameters.AddWithValue("@TermMonths", credit.TermMonths);
        command.Parameters.AddWithValue("@AmortizationType", credit.AmortizationType);
        command.Parameters.AddWithValue("@CreatedAtUtc", credit.CreatedAtUtc);
    }

    private static Credit ReadCredit(SqlDataReader reader) => new()
    {
        Id = reader.GetGuid(0),
        UserId = reader.GetGuid(1),
        Name = reader.GetString(2),
        Amount = reader.GetDecimal(3),
        AnnualInterestRate = reader.GetDecimal(4),
        TermMonths = reader.GetInt32(5),
        AmortizationType = reader.GetString(6),
        CreatedAtUtc = reader.GetDateTime(7)
    };

    private SqlConnection OpenConnection()
    {
        var connection = new SqlConnection(_connectionString);
        connection.Open();
        return connection;
    }
}
