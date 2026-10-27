'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QRCodeSVG } from 'qrcode.react';
import {
  GraduationCap,
  Armchair,
  Clock,
  CreditCard,
  Calendar,
  LogOut,
  Download,
  CheckCircle2,
  AlertCircle,
  Shield,
  Wifi,
  Phone,
  Mail,
  MapPin,
  Loader2,
  RefreshCw,
  LayoutDashboard,
  User,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

interface StudentData {
  id: string;
  name: string;
  email: string;
  phone: string;
  seatNumber: string;
  qrCode: string;
  startTime: string;
  endTime: string;
  selectedShifts: { startTime: string; endTime: string; label?: string }[];
  feeStatus: string;
  feeAmount: number;
  feeDueDate?: string;
  subscriptionPlan: string;
  subscriptionExpiry?: string;
  joinDate?: string;
  isActive: boolean;
}

interface AttendanceRecord {
  _id?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  duration?: number;
  status?: string;
}

interface LibraryInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  checkInTime: string;
  checkOutTime: string;
}

function formatTime(timeStr?: string) {
  if (!timeStr) return '--:--';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0]);
  const m = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateTimeStr?: string) {
  if (!dateTimeStr) return '--:--';
  try {
    const d = new Date(dateTimeStr);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateTimeStr;
  }
}

export default function StudentPortalPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [library, setLibrary] = useState<LibraryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      fetchStudentData(user.email, user.studentId || user.id);
    } catch (e) {
      router.push('/auth/signin');
    }
  }, [router]);

  const fetchStudentData = async (email: string, studentId?: string) => {
    setLoading(true);
    setError('');

    try {
      const queryParam = studentId ? `id=${studentId}` : `email=${encodeURIComponent(email)}`;
      const res = await fetch(`/api/student-portal/me?${queryParam}`);
      const data = await res.json();

      if (data.success) {
        setStudent(data.data.student);
        setAttendance(data.data.attendance || []);
        setLibrary(data.data.library);
      } else {
        // If not found by ID, retry by email fallback
        if (studentId && email) {
          const fallbackRes = await fetch(`/api/student-portal/me?email=${encodeURIComponent(email)}`);
          const fallbackData = await fallbackRes.json();
          if (fallbackData.success) {
            setStudent(fallbackData.data.student);
            setAttendance(fallbackData.data.attendance || []);
            setLibrary(fallbackData.data.library);
            return;
          }
        }
        setError(data.error || 'Failed to load your student profile');
      }
    } catch (err) {
      console.error('Error fetching student profile:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    router.push('/auth/signin');
  };

  const downloadQR = () => {
    const svg = document.getElementById('student-portal-qr');
    if (svg && student) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${student.name.replace(/\s+/g, '_')}_QR_Pass.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-300">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-base font-medium">Loading your student portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo href="/student-portal" size="md" />
            <span className="hidden sm:inline-block text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Student Member
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* If user is admin/staff testing, show quick link to dashboard */}
            {(currentUser?.role === 'admin' || currentUser?.role === 'staff') && (
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="border-indigo-600 text-indigo-400 hover:bg-indigo-950/40">
                  <LayoutDashboard className="h-4 w-4 mr-1.5" />
                  Admin Dashboard
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => currentUser && fetchStudentData(currentUser.email, currentUser.studentId)}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* Profile Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/60 border border-indigo-900/40 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
                {student?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {student?.name || currentUser?.name || 'Student Member'}
                  </h1>
                  {student?.isActive ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    {student?.email || currentUser?.email}
                  </span>
                  {student?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      +91 {student.phone}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Assigned Seat</span>
                <span className="text-2xl font-black text-indigo-400">
                  {student?.seatNumber ? student.seatNumber : 'Unassigned'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Main Highlights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Digital QR Entry Pass */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                  <Shield className="h-4 w-4 text-indigo-400" />
                  Gate Access QR Pass
                </CardTitle>
                <Badge variant="outline" className="text-[11px] border-slate-700 text-slate-300">
                  Instant Entry
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-400">
                Scan this code at the library door kiosk/tablet to log check-in & check-out.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center flex-1 space-y-4">
              <div className="p-4 bg-white rounded-2xl shadow-2xl ring-4 ring-indigo-500/20">
                <QRCodeSVG
                  id="student-portal-qr"
                  value={student?.qrCode || `STU-${student?.id || 'DEMO'}`}
                  size={190}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="text-center space-y-1 w-full">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block">Pass ID Code</span>
                <code className="px-3 py-1 bg-slate-950 border border-slate-800 rounded text-sm font-mono text-indigo-300 inline-block font-bold">
                  {student?.qrCode || 'STU-GENERATING'}
                </code>
              </div>

              <Button
                onClick={downloadQR}
                variant="outline"
                className="w-full border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 mt-2"
              >
                <Download className="h-4 w-4 mr-2 text-indigo-400" />
                Download Digital Pass
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Seat & Shift Schedule */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                  <Armchair className="h-4 w-4 text-emerald-400" />
                  Seat & Shift Details
                </CardTitle>
                <Badge variant="outline" className="text-[11px] border-slate-700 text-slate-300">
                  Desk Allocation
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-400">
                Your designated study space and library operating hours
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 flex-1">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Desk Number</span>
                  <span className="text-xl font-bold text-white">
                    {student?.seatNumber ? `Desk ${student.seatNumber}` : 'Pending Assignment'}
                  </span>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                  <Armchair className="h-5 w-5" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-400" />
                    Shift Timing
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {formatTime(student?.startTime)} - {formatTime(student?.endTime)}
                  </span>
                </div>

                {student?.selectedShifts && student.selectedShifts.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-500 block mb-1.5 font-medium">Selected Shift Slots:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {student.selectedShifts.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium text-[11px]">
                          {s.label || `Slot ${idx + 1}`}: {formatTime(s.startTime)} - {formatTime(s.endTime)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Library Opens:</span>
                  <span className="font-semibold text-slate-200">{library?.checkInTime || '08:00 AM'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Library Closes:</span>
                  <span className="font-semibold text-slate-200">{library?.checkOutTime || '10:00 PM'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Subscription & Fee Status */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                  <CreditCard className="h-4 w-4 text-purple-400" />
                  Subscription & Fees
                </CardTitle>
                <Badge
                  className={`text-[11px] capitalize ${
                    student?.feeStatus === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : student?.feeStatus === 'partial'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}
                >
                  {student?.feeStatus || 'Unpaid'}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-400">
                Membership plan billing status and renewal date
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 flex-1">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Current Plan</span>
                  <span className="text-xl font-bold text-white capitalize">
                    {student?.subscriptionPlan || 'Standard'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium block">Monthly Fee</span>
                  <span className="text-xl font-black text-indigo-400">
                    ₹{student?.feeAmount || 0}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Fee Due Date:</span>
                  <span className="font-semibold text-slate-200">
                    {formatDate(student?.feeDueDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Subscription Validity:</span>
                  <span className="font-semibold text-slate-200">
                    {formatDate(student?.subscriptionExpiry)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Member Since:</span>
                  <span className="font-semibold text-slate-200">
                    {formatDate(student?.joinDate)}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-300/90 leading-relaxed">
                💡 To renew or upgrade your seat subscription, please visit the library front desk or speak with the library manager.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records Section */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                  <Calendar className="h-5 w-5 text-indigo-400" />
                  My Recent Attendance History
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Your daily gate check-in and check-out logs
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
                Total Logs: {attendance.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {attendance.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Calendar className="h-10 w-10 mx-auto text-slate-600" />
                <p className="text-sm font-medium">No attendance records yet.</p>
                <p className="text-xs text-slate-600">Scan your QR code at the entrance kiosk to record your first visit!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase font-semibold">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Check-In</th>
                      <th className="py-3 px-4">Check-Out</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {attendance.map((record, index) => {
                      const durationMinutes = record.duration || (record.checkIn && record.checkOut ? Math.round((new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / 60000) : null);
                      const hours = durationMinutes ? Math.floor(durationMinutes / 60) : 0;
                      const mins = durationMinutes ? durationMinutes % 60 : 0;

                      return (
                        <tr key={record._id || index} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-200">
                            {formatDate(record.date || record.checkIn)}
                          </td>
                          <td className="py-3 px-4 text-emerald-400 font-mono text-xs">
                            {formatDateTime(record.checkIn)}
                          </td>
                          <td className="py-3 px-4 text-purple-400 font-mono text-xs">
                            {record.checkOut ? formatDateTime(record.checkOut) : (
                              <span className="text-amber-400 text-xs">Active Session</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-300 text-xs">
                            {durationMinutes ? `${hours}h ${mins}m` : '--'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Verified
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Library Info & Wi-Fi guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <Wifi className="h-4 w-4 text-indigo-400" />
                Library Wi-Fi & Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <p>• Connect to <strong>Aarambh-Member-WiFi</strong> with your registered device.</p>
              <p>• Maintain absolute silence in the main study hall.</p>
              <p>• Keep mobile phones on silent/vibrate mode at all times.</p>
              <p>• Food and non-water beverages are restricted to the dining area.</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <MapPin className="h-4 w-4 text-indigo-400" />
                Library Helpdesk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-400">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                <span>Support: {library?.phone || '+91 9876543210'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                <span>Email: {library?.email || 'info@aarambhlibrary.com'}</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                <span>{library?.address || 'Aarambh Library Study Center'}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
