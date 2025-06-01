import { storage } from "./storage";
import { hashPassword } from "./auth";

async function fixAdminUser() {
  try {
    console.log("Fixing admin user...");
    
    // Get existing admin user
    const existingAdmin = await storage.getUserByEmail("admin@company.com");
    if (!existingAdmin) {
      console.log("Admin user not found, creating new one...");
      
      const hashedPassword = await hashPassword("admin123");
      await storage.createUser({
        id: "admin-dept-001",
        name: "Charlie Admin",
        email: "admin@company.com",
        passwordHash: hashedPassword,
        role: "Administrator",
        department: "Admin",
        isActive: true
      });
      
      console.log("✓ Created admin user: admin@company.com / admin123");
    } else {
      console.log("Admin user exists, updating password...");
      
      // For this demo, let's delete and recreate the user with correct password
      // In production, you'd update the password hash directly
      const hashedPassword = await hashPassword("admin123");
      
      // Update the user's password hash
      // Since we're using in-memory storage, we'll update the existing user object
      existingAdmin.passwordHash = hashedPassword;
      
      console.log("✓ Updated admin password: admin@company.com / admin123");
    }
    
    // Test the password
    const adminUser = await storage.getUserByEmail("admin@company.com");
    console.log("Admin user details:", {
      id: adminUser?.id,
      name: adminUser?.name,
      email: adminUser?.email,
      role: adminUser?.role,
      department: adminUser?.department,
      hasPassword: !!adminUser?.passwordHash
    });
    
  } catch (error) {
    console.error("Error fixing admin user:", error);
  }
}

fixAdminUser().then(() => process.exit(0));