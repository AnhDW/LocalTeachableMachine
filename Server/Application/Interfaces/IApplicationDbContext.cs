using Microsoft.EntityFrameworkCore;
using Server.Domain.Entities;

namespace Server.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Project> Projects { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
