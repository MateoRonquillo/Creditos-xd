using SimulationService.Domain;

namespace SimulationService.Infrastructure;

public interface ISimulationRepository
{
    void Add(Simulation simulation);
    Simulation? Find(Guid userId, Guid id);
    IReadOnlyCollection<Simulation> ListByUser(Guid userId);
}
