AI-Powered Internal Helpdesk Portal
A comprehensive internal company helpdesk system with advanced AI-powered ticket management, intelligent routing, and real-time analytics. Built with React.js frontend and Express.js backend.

🚀 Features
Core Functionality
Multi-Role Authentication System
General Users (employees)
Department Members (IT, HR, Finance, Admin, Facilities)
Administrator (super-admin access)
Separate login portals for different user types
AI-Powered Capabilities
Smart Ticket Routing: AI automatically routes tickets to appropriate departments
HelpBot Assistant: Interactive chatbot for instant support
Reply Suggestions: AI-generated response suggestions for support staff
Pattern Detection: Identifies trends, high-volume issues, and potential spam
Ticket Management
Real-time Status Tracking: Open, In Progress, Resolved states
Dynamic Counters: Live updates of ticket statistics
Inline Status Management: Quick status changes from dashboard
Comprehensive Ticket Views: Detailed ticket information with comments
File Attachments: Support for ticket attachments
Comment System: Internal and external comments
Dashboard Features
Role-based Dashboards: Customized views for each user type
Real-time Analytics: Live ticket statistics and performance metrics
Department-specific Views: Filtered ticket lists by department
Quick Actions: Fast access to common tasks
Dark Mode Support: Full dark/light theme switching
Additional Features
FAQ System: Searchable knowledge base with categories
Search & Filtering: Advanced ticket search and status filtering
Responsive Design: Mobile-friendly interface
Session Management: Secure user sessions with PostgreSQL storage
🛠 Tech Stack
Frontend
React.js with TypeScript
Vite for development and building
TailwindCSS for styling
Shadcn/UI components
TanStack Query for state management
Wouter for routing
React Hook Form with Zod validation
Backend
Node.js with Express.js
TypeScript for type safety
PostgreSQL database
Drizzle ORM for database operations
OpenAI API for AI features
Passport.js for authentication
Multer for file uploads
📋 Prerequisites
Before running the application, ensure you have:

Node.js (v18 or higher)
PostgreSQL database
OpenAI API Key (for AI features)
🚀 Getting Started
1. Clone and Install
# Clone the repository
git clone <repository-url>
cd helpdesk-portal
# Install dependencies
npm install
2. Environment Setup
Create a .env file in the root directory:

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/helpdesk_db
PGHOST=localhost
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=helpdesk_db
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
# Session Configuration
SESSION_SECRET=your_secure_session_secret_here
3. Database Setup
# Create the database
createdb helpdesk_db
# Push schema to database
npm run db:push
4. Seed Initial Data
# Create department users and admin
npx tsx server/fix-all-departments.ts
# Seed FAQ data
npx tsx server/seed-faqs.ts
5. Start the Application
# Start development server
npm run dev
The application will be available at http://localhost:5000

👥 Default User Accounts
Department Login Portal (/auth/login-department)
Role	Email	Password	Department
IT Staff	alice@company.com	it123	IT
HR Staff	bob@company.com	hr123	HR
Finance Staff	diana@company.com	finance123	Finance
Facilities Staff	eve@company.com	facilities123	Facilities
Administrator	admin@company.com	password123	Admin
General User Login (/auth/login)
Create new accounts through the signup form
General users can create tickets and track their status
🏗 Project Structure
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
├── server/                 # Backend Express application
│   ├── auth.ts            # Authentication logic
│   ├── routes.ts          # API route handlers
│   ├── storage.ts         # Database operations
│   ├── openai.ts          # AI integration
│   └── db.ts              # Database configuration
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema and validation
└── uploads/               # File upload storage
🔧 Development Scripts
# Start development server
npm run dev
# Build for production
npm run build
# Database operations
npm run db:push         # Push schema changes
npm run db:generate     # Generate migrations
# Seed data
npx tsx server/seed-faqs.ts              # Seed FAQ data
npx tsx server/fix-all-departments.ts    # Create department users
🎯 Usage Guide
For General Users
Register at /auth/login
Create support tickets at /tickets/new
Track ticket progress in dashboard
Use HelpBot for instant assistance
For Department Members
Login at /auth/login-department
View department-specific tickets
Update ticket statuses
Add comments and resolutions
Access analytics and reporting
For Administrators
Login with admin credentials
Access comprehensive analytics dashboard
Manage all tickets across departments
Monitor AI performance and patterns
Update system-wide ticket statuses
🤖 AI Features Configuration
The application uses OpenAI's GPT-4o model for:

Ticket Routing: Analyzes content to route to correct department
HelpBot Responses: Provides intelligent chat assistance
Reply Suggestions: Generates professional response drafts
Pattern Detection: Identifies trends in support requests
Ensure your OpenAI API key has sufficient credits and appropriate access levels.

🛡 Security Features
Role-based Access Control: Different permissions for each user type
Session Management: Secure sessions stored in PostgreSQL
Password Hashing: Bcrypt for secure password storage
Input Validation: Zod schemas for all user inputs
SQL Injection Protection: Parameterized queries via Drizzle ORM
📊 Analytics & Reporting
The admin dashboard provides:

Real-time Ticket Metrics: Live counters for all ticket states
Department Performance: Statistics by department
AI Accuracy Tracking: Monitoring of AI routing precision
Pattern Alerts: Notifications of unusual ticket patterns
Historical Trends: Ticket volume and resolution trends
🎨 Customization
Theming
Built-in dark/light mode toggle
TailwindCSS for easy style customization
Responsive design for all screen sizes
Adding New Departments
Update the department list in shared/schema.ts
Add department credentials in seed scripts
Update routing logic in UI components
🚨 Troubleshooting
Common Issues
Database Connection Issues

Verify PostgreSQL is running
Check DATABASE_URL environment variable
Ensure database exists and is accessible
AI Features Not Working

Verify OPENAI_API_KEY is set correctly
Check API key has sufficient credits
Ensure network connectivity to OpenAI API
Authentication Problems

Clear browser cookies and session data
Restart the development server
Verify user credentials in database
Logs and Debugging
Server logs available in console output
Client errors visible in browser developer tools
Database queries logged in development mode
📝 License
This project is proprietary software for internal company use.

🤝 Support
For technical support or questions about the helpdesk system, please create a ticket through the application or contact the development team.
