import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Shield, 
  Clock, 
  Zap, 
  CheckCircle, 
  ArrowRight, 
  QrCode, 
  Sparkles, 
  LayoutGrid, 
  BellRing, 
  ChevronRight, 
  Star, 
  Building2,
  BarChart3,
  UserCheck,
  Smartphone
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-600/0 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[45%] h-[45%] rounded-full bg-gradient-to-bl from-blue-600/15 to-emerald-600/0 blur-[140px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[40%] rounded-full bg-gradient-to-tr from-violet-600/15 to-pink-600/0 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Header & Navigation */}
      <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
                <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  Aarambh <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">SaaS</span>
                </span>
                <span className="text-[10px] text-slate-400 -mt-1 tracking-wider uppercase">Library Management</span>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              <Link href="#features" className="text-slate-300 hover:text-white transition-colors relative py-1 hover:after:w-full after:w-0 after:h-0.5 after:bg-indigo-500 after:absolute after:bottom-0 after:left-0 after:transition-all after:duration-300">
                Features
              </Link>
              <Link href="#preview" className="text-slate-300 hover:text-white transition-colors relative py-1 hover:after:w-full after:w-0 after:h-0.5 after:bg-indigo-500 after:absolute after:bottom-0 after:left-0 after:transition-all after:duration-300">
                Live Preview
              </Link>
              <Link href="#student-portal" className="text-slate-300 hover:text-white transition-colors relative py-1 hover:after:w-full after:w-0 after:h-0.5 after:bg-indigo-500 after:absolute after:bottom-0 after:left-0 after:transition-all after:duration-300">
                Student Portal
              </Link>
              <Link href="#about" className="text-slate-300 hover:text-white transition-colors relative py-1 hover:after:w-full after:w-0 after:h-0.5 after:bg-indigo-500 after:absolute after:bottom-0 after:left-0 after:transition-all after:duration-300">
                About Us
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 border-0 transition-all duration-300 hover:scale-[1.02]">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 md:pt-28 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            
            {/* Announcement Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 text-indigo-400 text-xs sm:text-sm font-medium mb-8 shadow-xl backdrop-blur-md animate-pulse">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Next-Gen Library Operating System</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300 flex items-center gap-1">
                Real-time Seat Grid & QR Attendance <ChevronRight className="h-3 w-3" />
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              Effortless Management for <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                Modern Study Spaces
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Empower your library with automated seat allocation, instant QR attendance, student self-registration, and hassle-free subscription tracking.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href="/auth/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-13 px-8 text-base bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 border-0 transition-all duration-300 hover:scale-[1.02]">
                  Launch Your Library Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/student-registration" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 px-8 text-base bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600 transition-all duration-300">
                  <UserCheck className="mr-2 h-5 w-5 text-indigo-400" />
                  Student Portal Registration
                </Button>
              </Link>
            </div>

            {/* Key Benefit Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-6 border-t border-slate-800/60 text-slate-400 text-xs sm:text-sm font-medium">
              <div className="flex items-center justify-center gap-2 py-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Instant Seat Setup</span>
              </div>
              <div className="flex items-center justify-center gap-2 py-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>QR Check-in System</span>
              </div>
              <div className="flex items-center justify-center gap-2 py-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Student Self-Service</span>
              </div>
              <div className="flex items-center justify-center gap-2 py-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Financial Analytics</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Live Interactive Preview Section */}
      <section id="preview" className="relative z-10 py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-3 border border-indigo-500/20">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Interactive Seat Layout Preview</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Real-Time Visual Seat Grid Management
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              Manage shift-wise allocations, reserved desks, and live student check-ins at a single glance.
            </p>
          </div>

          {/* Seat Mock Grid Container */}
          <div className="max-w-5xl mx-auto bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-400" />
                  Main Reading Hall - Desk Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Shift 1 (Morning Shift • 06:00 AM - 02:00 PM)</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/50" />
                  <span className="text-slate-300">Available (14)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-md bg-indigo-500 border border-indigo-400" />
                  <span className="text-slate-300">Occupied (10)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500/50" />
                  <span className="text-slate-300">Reserved (4)</span>
                </div>
              </div>
            </div>

            {/* Interactive Grid Mock */}
            <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-7 gap-3 py-6">
              {[
                { num: 'S-01', status: 'occupied', student: 'Aarav Sharma' },
                { num: 'S-02', status: 'occupied', student: 'Priya Patel' },
                { num: 'S-03', status: 'available' },
                { num: 'S-04', status: 'available' },
                { num: 'S-05', status: 'reserved', note: 'AC Desk' },
                { num: 'S-06', status: 'occupied', student: 'Rohan Verma' },
                { num: 'S-07', status: 'available' },
                { num: 'S-08', status: 'available' },
                { num: 'S-09', status: 'occupied', student: 'Ananya Gupta' },
                { num: 'S-10', status: 'occupied', student: 'Vikram Singh' },
                { num: 'S-11', status: 'reserved', note: 'Quiet Zone' },
                { num: 'S-12', status: 'available' },
                { num: 'S-13', status: 'available' },
                { num: 'S-14', status: 'occupied', student: 'Neha Kapoor' },
                { num: 'S-15', status: 'available' },
                { num: 'S-16', status: 'occupied', student: 'Karan Malhotra' },
                { num: 'S-17', status: 'available' },
                { num: 'S-18', status: 'reserved' },
                { num: 'S-19', status: 'available' },
                { num: 'S-20', status: 'occupied', student: 'Divya Joshi' },
                { num: 'S-21', status: 'available' },
                { num: 'S-22', status: 'available' },
                { num: 'S-23', status: 'occupied', student: 'Siddharth Rao' },
                { num: 'S-24', status: 'available' },
                { num: 'S-25', status: 'reserved' },
                { num: 'S-26', status: 'available' },
                { num: 'S-27', status: 'occupied', student: 'Ishita Roy' },
                { num: 'S-28', status: 'available' },
              ].map((seat, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-20 ${
                    seat.status === 'occupied'
                      ? 'bg-indigo-950/40 border-indigo-500/40 hover:border-indigo-400 shadow-md shadow-indigo-950/50'
                      : seat.status === 'reserved'
                      ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">{seat.num}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        seat.status === 'occupied'
                          ? 'bg-indigo-400 animate-pulse'
                          : seat.status === 'reserved'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                  </div>
                  <div className="truncate">
                    {seat.status === 'occupied' ? (
                      <span className="text-[10px] font-medium text-indigo-300 truncate block">
                        {seat.student}
                      </span>
                    ) : seat.status === 'reserved' ? (
                      <span className="text-[10px] text-amber-400 font-medium truncate block">
                        {seat.note || 'Reserved'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400/80 font-medium block">
                        Vacant
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Floating Live Indicator */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live seat occupancy synced in real-time</span>
              </div>
              <div className="text-slate-400">
                Total Capacity: <span className="text-white font-semibold">28 Seats</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Built for Performance</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Everything Your Library Needs in One Place
            </p>
            <p className="text-slate-400 text-base sm:text-lg">
              Designed specifically for reading rooms, study centers, and commercial digital libraries.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Users className="h-6 w-6 text-indigo-400" />}
              badge="Profiles & ID Cards"
              title="Student Management"
              description="Register and organize student records, document verification, shift preferences, and active subscription plans."
            />
            <FeatureCard
              icon={<LayoutGrid className="h-6 w-6 text-indigo-400" />}
              badge="Shift Matrix"
              title="Smart Seat Allocation"
              description="Assign desks with multi-shift scheduling, prevent double bookings, and track real-time desk availability."
            />
            <FeatureCard
              icon={<QrCode className="h-6 w-6 text-indigo-400" />}
              badge="Zero Contact"
              title="QR Attendance System"
              description="Generate unique QR code cards for quick student check-in/check-out and maintain accurate daily attendance logs."
            />
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6 text-indigo-400" />}
              badge="Revenue Insights"
              title="Financial & Expense Tracker"
              description="Monitor monthly collections, pending dues, expense logs, and gain automated financial health reports."
            />
            <FeatureCard
              icon={<BellRing className="h-6 w-6 text-indigo-400 text-indigo-400" />}
              badge="Auto Alerts"
              title="Automated Fee Reminders"
              description="Send automated expiry and fee collection reminders to students via SMS and WhatsApp integration."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6 text-indigo-400" />}
              badge="Live Dashboards"
              title="Executive Analytics"
              description="Track total revenue trends, occupancy percentages, attendance spikes, and top-performing shifts instantly."
            />
          </div>
        </div>
      </section>

      {/* Student Portal Spotlight */}
      <section id="student-portal" className="relative z-10 py-20 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/20 rounded-3xl p-8 md:p-12 lg:p-16 relative overflow-hidden shadow-2xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 border border-indigo-500/30">
                  <Smartphone className="h-4 w-4 text-indigo-400" />
                  <span>Student Self-Service Portal</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                  Seamless Registration & Digital Access for Students
                </h2>
                <p className="text-slate-300 text-base sm:text-lg mb-8 leading-relaxed">
                  Eliminate paperwork! Students can register online, select their preferred shifts, upload ID verification documents, and access their personal digital attendance QR card anytime.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-400 mt-1">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Instant Self-Registration</h4>
                      <p className="text-xs text-slate-400">Students fill out their details online without standing in queue.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-400 mt-1">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Digital QR ID Card</h4>
                      <p className="text-xs text-slate-400">Convenient mobile pass for seamless library gate entry.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-400 mt-1">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Fee Status Tracking</h4>
                      <p className="text-xs text-slate-400">Students receive transparent updates regarding subscription validity.</p>
                    </div>
                  </div>
                </div>

                <Link href="/student-registration">
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30">
                    Open Student Registration Portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Visual Card Component */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-30" />
                <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300 text-lg">
                        AS
                      </div>
                      <div>
                        <h4 className="font-bold text-white">Aarav Sharma</h4>
                        <p className="text-xs text-slate-400">Student ID: #STU-2024-89</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                      Active
                    </span>
                  </div>

                  <div className="space-y-3 text-xs text-slate-300">
                    <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                      <span className="text-slate-400">Assigned Seat:</span>
                      <span className="font-semibold text-white">Desk S-01 (Morning Shift)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                      <span className="text-slate-400">Subscription Status:</span>
                      <span className="font-semibold text-emerald-400">Paid (Valid till 30 Sep)</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">Today's Check-In:</span>
                      <span className="font-semibold text-indigo-400">06:14 AM (QR Scanned)</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <QrCode className="h-10 w-10 text-indigo-400" />
                      <div>
                        <p className="text-xs font-semibold text-white">Digital Pass Ready</p>
                        <p className="text-[10px] text-slate-400">Scan at entrance terminal</p>
                      </div>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us & Proof Metrics */}
      <section id="about" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Trusted by 500+ Library Owners & Administrators
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              Engineered with reliability and ease-of-use at its core, enabling study center owners to focus on providing great learning environments.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <StatCard number="500+" label="Active Libraries" icon={<Building2 className="h-5 w-5 text-indigo-400" />} />
            <StatCard number="50,000+" label="Students Enrolled" icon={<Users className="h-5 w-5 text-indigo-400" />} />
            <StatCard number="2.5M+" label="QR Scans Logged" icon={<QrCode className="h-5 w-5 text-indigo-400" />} />
            <StatCard number="99.99%" label="System Uptime" icon={<Shield className="h-5 w-5 text-indigo-400" />} />
          </div>

          {/* Testimonial / Quote Card */}
          <div className="max-w-3xl mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center relative shadow-xl">
            <div className="flex justify-center mb-4 gap-1 text-amber-400">
              <Star className="h-5 w-5 fill-amber-400" />
              <Star className="h-5 w-5 fill-amber-400" />
              <Star className="h-5 w-5 fill-amber-400" />
              <Star className="h-5 w-5 fill-amber-400" />
              <Star className="h-5 w-5 fill-amber-400" />
            </div>
            <blockquote className="text-lg text-slate-200 italic mb-6">
              "Aarambh SaaS transformed how we manage our 120-seat study hall. Seat double-bookings dropped to zero, and students love the digital QR entry system!"
            </blockquote>
            <div className="font-semibold text-white">Rajesh Kumar</div>
            <div className="text-xs text-slate-400">Founder, Sankalp Reading Room</div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative z-10 py-20 bg-gradient-to-t from-indigo-950/40 to-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-indigo-900/40 border border-indigo-500/30 rounded-3xl p-10 sm:p-16 shadow-2xl backdrop-blur-sm">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6 tracking-tight">
              Ready to Upgrade Your Library System?
            </h2>
            <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
              Get started within minutes. No complex installations needed—everything runs seamlessly in the cloud.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto h-13 px-8 text-base bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-indigo-500/30 border-0 transition-all duration-300 hover:scale-[1.02]">
                  Create Library Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/student-registration">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 px-8 text-base border-slate-700 hover:bg-slate-800 text-slate-200">
                  Register as Student
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                </div>
                <span className="text-lg font-bold text-white">Aarambh Library</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Comprehensive cloud platform designed for commercial libraries, study centers, and reading halls.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li><Link href="#features" className="hover:text-indigo-400 transition-colors">Features</Link></li>
                <li><Link href="#preview" className="hover:text-indigo-400 transition-colors">Seat Grid Preview</Link></li>
                <li><Link href="#student-portal" className="hover:text-indigo-400 transition-colors">Student Portal</Link></li>
                <li><Link href="/student-registration" className="hover:text-indigo-400 transition-colors">Student Registration</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Account & Support</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li><Link href="/auth/signin" className="hover:text-indigo-400 transition-colors">Sign In</Link></li>
                <li><Link href="/auth/signup" className="hover:text-indigo-400 transition-colors">Get Started</Link></li>
                <li><Link href="#" className="hover:text-indigo-400 transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-indigo-400 transition-colors">Help & Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
              <p className="text-xs text-slate-400 mb-2">Need help setting up your library?</p>
              <p className="text-xs font-semibold text-indigo-400">support@aarambhlibrary.com</p>
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>&copy; {new Date().getFullYear()} Aarambh Library SaaS. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  badge,
  title,
  description,
}: {
  icon: React.ReactNode;
  badge: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="bg-slate-900/60 border-slate-800/80 hover:border-indigo-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-950/50 group">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-indigo-500/30 transition-colors">
            {icon}
          </div>
          <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
            {badge}
          </span>
        </div>
        <CardTitle className="text-xl text-white group-hover:text-indigo-300 transition-colors">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-slate-400 text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

function StatCard({ number, label, icon }: { number: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 text-center hover:border-slate-700 transition-colors">
      <div className="inline-flex items-center justify-center p-2 rounded-xl bg-indigo-500/10 mb-3">
        {icon}
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold text-white mb-1">{number}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}