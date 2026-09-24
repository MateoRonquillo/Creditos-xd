using AuthService.Domain;
using Microsoft.Data.SqlClient;

namespace AuthService.Infrastructure;

public sealed class SqlUserRepository(IConfiguration configuration) : IUserRepository
{
    private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("DefaultConnection is not configured.");

    public void Add(User user)
    {
        using var connection = OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO Users (Id, Name, Email, PasswordHash, CreatedAtUtc)
            VALUES (@Id, @Name, @Email, @PasswordHash, @CreatedAtUtc);
            """;
        AddParameters(command, user);
        command.ExecuteNonQuery();
    }

    public User? FindByEmail(string email)
    {
        using var connection = OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT Id, Name, Email, PasswordHash, CreatedAtUtc
            FROM Users
            WHERE Email = @Email;
            """;
        command.Parameters.AddWithValue("@Email", email);
        return ReadUser(command);
    }

    public User? FindById(Guid id)
    {
        using var connection = OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT Id, Name, Email, PasswordHash, CreatedAtUtc
            FROM Users
            WHERE Id = @Id;
            """;
        command.Parameters.AddWithValue("@Id", id);
        return ReadUser(command);
    }

    private static void AddParameters(SqlCommand command, User user)
    {
        command.Parameters.AddWithValue("@Id", user.Id);
        command.Parameters.AddWithValue("@Name", user.Name);
        command.Parameters.AddWithValue("@Email", user.Email);
        command.Parameters.AddWithValue("@PasswordHash", user.PasswordHash);
        command.Parameters.AddWithValue("@CreatedAtUtc", user.CreatedAtUtc);
    }

    private static User? ReadUser(SqlCommand command)
    {
        using var reader = command.ExecuteReader();
        return reader.Read()
            ? new User
            {
                Id = reader.GetGuid(0),
                Name = reader.GetString(1),
                Email = reader.GetString(2),
                PasswordHash = reader.GetString(3),
                CreatedAtUtc = reader.GetDateTime(4)
            }
            : null;
    }

    private SqlConnection OpenConnection()
    {
        var connection = new SqlConnection(_connectionString);
        connection.Open();
        return connection;
    }
}
