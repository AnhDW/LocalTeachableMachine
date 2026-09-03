using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Server.Application.Interfaces;
using Server.Infrastructure.Identity;

namespace Server.Infrastructure.Auth;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IJwtProvider _jwtProvider;
    private readonly IConfiguration _configuration;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IJwtProvider jwtProvider,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtProvider = jwtProvider;
        _configuration = configuration;
    }

    public async Task<(bool Success, string[] Errors)> RegisterAsync(string username, string password)
    {
        var user = new ApplicationUser { UserName = username };
        var result = await _userManager.CreateAsync(user, password);

        if (result.Succeeded)
        {
            return (true, Array.Empty<string>());
        }

        return (false, result.Errors.Select(e => e.Description).ToArray());
    }

    public async Task<(bool Success, string Token, string RefreshToken, string[] Errors)> LoginAsync(string username, string password)
    {
        var user = await _userManager.FindByNameAsync(username);
        if (user == null)
            return (false, string.Empty, string.Empty, new[] { "Sai tên đăng nhập hoặc mật khẩu" });

        var result = await _signInManager.CheckPasswordSignInAsync(user, password, false);
        if (!result.Succeeded)
            return (false, string.Empty, string.Empty, new[] { "Sai tên đăng nhập hoặc mật khẩu" });

        var token = _jwtProvider.GenerateAccessToken(user.Id, user.UserName!);
        var refreshToken = _jwtProvider.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        var refreshDays = int.Parse(_configuration["JwtSettings:RefreshExpiryDays"] ?? "1");
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(refreshDays);

        await _userManager.UpdateAsync(user);

        return (true, token, refreshToken, Array.Empty<string>());
    }

    public async Task<(bool Success, string Token, string RefreshToken, string[] Errors)> RefreshTokenAsync(string token, string refreshToken)
    {
        // Trong môi trường đơn giản, ta tìm user bằng refreshToken
        // Một cách an toàn hơn là giải mã token cũ lấy UserId, rồi so sánh.
        
        // Cách nhanh nhất cho demo: query user dựa trên RefreshToken (Cần thiết lập Index trên cột này trong thực tế)
        // Tuy nhiên UserManager không hỗ trợ tìm trực tiếp qua RefreshToken. 
        // Chúng ta giải mã Access Token lấy ID.
        
        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);
        var userId = jwtToken.Claims.FirstOrDefault(c => c.Type == System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        
        if (userId == null)
             return (false, string.Empty, string.Empty, new[] { "Token không hợp lệ" });

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null || user.RefreshToken != refreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            return (false, string.Empty, string.Empty, new[] { "Refresh token không hợp lệ hoặc đã hết hạn" });
        }

        var newAccessToken = _jwtProvider.GenerateAccessToken(user.Id, user.UserName!);
        var newRefreshToken = _jwtProvider.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        var refreshDays = int.Parse(_configuration["JwtSettings:RefreshExpiryDays"] ?? "1");
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(refreshDays);

        await _userManager.UpdateAsync(user);

        return (true, newAccessToken, newRefreshToken, Array.Empty<string>());
    }
}
