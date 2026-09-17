using AuthService.Domain;

namespace AuthService.Infrastructure;

public interface IUserRepository
{
    void Add(User user);
    User? FindByEmail(string email);
    User? FindById(Guid id);
}
