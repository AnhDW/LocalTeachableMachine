using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Server.Application.Features.Auth;

namespace Server.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/register", async (RegisterCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            if (result.Success)
                return Results.Ok(result);
            return Results.BadRequest(result);
        })
        .WithName("Register");

        group.MapPost("/login", async (LoginCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            if (result.Success)
                return Results.Ok(result);
            return Results.BadRequest(result);
        })
        .WithName("Login");

        group.MapPost("/refresh", async (RefreshTokenCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            if (result.Success)
                return Results.Ok(result);
            return Results.BadRequest(result);
        })
        .WithName("RefreshToken");
    }
}
