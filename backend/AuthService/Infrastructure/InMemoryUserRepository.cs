using System.Collections.Concurrent;
using AuthService.Domain;

namespace AuthService.Infrastructure;

public sealed class InMemoryUserRepository : IUserRepository
{
    private readonly ConcurrentDictionary<Guid, User> _users = new();

    public void Add(User user) => _users[user.Id] = user;

    public User? FindByEmail(string email) =>
        _users.Values.FirstOrDefault(user => user.Email.Equals(email, StringComparison.OrdinalIgnoreCase));

    public User? FindById(Guid id) => _users.TryGetValue(id, out var user) ? user : null;
}
