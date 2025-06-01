import { storage } from "./storage";
import { hashPassword } from "./auth";

async function createDepartmentUsers() {
  console.log("Creating department users...");

  const departmentUsers = [
    {
      id: "it-dept-001",
      name: "Alice IT",
      email: "alice@company.com",
      password: "it123",
      role: "Department Member",
      department: "IT",
      isActive: true
    },
    {
      id: "hr-dept-001", 
      name: "Bob HR",
      email: "bob@company.com",
      password: "hr123",
      role: "Department Member",
      department: "HR",
      isActive: true
    },
    {
      id: "admin-dept-001",
      name: "Charlie Admin", 
      email: "admin@company.com",
      password: "admin123",
      role: "Administrator",
      department: "Admin",
      isActive: true
    },
    {
      id: "finance-dept-001",
      name: "Diana Finance",
      email: "diana@company.com", 
      password: "finance123",
      role: "Department Member",
      department: "Finance",
      isActive: true
    },
    {
      id: "facilities-dept-001",
      name: "Eve Facilities",
      email: "eve@company.com",
      password: "facilities123", 
      role: "Department Member",
      department: "Facilities",
      isActive: true
    }
  ];

  for (const user of departmentUsers) {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(user.email);
      if (existingUser) {
        console.log(`User ${user.email} already exists`);
        continue;
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(user.password);
      await storage.createUser({
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: hashedPassword,
        role: user.role,
        department: user.department,
        isActive: user.isActive
      });
      
      console.log(`✓ Created ${user.role}: ${user.name} (${user.email}) - Password: ${user.password}`);
    } catch (error) {
      console.error(`Failed to create user ${user.email}:`, error);
    }
  }

  console.log("\nDepartment user creation complete!");
  process.exit(0);
}

createDepartmentUsers().catch(console.error);