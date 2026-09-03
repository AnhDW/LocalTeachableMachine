namespace Server.Application.Interfaces;

public interface IJwtProvider
{
    string GenerateAccessToken(string userId, string userName);
    string GenerateRefreshToken();
}
