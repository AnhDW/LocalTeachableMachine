using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Server.Application.Interfaces;
using Server.Domain.Entities;
using Server.Infrastructure.Identity;

namespace Server.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Project> Projects { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        builder.Entity<Project>()
            .HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .IsRequired();
    }
}
