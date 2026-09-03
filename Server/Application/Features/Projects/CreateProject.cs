using FluentValidation;
using MediatR;
using Server.Application.Interfaces;
using Server.Domain.Entities;

namespace Server.Application.Features.Projects;

public class CreateProjectCommand : IRequest<ProjectDto>
{
    public string Name { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Classes { get; set; } = "[]";
    public string ModelData { get; set; } = string.Empty;
}

public class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand, ProjectDto>
{
    private readonly IApplicationDbContext _context;

    public CreateProjectCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProjectDto> Handle(CreateProjectCommand request, CancellationToken cancellationToken)
    {
        var project = new Project
        {
            Name = request.Name,
            UserId = request.UserId,
            Classes = request.Classes,
            ModelData = request.ModelData,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Projects.Add(project);
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

public class CreateProjectCommandValidator : AbstractValidator<CreateProjectCommand>
{
    public CreateProjectCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}
