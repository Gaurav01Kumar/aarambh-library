# Database Setup Guide

This guide will help you set up MongoDB and seed the initial data for your Library Management SaaS application.

## Prerequisites

1. MongoDB installed and running locally, or MongoDB Atlas connection string
2. Node.js and npm installed
3. Project dependencies installed

## Setup Steps

### 1. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/library-management

# Or use MongoDB Atlas
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/library-management

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Application
NODE_ENV=development
```

### 2. Install Additional Dependencies

```bash
npm install --save-dev tsx bcryptjs @types/bcryptjs
```

### 3. Seed the Database

Run the seed scripts in order:

```bash
# Seed roles first
npm run seed:roles

# Seed users
npm run seed:users

# Seed seats
npm run seed:seats

# Or seed everything at once
npm run seed:all
```

## What Gets Seeded

### Roles (5 roles created)
- **Super Admin**: Full access to all features
- **Admin**: Administrative access with limited system settings
- **Staff**: Staff access for daily operations
- **Receptionist**: Front desk access for check-in/check-out
- **Accountant**: Financial access for transactions and expenses

### Users (3 users created)
- **Super Admin**: superadmin@library.com (Password: admin123)
- **Admin**: admin@library.com (Password: admin123)
- **Staff**: staff@library.com (Password: admin123)

### Seats (50 seats created)
- **10 VIP seats**: ₹2,500/month (Ground Floor, Section A)
- **15 Premium seats**: ₹1,500/month (Ground Floor, Section B)
- **25 Regular seats**: ₹1,000/month (First & Second Floor, Sections C-E)

## Database Models

### Core Models
- **User**: Admin and staff users
- **Role**: User roles and permissions
- **Student**: Student information and subscriptions
- **Seat**: Seat management and availability
- **Transaction**: Payment transactions
- **Expense**: Income and expense tracking
- **Attendance**: Check-in/check-out records
- **FeeReminder**: Fee due reminders
- **Subscription**: Subscription plans
- **Organization**: Organization settings

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Dashboard
- `GET /api/dashboard` - Overview statistics

### Students
- `GET /api/students` - List students
- `POST /api/students` - Create student
- `GET /api/students/[id]` - Get student details
- `PUT /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Delete student

### Seats
- `GET /api/seats` - List seats
- `POST /api/seats` - Create seat

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction

### Expenses
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense

### Attendance
- `GET /api/attendance` - List attendance records
- `POST /api/attendance` - Create attendance record

### Fee Reminders
- `GET /api/fee-reminders` - List fee reminders
- `POST /api/fee-reminders` - Create fee reminder

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` (local) or check Atlas status
- Verify connection string in `.env` file
- Check firewall/network settings

### Seed Script Issues
- Make sure MongoDB is connected before running seeds
- Run seeds in order: roles → users → seats
- Check console output for specific error messages

### Permission Issues
- Ensure MongoDB user has necessary permissions
- Check database and collection creation rights

## Next Steps

After setting up the database:

1. Start the development server: `npm run dev`
2. Access the application at `http://localhost:3000`
3. Login with seeded credentials
4. Start building the UI components

## Development Tips

- Use MongoDB Compass for database visualization
- Check API responses using Postman or similar tools
- Monitor logs for debugging database operations
- Keep `.env` file secure and never commit it