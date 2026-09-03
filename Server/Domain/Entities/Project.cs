namespace Server.Domain.Entities;

public class Project
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    
    // Khóa ngoại trỏ đến ApplicationUser
    public string UserId { get; set; } = string.Empty;
    
    // Lưu các tên Class ví dụ ["Label 1", "Label 2"]
    public string Classes { get; set; } = "[]"; 
    
    // Dataset của KNN Model sau khi stringify
    public string ModelData { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
