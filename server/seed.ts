import { storage } from "./storage";
import { hashPassword } from "./auth";

async function seedUsers() {
  try {
    console.log("Seeding initial users...");

    // Create a General User
    const generalUserPassword = await hashPassword("password123");
    await storage.createUser({
      name: "John Employee",
      email: "john@company.com",
      passwordHash: generalUserPassword,
      role: "General User",
      department: null,
      isActive: true,
    });

    // Create an IT Department Member
    const itMemberPassword = await hashPassword("password123");
    await storage.createUser({
      name: "Alice IT",
      email: "alice@company.com",
      passwordHash: itMemberPassword,
      role: "Department Member",
      department: "IT",
      isActive: true,
    });

    // Create an Administrator
    const adminPassword = await hashPassword("password123");
    await storage.createUser({
      name: "Bob Admin",
      email: "admin@company.com",
      passwordHash: adminPassword,
      role: "Administrator",
      department: null,
      isActive: true,
    });

    console.log("Users seeded successfully!");
    console.log("Test accounts:");
    console.log("- General User: john@company.com / password123");
    console.log("- IT Department: alice@company.com / password123");
    console.log("- Administrator: admin@company.com / password123");

  } catch (error) {
    console.error("Error seeding users:", error);
  }
}

if (require.main === module) {
  seedUsers().then(() => process.exit(0));
}

export { seedUsers };