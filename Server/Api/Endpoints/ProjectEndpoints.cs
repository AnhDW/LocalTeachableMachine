using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Server.Application.Features.Projects;

namespace Server.Api.Endpoints;

public static class ProjectEndpoints
{
    public static void MapProjectEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects")
            .WithTags("Projects")
            .RequireAuthorization(); // Yêu cầu JWT token

        group.MapGet("/", async (HttpContext context, IMediator mediator) =>
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var query = new GetProjectsQuery { UserId = userId };
            var result = await mediator.Send(query);
            return Results.Ok(result);
        })
        .WithName("GetProjects");

        group.MapGet("/{id:guid}", async (Guid id, HttpContext context, IMediator mediator) =>
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var query = new GetProjectByIdQuery { Id = id, UserId = userId };
            var result = await mediator.Send(query);

            return result != null ? Results.Ok(result) : Results.NotFound();
        })
        .WithName("GetProjectById");

        group.MapPost("/", async (CreateProjectRequest request, HttpContext context, IMediator mediator) =>
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var command = new CreateProjectCommand
            {
                Name = request.Name,
                UserId = userId,
                Classes = request.Classes,
                ModelData = request.ModelData
            };
            
            var result = await mediator.Send(command);
            return Results.Created($"/api/projects/{result.Id}", result);
        })
        .WithName("CreateProject");

        group.MapPut("/{id:guid}", async (Guid id, UpdateProjectRequest request, HttpContext context, IMediator mediator) =>
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var command = new UpdateProjectCommand
            {
                Id = id,
                UserId = userId,
                Name = request.Name,
                Classes = request.Classes,
                ModelData = request.ModelData
            };

            var result = await mediator.Send(command);
            return result != null ? Results.Ok(result) : Results.NotFound();
        })
        .WithName("UpdateProject");
    }
}

public class CreateProjectRequest
{
    public string Name { get; set; } = string.Empty;
    public string Classes { get; set; } = "[]";
    public string ModelData { get; set; } = string.Empty;
}

public class UpdateProjectRequest
{
    public string Name { get; set; } = string.Empty;
    public string Classes { get; set; } = "[]";
    public string ModelData { get; set; } = string.Empty;
}
