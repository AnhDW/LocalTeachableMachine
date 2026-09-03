namespace Server.Application.Features.Auth;

public class AuthResponse
{
    public bool Success { get; set; }
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public string[] Errors { get; set; } = Array.Empty<string>();
}
