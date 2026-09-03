using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Server.Application.Interfaces;

namespace Server.Application.Features.Projects;

public class UpdateProjectCommand : IRequest<ProjectDto?>
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Classes { get; set; } = "[]";
    public string ModelData { get; set; } = string.Empty;
}

public class UpdateProjectCommandHandler : IRequestHandler<UpdateProjectCommand, ProjectDto?>
{
    private readonly IApplicationDbContext _context;

    public UpdateProjectCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProjectDto?> Handle(UpdateProjectCommand request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.UserId == request.UserId, cancellationToken);

        if (project == null)
            return null;

        project.Name = request.Name;
        project.Classes = request.Classes;
        project.ModelData = request.ModelData;
        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

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

public class UpdateProjectCommandValidator : AbstractValidator<UpdateProjectCommand>
{
    public UpdateProjectCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty();
    }
}
