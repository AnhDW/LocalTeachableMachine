using MediatR;
using Microsoft.EntityFrameworkCore;
using Server.Application.Interfaces;

namespace Server.Application.Features.Projects;

public class GetProjectsQuery : IRequest<List<ProjectDto>>
{
    public string UserId { get; set; } = string.Empty;
}

public class GetProjectsQueryHandler : IRequestHandler<GetProjectsQuery, List<ProjectDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProjectsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProjectDto>> Handle(GetProjectsQuery request, CancellationToken cancellationToken)
    {
        var projects = await _context.Projects
            .Where(p => p.UserId == request.UserId)
            .Select(p => new ProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                Classes = p.Classes,
                ModelData = p.ModelData,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return projects;
    }
}
