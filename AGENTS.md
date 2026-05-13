<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
Build a modern **Library Management SaaS Web Application** using the latest version of Next.js (App Router), Tailwind CSS, and a modern UI component library (such as shadcn/ui).

### Core Requirements

#### 1. Authentication & Landing

* Create a responsive landing page with:

  * Hero section, features, pricing, and CTA
* Implement authentication (email/password + optional OAuth)
* Pages:

  * Sign Up
  * Sign In
  * Forgot Password

---

#### 2. Dashboard (Admin Panel)

After login, users access a dashboard with:

* Overview stats (total students, occupied seats, revenue, etc.)
* Sidebar navigation
* Clean, modern UI with charts and cards

---

#### 3. Seat Management

* Add/Edit/Delete seats
* Configure total seats dynamically
* Show real-time seat availability
* Assign seats to students

---

#### 4. Student Management

* Register students with:

  * Name, phone, email, ID proof, seat number
* Edit/Delete student records
* Search and filter students

---

#### 5. QR Code Entry System

* Generate unique QR code for each student
* Daily check-in/check-out system:

  * Student scans QR
  * Logs entry/exit time
* Maintain attendance history

---

#### 6. Transactions & Accounting

* Record payments (fees)
* Track:

  * Paid / unpaid students
  * Monthly revenue
* Transaction history page

---

#### 7. Expense Tracking

* Add income and expenses
* Categories (rent, electricity, etc.)
* Dashboard with financial summary

---

#### 8. Fee Reminder System

* Track due dates
* Send reminders (UI-based or email-ready structure)
* Highlight overdue students

---

#### 9. Subscription System (SaaS Model)

* Plans (Free / Basic / Pro)
* Restrict features based on plan
* Billing-ready structure (Stripe-ready)

---

### Tech Stack

* Framework: Next.js (latest, App Router)
* Styling: Tailwind CSS
* UI Components: shadcn/ui
* Database: PostgreSQL (via Prisma ORM)
* Authentication: NextAuth or Auth.js
* State Management: React Query / Zustand
* Charts: Recharts or Chart.js

---

### Additional Requirements

* Fully responsive design (mobile + desktop)
* Clean folder structure (modular & scalable)
* Use server actions where appropriate
* API routes for backend logic
* Form validation (Zod + React Hook Form)
* Dark mode support

---

### Bonus Features

* Export reports (CSV/PDF)
* Role-based access (Admin/Staff)
* Notifications system
* Audit logs

---

### Output Expectations

* Production-ready code structure
* Reusable components
* Scalable architecture
* Clean and modern UI/UX
