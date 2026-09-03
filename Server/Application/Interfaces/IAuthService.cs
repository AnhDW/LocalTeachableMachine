namespace Server.Application.Interfaces;

public interface IAuthService
{
    Task<(bool Success, string[] Errors)> RegisterAsync(string username, string password);
    Task<(bool Success, string Token, string RefreshToken, string[] Errors)> LoginAsync(string username, string password);
    Task<(bool Success, string Token, string RefreshToken, string[] Errors)> RefreshTokenAsync(string token, string refreshToken);
}
