# Library Management SaaS

A modern, comprehensive library management system built with Next.js, MongoDB, and shadcn/ui. This SaaS platform helps libraries manage students, seats, attendance, transactions, and expenses efficiently.

## 🚀 Features

### Core Functionality
- **Student Management**: Register and manage students with detailed profiles, ID verification, and subscription tracking
- **Seat Management**: Real-time seat availability with different tiers (VIP, Premium, Regular)
- **QR Code Entry**: Generate unique QR codes for students and track check-in/check-out times
- **Financial Tracking**: Complete transaction management, expense tracking, and revenue analytics
- **Fee Reminders**: Automated fee reminders with multiple notification channels
- **Real-time Dashboard**: Comprehensive dashboard with live statistics and actionable insights

### Authentication & Security
- Email/password authentication
- Role-based access control (Super Admin, Admin, Staff, Receptionist, Accountant)
- Secure session management
- Password reset functionality

### SaaS Features
- Subscription-based pricing (Free, Basic, Pro)
- Multi-organization support
- Scalable architecture
- API access for integrations

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **State Management**: React hooks
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 6+ (local or MongoDB Atlas)
- npm or yarn package manager

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd library-management-saas
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

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

### 4. Seed the Database

```bash
# Install additional dependencies
npm install --save-dev tsx bcryptjs @types/bcryptjs

# Seed roles, users, and seats
npm run seed:all
```

This will create:
- 5 user roles with different permissions
- 3 test users (default password: admin123)
- 50 seats (10 VIP, 15 Premium, 25 Regular)

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
library-management-saas/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── dashboard/     # Dashboard statistics
│   │   │   ├── students/      # Student management
│   │   │   ├── seats/         # Seat management
│   │   │   ├── transactions/  # Transaction management
│   │   │   ├── expenses/      # Expense tracking
│   │   │   ├── attendance/    # Attendance records
│   │   │   └── fee-reminders/ # Fee reminders
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   └── ui/               # shadcn/ui components
│   └── lib/                  # Utility functions
│       ├── models/           # Mongoose models
│       ├── mongodb.ts        # MongoDB connection
│       └── utils.ts          # Utility functions
├── scripts/                   # Database seed scripts
│   ├── seed-roles.ts
│   ├── seed-users.ts
│   └── seed-seats.ts
└── public/                    # Static assets
```

## 🔐 Default Credentials

After seeding the database, you can use these credentials:

- **Super Admin**: superadmin@library.com / admin123
- **Admin**: admin@library.com / admin123  
- **Staff**: staff@library.com / admin123

## 📊 Database Models

### Core Models
- **User**: Admin and staff users
- **Role**: User roles and permissions
- **Student**: Student information with QR codes
- **Seat**: Seat management with different tiers
- **Transaction**: Payment transactions
- **Expense**: Income and expense tracking
- **Attendance**: Check-in/check-out records
- **FeeReminder**: Fee due reminders
- **Subscription**: Subscription plans
- **Organization**: Organization settings

## 🎨 Pages & Features

### Public Pages
- **Landing Page** (`/`): Hero section, features, pricing, and CTA
- **Sign Up** (`/auth/signup`): User registration
- **Sign In** (`/auth/signin`): User login
- **Forgot Password** (`/auth/forgot-password`): Password reset

### Dashboard Pages
- **Dashboard** (`/dashboard`): Overview statistics and charts
- **Students** (`/dashboard/students`): Student management with search and filters
- **Seats** (`/dashboard/seats`): Seat management and availability
- **Transactions** (`/dashboard/transactions`): Payment tracking and history
- **Expenses** (`/dashboard/expenses`): Income and expense management
- **Attendance** (`/dashboard/attendance`): Check-in/check-out tracking
- **Reminders** (`/dashboard/reminders`): Fee reminder management
- **Settings** (`/dashboard/settings`): User and library settings

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Dashboard
- `GET /api/dashboard` - Overview statistics

### Students
- `GET /api/students` - List students with pagination and filters
- `POST /api/students` - Create new student
- `GET /api/students/[id]` - Get student details
- `PUT /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Delete student

### Seats
- `GET /api/seats` - List seats with filters
- `POST /api/seats` - Create new seat

### Transactions
- `GET /api/transactions` - List transactions with filters
- `POST /api/transactions` - Create new transaction

### Expenses
- `GET /api/expenses` - List expenses with filters
- `POST /api/expenses` - Create new expense

### Attendance
- `GET /api/attendance` - List attendance records
- `POST /api/attendance` - Create attendance record

### Fee Reminders
- `GET /api/fee-reminders` - List fee reminders
- `POST /api/fee-reminders` - Create fee reminder

## 🎯 User Roles & Permissions

### Super Admin
- Full access to all features and settings
- Manage users, roles, and organizations
- System configuration

### Admin
- Manage students, seats, and transactions
- View reports and export data
- Limited system settings

### Staff
- View students and seats
- Create transactions
- Manage attendance
- View reports

### Receptionist
- View students and seats
- Manage attendance
- View transactions

### Accountant
- View students
- Manage transactions and expenses
- View reports
- Export data

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Digital Ocean App Platform
- AWS Amplify

## 📝 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run seed:roles   # Seed roles
npm run seed:users   # Seed users
npm run seed:seats   # Seed seats
npm run seed:all     # Seed all data
```

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful commit messages

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@libraryhub.com or open an issue in the repository.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Note**: This is a demonstration project. For production use, ensure proper security measures, error handling, and testing are implemented.