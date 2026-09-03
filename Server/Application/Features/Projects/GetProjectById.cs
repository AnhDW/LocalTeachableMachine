using MediatR;
using Microsoft.EntityFrameworkCore;
using Server.Application.Interfaces;

namespace Server.Application.Features.Projects;

public class GetProjectByIdQuery : IRequest<ProjectDto?>
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
}

public class GetProjectByIdQueryHandler : IRequestHandler<GetProjectByIdQuery, ProjectDto?>
{
    private readonly IApplicationDbContext _context;

    public GetProjectByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProjectDto?> Handle(GetProjectByIdQuery request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.UserId == request.UserId, cancellationToken);

        if (project == null)
            return null;

        return new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Classes = project.Classes,
            ModelData = project.ModelData,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt
        };
    }
}
