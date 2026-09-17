using CreditService.Domain;

namespace CreditService.Infrastructure;

public interface ICreditRepository
{
    IReadOnlyCollection<Credit> ListByUser(Guid userId);
    Credit? Find(Guid userId, Guid id);
    void Upsert(Credit credit);
    bool Delete(Guid userId, Guid id);
}
