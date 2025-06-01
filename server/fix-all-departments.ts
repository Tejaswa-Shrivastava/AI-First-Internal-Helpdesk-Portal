import { storage } from "./storage";
import { hashPassword } from "./auth";

async function fixAllDepartmentUsers() {
  try {
    console.log("Fixing all department users...");
    
    const departmentUsers = [
      {
        name: "Alice IT",
        email: "alice@company.com",
        password: "it123",
        role: "Department Member",
        department: "IT"
      },
      {
        name: "Bob HR",
        email: "bob@company.com",
        password: "hr123",
        role: "Department Member",
        department: "HR"
      },
      {
        name: "Charlie Admin",
        email: "admin@company.com",
        password: "password123",
        role: "Administrator",
        department: "Admin"
      },
      {
        name: "Diana Finance",
        email: "diana@company.com",
        password: "finance123",
        role: "Department Member",
        department: "Finance"
      },
      {
        name: "Eve Facilities",
        email: "eve@company.com",
        password: "facilities123",
        role: "Department Member",
        department: "Facilities"
      }
    ];

    for (const userData of departmentUsers) {
      try {
        const existingUser = await storage.getUserByEmail(userData.email);
        if (existingUser) {
          console.log(`Updating password for ${userData.email}...`);
          const hashedPassword = await hashPassword(userData.password);
          existingUser.passwordHash = hashedPassword;
          console.log(`✓ Updated ${userData.email} - Password: ${userData.password}`);
        } else {
          console.log(`Creating new user ${userData.email}...`);
          const hashedPassword = await hashPassword(userData.password);
          await storage.createUser({
            name: userData.name,
            email: userData.email,
            passwordHash: hashedPassword,
            role: userData.role,
            department: userData.department,
            isActive: true
          });
          console.log(`✓ Created ${userData.email} - Password: ${userData.password}`);
        }
      } catch (error) {
        console.error(`Failed to process user ${userData.email}:`, error);
      }
    }

    console.log("\nAll department users have been fixed!");
    console.log("\nTest credentials:");
    departmentUsers.forEach(user => {
      console.log(`- ${user.name}: ${user.email} / ${user.password} (${user.role})`);
    });
    
  } catch (error) {
    console.error("Error fixing department users:", error);
  }
}

fixAllDepartmentUsers().then(() => process.exit(0));