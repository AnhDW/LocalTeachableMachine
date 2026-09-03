using FluentValidation;
using MediatR;
using Server.Application.Interfaces;

namespace Server.Application.Features.Auth;

public class RefreshTokenCommand : IRequest<AuthResponse>
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponse>
{
    private readonly IAuthService _authService;

    public RefreshTokenCommandHandler(IAuthService authService)
    {
        _authService = authService;
    }

    public async Task<AuthResponse> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var result = await _authService.RefreshTokenAsync(request.Token, request.RefreshToken);
        return new AuthResponse
        {
            Success = result.Success,
            Token = result.Token,
            RefreshToken = result.RefreshToken,
            Errors = result.Errors
        };
    }
}

public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}
