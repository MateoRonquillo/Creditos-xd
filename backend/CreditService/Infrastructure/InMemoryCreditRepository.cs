using System.Collections.Concurrent;
using CreditService.Domain;

namespace CreditService.Infrastructure;

public sealed class InMemoryCreditRepository : ICreditRepository
{
    private readonly ConcurrentDictionary<Guid, Credit> _credits = new();

    public IReadOnlyCollection<Credit> ListByUser(Guid userId) =>
        _credits.Values.Where(credit => credit.UserId == userId).ToArray();

    public Credit? Find(Guid userId, Guid id) =>
        _credits.TryGetValue(id, out var credit) && credit.UserId == userId ? credit : null;

    public void Upsert(Credit credit) => _credits[credit.Id] = credit;

    public bool Delete(Guid userId, Guid id) =>
        _credits.TryGetValue(id, out var credit) && credit.UserId == userId && _credits.TryRemove(id, out _);
}
