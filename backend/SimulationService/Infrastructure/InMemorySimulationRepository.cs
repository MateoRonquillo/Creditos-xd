using System.Collections.Concurrent;
using SimulationService.Domain;

namespace SimulationService.Infrastructure;

public sealed class InMemorySimulationRepository : ISimulationRepository
{
    private readonly ConcurrentDictionary<Guid, Simulation> _simulations = new();

    public void Add(Simulation simulation) => _simulations[simulation.Id] = simulation;

    public Simulation? Find(Guid userId, Guid id) =>
        _simulations.TryGetValue(id, out var simulation) && simulation.UserId == userId ? simulation : null;

    public IReadOnlyCollection<Simulation> ListByUser(Guid userId) =>
        _simulations.Values.Where(simulation => simulation.UserId == userId).ToArray();
}
