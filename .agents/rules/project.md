# Library Management SaaS - Project Rules

## Tech Stack
- **Framework**: Next.js (App Router) with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth / Auth.js
- **Email**: Nodemailer with Hostinger SMTP (aarambhlibrary.com)

## Architecture

### Models (Mongoose)
- Models are in `src/lib/models/`
- The Student model is registered as `'LibraryMember'` (not `'Student'`) — all refs must use `ref: 'LibraryMember'`
- Always use `mongoose.models.X || mongoose.model('X', Schema)` pattern for model exports (prevents hot-reload crashes in dev)
- Never force-delete `mongoose.models.X` in production code

### API Routes
- API routes live in `src/app/api/`
- Always add `export const dynamic = 'force-dynamic'` to routes that read live database data
- Always import referenced models when using `.populate()` so mongoose can resolve the ref
- Date queries in MongoDB must use range queries (`$gte`, `$lte`) — never exact Date equality

### Attendance System
- Self-service terminal: `src/app/attendance/page.tsx` — students scan QR or enter seat number
- Mark API: `src/app/api/attendance/mark/route.ts` — handles check-in/check-out with GPS, Wi-Fi, device, and shift validation
- Dashboard view: `src/app/dashboard/attendance/page.tsx` — admin attendance table
- Attendance records are stored both in the `Attendance` collection AND embedded in `Student.attendance[]` array

### Key Conventions
- IST timezone (`Asia/Kolkata`) is used throughout for time display and shift calculations
- Device IDs are stored in localStorage as `library_device_id`
- Seat numbers are always stored/compared in UPPERCASE
- Email notifications are fire-and-forget (`.catch()`) — never block the response

## Common Pitfalls
- Mongoose `pre('save')` hooks MUST call `next()` or the save hangs
- Next.js can cache API route responses — always use `force-dynamic` for live data
- The Student model name is `'LibraryMember'`, not `'Student'` — this affects all populate() calls
