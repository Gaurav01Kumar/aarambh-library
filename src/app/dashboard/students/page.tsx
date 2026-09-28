'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, Plus, MoreVertical, Edit, Trash2, QrCode, SmartphoneNfc,
  Users, IndianRupee, UserCheck, UserX, Clock, CalendarDays,
  Mail, Send, Download, X, ChevronLeft, ChevronRight,
  ArrowUpDown, Eye, AlertTriangle, CheckCircle, Loader2,
  Phone, MapPin, CreditCard, FileText, Key
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddStudentDialog } from '@/components/add-student-dialog';
import { EditStudentDialog } from '@/components/edit-student-dialog';
import { QRCodeDisplay } from '@/components/qr-code-display';

// ─── Types ───────────────────────────────────────────────────────────────
interface Student {
  _id: string;
  name: string;
  email: string;
  phone: string;
  seatNumber?: string;
  feeStatus: 'paid' | 'unpaid' | 'partial';
  feeAmount: number;
  feeDueDate?: string;
  subscriptionExpiry?: string;
  subscriptionPlan?: string;
  isActive: boolean;
  joinDate: string;
  createdAt?: string;
  startTime?: string;
  endTime?: string;
  selectedShifts?: { startTime: string; endTime: string; label?: string }[];
  profileImage?: string;
  qrCode?: string;
  idProof?: string;
  idProofNumber?: string;
}

interface PaymentRecord {
  _id: string;
  amount: number;
  totalPrice: number;
  months: number;
  paymentMethod: string;
  date: string;
  status: string;
  transactionId?: string;
  utr?: string;
  createdAt?: string;
}

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  seatNumber?: string;
  status?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────
function formatTime(timeStr?: string) {
  if (!timeStr) return '--:--';
  const [h, m] = timeStr.split(':');
  if (!h || !m) return timeStr;
  let hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isPaymentPending(student: Student) {
  if (student.feeStatus !== 'paid') return true;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (!student.feeDueDate && !student.subscriptionExpiry) return true;
  if (student.feeDueDate) { const d = new Date(student.feeDueDate); d.setHours(0,0,0,0); if (d < today) return true; }
  if (student.subscriptionExpiry) { const e = new Date(student.subscriptionExpiry); e.setHours(0,0,0,0); if (e < today) return true; }
  return false;
}

function isExpiringSoon(student: Student) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today); weekFromNow.setDate(weekFromNow.getDate() + 7);
  const check = (d?: string) => { if (!d) return false; const dt = new Date(d); dt.setHours(0,0,0,0); return dt >= today && dt <= weekFromNow; };
  return check(student.feeDueDate) || check(student.subscriptionExpiry);
}

// ─── Email Templates ────────────────────────────────────────────────────
const emailTemplates = [
  { id: 'custom', label: 'Custom Message', subject: '', message: '' },
  { id: 'fee_reminder', label: 'Fee Reminder', subject: '⏰ Fee Payment Reminder — Aarambh Library', message: 'This is a friendly reminder that your library membership fee is due. Please make the payment at your earliest convenience to continue enjoying uninterrupted access to all library facilities.\n\nYou can pay at the library reception or via online transfer. If you have already made the payment, please disregard this message.' },
  { id: 'welcome', label: 'Welcome Message', subject: '🎉 Welcome to Aarambh Library!', message: 'Welcome to the Aarambh Library family! We are thrilled to have you as a member.\n\nYour seat has been assigned and your account is now active. Please remember to mark your attendance daily using the QR code or seat number.\n\nIf you have any questions or need assistance, feel free to reach out to us anytime.' },
  { id: 'attendance_warning', label: 'Attendance Warning', subject: '⚠️ Attendance Notice — Aarambh Library', message: 'We noticed that your attendance has been irregular recently. Regular attendance is important to maintain your seat reservation.\n\nPlease ensure you are marking your attendance daily. If you are facing any issues or need to update your schedule, please contact the library administration.' },
  { id: 'deactivation', label: 'Account Deactivation', subject: '🔒 Account Deactivation Notice', message: 'We regret to inform you that your library membership account has been temporarily deactivated due to pending fee payment.\n\nTo reactivate your account and retain your seat, please clear your pending dues at the earliest. Contact us if you need any assistance or wish to discuss a payment plan.' },
];

// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function StudentsPage() {
  // ─── State ──────────────────────────────────────────────────────────
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalStudents, setTotalStudents] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));

  // Detail panel
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState('profile');
  const [studentPayments, setStudentPayments] = useState<PaymentRecord[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // QR Code
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrStudent, setQrStudent] = useState<Student | null>(null);

  // Send Email
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailStudent, setEmailStudent] = useState<Student | null>(null);
  const [emailTemplate, setEmailTemplate] = useState('custom');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');

  // Set Password
  const [setPasswordOpen, setSetPasswordOpen] = useState(false);
  const [setPasswordStudent, setSetPasswordStudent] = useState<Student | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [setPasswordSaving, setSetPasswordSaving] = useState(false);
  const [setPasswordError, setSetPasswordError] = useState('');

  // Edit Student Dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // ─── Fetch Students ─────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('feeStatus', filterStatus);
      if (filterActive !== 'all') params.append('isActive', filterActive === 'active' ? 'true' : 'false');
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());

      const response = await fetch(`/api/students?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
        setTotalStudents(data.pagination?.total || data.data.length);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatus, filterActive, page, pageSize]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchTerm, filterStatus, filterActive, pageSize]);

  // ─── Sort Students (client-side) ───────────────────────────────────
  const sortedStudents = [...students].sort((a, b) => {
    switch (sortBy) {
      case 'name_az': return a.name.localeCompare(b.name);
      case 'name_za': return b.name.localeCompare(a.name);
      case 'newest': return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
      case 'oldest': return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
      case 'fee_high': return b.feeAmount - a.feeAmount;
      case 'fee_low': return a.feeAmount - b.feeAmount;
      case 'seat': return (a.seatNumber || '').localeCompare(b.seatNumber || '');
      default: return 0;
    }
  });

  // ─── Stats ──────────────────────────────────────────────────────────
  const paidCount = students.filter(s => !isPaymentPending(s)).length;
  const unpaidCount = students.filter(s => isPaymentPending(s)).length;
  const expiringSoonCount = students.filter(s => isExpiringSoon(s)).length;
  const totalRevenue = students.reduce((sum, s) => sum + (s.feeAmount || 0), 0);
  const activeCount = students.filter(s => s.isActive).length;

  // ─── Actions ────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      const response = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (response.ok) { setStudents(students.filter(s => s._id !== id)); if (selectedStudent?._id === id) setDetailOpen(false); }
    } catch (error) { console.error('Error deleting student:', error); }
  };

  const handleResetDevice = async (id: string) => {
    if (!confirm('Reset the registered device for this student?')) return;
    try {
      const response = await fetch(`/api/students/${id}/reset-device`, { method: 'POST' });
      const data = await response.json();
      alert(data.success ? 'Device reset successfully' : (data.error || 'Failed'));
    } catch { alert('Network error'); }
  };

  const handleSendPasswordReset = async (email: string) => {
    if (!confirm('Send a password setup/reset email to this student?')) return;
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      alert(data.success ? 'Password reset email sent successfully' : (data.error || 'Failed to send email'));
    } catch { alert('Network error'); }
  };

  const openSetPasswordDialog = (student: Student) => {
    setSetPasswordStudent(student);
    setNewPassword('');
    setSetPasswordError('');
    setSetPasswordOpen(true);
  };

  const handleSetPasswordSave = async () => {
    if (!setPasswordStudent || newPassword.length < 6) {
      setSetPasswordError('Password must be at least 6 characters long');
      return;
    }
    setSetPasswordSaving(true);
    setSetPasswordError('');
    try {
      const response = await fetch(`/api/students/${setPasswordStudent._id}/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Password set successfully for ' + setPasswordStudent.name);
        setSetPasswordOpen(false);
      } else {
        setSetPasswordError(data.error || 'Failed to set password');
      }
    } catch (error) {
      setSetPasswordError('Network error occurred');
    } finally {
      setSetPasswordSaving(false);
    }
  };
  const handleToggleActive = async (student: Student) => {
    const action = student.isActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} ${student.name}?`)) return;
    try {
      const response = await fetch(`/api/students/${student._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !student.isActive }),
      });
      if (response.ok) fetchStudents();
    } catch (error) { console.error('Error toggling active:', error); }
  };

  // ─── Detail Panel ───────────────────────────────────────────────────
  const openDetail = async (student: Student) => {
    setSelectedStudent(student);
    setDetailOpen(true);
    setDetailTab('profile');
    setLoadingDetail(true);
    try {
      const [paymentsRes, attendanceRes] = await Promise.all([
        fetch(`/api/students/${student._id}/payments`),
        fetch(`/api/students/${student._id}/attendance`),
      ]);
      const [paymentsData, attendanceData] = await Promise.all([paymentsRes.json(), attendanceRes.json()]);
      setStudentPayments(paymentsData.success ? paymentsData.data : []);
      setStudentAttendance(attendanceData.success ? attendanceData.data : []);
    } catch { setStudentPayments([]); setStudentAttendance([]); }
    finally { setLoadingDetail(false); }
  };

  // ─── Send Email ─────────────────────────────────────────────────────
  const openEmailDialog = (student: Student) => {
    setEmailStudent(student);
    setEmailTemplate('custom');
    setEmailSubject('');
    setEmailMessage('');
    setEmailSuccess('');
    setEmailOpen(true);
  };

  const handleTemplateChange = (templateId: string) => {
    setEmailTemplate(templateId);
    const tpl = emailTemplates.find(t => t.id === templateId);
    if (tpl) { setEmailSubject(tpl.subject); setEmailMessage(tpl.message); }
  };

  const handleSendEmail = async () => {
    if (!emailStudent || !emailSubject || !emailMessage) return;
    setSendingEmail(true);
    setEmailSuccess('');
    try {
      const response = await fetch(`/api/students/${emailStudent._id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: emailSubject, message: emailMessage, template: emailTemplate }),
      });
      const data = await response.json();
      if (data.success) {
        setEmailSuccess(`Email sent to ${emailStudent.email}`);
        setTimeout(() => setEmailOpen(false), 2000);
      } else {
        alert(data.error || 'Failed to send email');
      }
    } catch { alert('Network error while sending email'); }
    finally { setSendingEmail(false); }
  };

  // ─── CSV Export ─────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Seat', 'Plan', 'Fee Status', 'Fee Amount', 'Due Date', 'Join Date', 'Active'];
    const rows = sortedStudents.map(s => [
      s.name, s.email, s.phone, s.seatNumber || '', s.subscriptionPlan || '',
      isPaymentPending(s) ? 'Unpaid/Overdue' : 'Paid', s.feeAmount,
      s.feeDueDate ? formatDate(s.feeDueDate) : '', formatDate(s.joinDate), s.isActive ? 'Yes' : 'No'
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `students_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── QR Code ────────────────────────────────────────────────────────
  const handleViewQR = (student: Student) => {
    setQrStudent(student);
    setShowQRCode(true);
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage library students, payments & attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
          <AddStudentDialog onStudentAdded={fetchStudents} />
        </div>
      </div>

      {/* ── Stats Cards ─────────────────────────────────────────────── */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold mt-0.5">{totalStudents}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                <Users className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Paid</p>
                <p className="text-2xl font-bold text-emerald-600 mt-0.5">{paidCount}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                <UserCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Unpaid</p>
                <p className="text-2xl font-bold text-rose-600 mt-0.5">{unpaidCount}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
                <UserX className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Expiring</p>
                <p className="text-2xl font-bold text-amber-600 mt-0.5">{expiringSoonCount}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Revenue</p>
                <p className="text-2xl font-bold text-violet-600 mt-0.5">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-950 flex items-center justify-center">
                <IndianRupee className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-sky-500">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Active</p>
                <p className="text-2xl font-bold text-sky-600 mt-0.5">{activeCount}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-sky-100 dark:bg-sky-950 flex items-center justify-center">
                <CheckCircle className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search by name, email, phone, seat..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Fee Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort By" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name_az">Name A → Z</SelectItem>
                <SelectItem value="name_za">Name Z → A</SelectItem>
                <SelectItem value="fee_high">Fee High → Low</SelectItem>
                <SelectItem value="fee_low">Fee Low → High</SelectItem>
                <SelectItem value="seat">Seat Number</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Students Table ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Students ({totalStudents})</CardTitle>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Show</span>
              <Select value={pageSize.toString()} onValueChange={v => setPageSize(parseInt(v))}>
                <SelectTrigger className="h-7 w-[65px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading students...
            </div>
          ) : sortedStudents.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No students found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="w-[200px]">Student</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Seat</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Fee Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedStudents.map(student => {
                      const pending = isPaymentPending(student);
                      const expiring = isExpiringSoon(student);
                      const isOverdue = pending && student.feeStatus === 'paid';
                      return (
                        <TableRow key={student._id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors" onClick={() => openDetail(student)}>
                          {/* Name + email */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                                {student.profileImage ? (
                                  <img src={student.profileImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate flex items-center gap-1.5">
                                  {student.name}
                                  {!student.isActive && <Badge variant="outline" className="text-[9px] px-1 py-0 text-slate-400 border-slate-300">Inactive</Badge>}
                                </p>
                                <a href={`mailto:${student.email}`} onClick={e => e.stopPropagation()} className="text-[11px] text-slate-400 hover:text-primary truncate block">{student.email}</a>
                              </div>
                            </div>
                          </TableCell>
                          {/* Phone */}
                          <TableCell>
                            <a href={`tel:${student.phone}`} onClick={e => e.stopPropagation()} className="text-sm hover:text-primary">{student.phone}</a>
                          </TableCell>
                          {/* Seat */}
                          <TableCell className="text-sm font-medium">{student.seatNumber || '-'}</TableCell>
                          {/* Shift */}
                          <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                            {student.startTime ? `${formatTime(student.startTime)} - ${formatTime(student.endTime)}` : '-'}
                          </TableCell>
                          {/* Plan */}
                          <TableCell className="text-xs">{student.subscriptionPlan || '-'}</TableCell>
                          {/* Fee Status */}
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              !pending
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : isOverdue
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                            }`}>
                              {!pending ? 'Paid' : isOverdue ? 'Overdue' : student.feeStatus}
                              {expiring && <AlertTriangle className="h-3 w-3" />}
                            </span>
                          </TableCell>
                          {/* Amount */}
                          <TableCell className="font-semibold text-sm">₹{student.feeAmount.toLocaleString()}</TableCell>
                          {/* Due Date */}
                          <TableCell className="text-xs">
                            {student.feeDueDate ? (
                              <span className={pending ? 'text-rose-600 font-medium' : ''}>{formatDate(student.feeDueDate)}</span>
                            ) : '-'}
                          </TableCell>
                          {/* Joined */}
                          <TableCell className="text-xs text-slate-500">{formatDate(student.joinDate)}</TableCell>
                          {/* Actions */}
                          <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                                title="Edit Student"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingStudent(student);
                                  setEditOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => { setEditingStudent(student); setEditOpen(true); }}>
                                    <Edit className="h-4 w-4 mr-2 text-indigo-600" /> Edit Student
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openDetail(student)}>
                                    <Eye className="h-4 w-4 mr-2" /> View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleViewQR(student)}>
                                    <QrCode className="h-4 w-4 mr-2" /> View QR Code
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEmailDialog(student)}>
                                    <Mail className="h-4 w-4 mr-2" /> Send Email
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleResetDevice(student._id)}>
                                    <SmartphoneNfc className="h-4 w-4 mr-2" /> Reset Device
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openSetPasswordDialog(student)}>
                                    <Key className="h-4 w-4 mr-2" /> Set Password
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSendPasswordReset(student.email)}>
                                    <Key className="h-4 w-4 mr-2" /> Send Reset Link
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleActive(student)}>
                                    {student.isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                                    {student.isActive ? 'Deactivate' : 'Activate'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(student._id)}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t mt-2">
                <p className="text-xs text-slate-500">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalStudents)} of {totalStudents}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) { pageNum = i + 1; }
                    else if (page <= 3) { pageNum = i + 1; }
                    else if (page >= totalPages - 2) { pageNum = totalPages - 4 + i; }
                    else { pageNum = page - 2 + i; }
                    return (
                      <Button key={pageNum} variant={page === pageNum ? 'default' : 'outline'} size="sm" className="h-8 w-8 p-0 text-xs" onClick={() => setPage(pageNum)}>
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ═══ Student Detail Slide-Over Panel ═══════════════════════════ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0">
          {selectedStudent && (
            <>
              {/* Profile Header */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl font-bold flex-shrink-0 overflow-hidden border-2 border-white/30">
                    {selectedStudent.profileImage ? (
                      <img src={selectedStudent.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      selectedStudent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold truncate">{selectedStudent.name}</h2>
                    <p className="text-white/70 text-sm truncate">{selectedStudent.email}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedStudent.phone}</span>
                      {selectedStudent.seatNumber && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Seat {selectedStudent.seatNumber}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Badge className={`text-[10px] ${selectedStudent.isActive ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/30' : 'bg-rose-500/20 text-rose-100 border-rose-400/30'}`}>
                      {selectedStudent.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge className={`text-[10px] ${!isPaymentPending(selectedStudent) ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/30' : 'bg-rose-500/20 text-rose-100 border-rose-400/30'}`}>
                      {!isPaymentPending(selectedStudent) ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 px-6 py-3 border-b bg-slate-50 dark:bg-slate-900/50 overflow-x-auto">
                <Button size="sm" variant="outline" className="text-xs h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200" onClick={() => { setEditingStudent(selectedStudent); setEditOpen(true); }}>
                  <Edit className="h-3.5 w-3.5 mr-1" /> Edit Profile
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => openEmailDialog(selectedStudent)}>
                  <Mail className="h-3.5 w-3.5 mr-1" /> Email
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleViewQR(selectedStudent)}>
                  <QrCode className="h-3.5 w-3.5 mr-1" /> QR Code
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleResetDevice(selectedStudent._id)}>
                  <SmartphoneNfc className="h-3.5 w-3.5 mr-1" /> Reset Device
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => openSetPasswordDialog(selectedStudent)}>
                  <Key className="h-3.5 w-3.5 mr-1" /> Set Password
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleSendPasswordReset(selectedStudent.email)}>
                  <Key className="h-3.5 w-3.5 mr-1" /> Send Reset Link
                </Button>
                <Button size="sm" variant={selectedStudent.isActive ? 'outline' : 'default'} className="text-xs h-8" onClick={() => handleToggleActive(selectedStudent)}>
                  {selectedStudent.isActive ? <UserX className="h-3.5 w-3.5 mr-1" /> : <UserCheck className="h-3.5 w-3.5 mr-1" />}
                  {selectedStudent.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>

              {/* Tabs */}
              <div className="p-6">
                <Tabs value={detailTab} onValueChange={setDetailTab}>
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  </TabsList>

                  {/* Profile Tab */}
                  <TabsContent value="profile" className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem label="Full Name" value={selectedStudent.name} />
                      <InfoItem label="Email" value={selectedStudent.email} />
                      <InfoItem label="Phone" value={selectedStudent.phone} />
                      <InfoItem label="Seat Number" value={selectedStudent.seatNumber || '-'} />
                      <InfoItem label="Shift Timing" value={selectedStudent.startTime ? `${formatTime(selectedStudent.startTime)} - ${formatTime(selectedStudent.endTime)}` : '-'} />
                      <InfoItem label="Subscription Plan" value={selectedStudent.subscriptionPlan || '-'} />
                      <InfoItem label="Monthly Fee" value={`₹${selectedStudent.feeAmount.toLocaleString()}`} />
                      <InfoItem label="Fee Status" value={isPaymentPending(selectedStudent) ? 'Unpaid / Overdue' : 'Paid'} valueClass={isPaymentPending(selectedStudent) ? 'text-rose-600' : 'text-emerald-600'} />
                      <InfoItem label="Due Date" value={formatDate(selectedStudent.feeDueDate)} />
                      <InfoItem label="Join Date" value={formatDate(selectedStudent.joinDate)} />
                      <InfoItem label="ID Proof" value={selectedStudent.idProof || '-'} />
                      <InfoItem label="ID Number" value={selectedStudent.idProofNumber || '-'} />
                    </div>
                    {selectedStudent.selectedShifts && selectedStudent.selectedShifts.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500 mb-2">Selected Shifts</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedStudent.selectedShifts.map((shift, i) => (
                            <Badge key={i} variant="outline" className="text-xs py-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {shift.label || `Shift ${i + 1}`}: {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Payments Tab */}
                  <TabsContent value="payments" className="mt-4">
                    {loadingDetail ? (
                      <div className="flex items-center justify-center py-12 text-slate-400">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
                      </div>
                    ) : studentPayments.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No payment records found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {studentPayments.map(p => (
                          <div key={p._id} className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${p.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-amber-100 dark:bg-amber-950'}`}>
                                <CreditCard className={`h-4 w-4 ${p.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">₹{p.totalPrice.toLocaleString()}</p>
                                <p className="text-[11px] text-slate-400">{p.months} month{p.months > 1 ? 's' : ''} • {p.paymentMethod?.toUpperCase()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium">{formatDate(p.date)}</p>
                              {p.utr && <p className="text-[10px] text-slate-400 font-mono">{p.utr.slice(0, 16)}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Attendance Tab */}
                  <TabsContent value="attendance" className="mt-4">
                    {loadingDetail ? (
                      <div className="flex items-center justify-center py-12 text-slate-400">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
                      </div>
                    ) : studentAttendance.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No attendance records found</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {studentAttendance.map(a => (
                          <div key={a._id} className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-sky-100 dark:bg-sky-950 flex items-center justify-center">
                                <CalendarDays className="h-4 w-4 text-sky-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{formatDate(a.date)}</p>
                                <p className="text-[11px] text-slate-400">
                                  {a.checkIn ? `Check-in: ${new Date(a.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'No check-in'}
                                  {a.checkOut ? ` • Check-out: ${new Date(a.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className={`text-[10px] ${a.status === 'present' ? 'text-emerald-600 border-emerald-300' : 'text-slate-500'}`}>
                              {a.status || 'Present'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ QR Code Dialog ═══════════════════════════════════════════ */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student QR Code</DialogTitle>
          </DialogHeader>
          {qrStudent && (
            <QRCodeDisplay
              value={qrStudent.qrCode || qrStudent._id}
              title={`${qrStudent.name}'s QR Code`}
              studentId={qrStudent._id}
              onClose={() => setShowQRCode(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Send Email Dialog ════════════════════════════════════════ */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Send Email to {emailStudent?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {emailSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">{emailSuccess}</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Template</Label>
                  <Select value={emailTemplate} onValueChange={handleTemplateChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {emailTemplates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input id="email-subject" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Email subject..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-message">Message</Label>
                  <textarea
                    id="email-message"
                    value={emailMessage}
                    onChange={e => setEmailMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={6}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 text-xs text-slate-500">
                  <p>📧 Sending to: <span className="font-medium text-slate-700 dark:text-slate-300">{emailStudent?.email}</span></p>
                </div>
              </>
            )}
          </div>
          {!emailSuccess && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setEmailOpen(false)} disabled={sendingEmail}>Cancel</Button>
              <Button onClick={handleSendEmail} disabled={sendingEmail || !emailSubject || !emailMessage}>
                {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
                {sendingEmail ? 'Sending...' : 'Send Email'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Set Password Dialog ════════════════════════════════════════ */}
      <Dialog open={setPasswordOpen} onOpenChange={setSetPasswordOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Set Password for {setPasswordStudent?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password" 
                type="text" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Enter new password (min. 6 chars)" 
              />
            </div>
            {setPasswordError && (
              <div className="p-3 text-sm bg-red-50 text-red-600 border border-red-200 rounded-md">
                {setPasswordError}
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSetPasswordOpen(false)} disabled={setPasswordSaving}>Cancel</Button>
            <Button onClick={handleSetPasswordSave} disabled={setPasswordSaving || newPassword.length < 6}>
              {setPasswordSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
              {setPasswordSaving ? 'Saving...' : 'Save Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Edit Student Dialog ════════════════════════════════════════ */}
      <EditStudentDialog
        student={editingStudent}
        open={editOpen}
        onOpenChange={setEditOpen}
        onStudentUpdated={() => {
          fetchStudents();
          if (selectedStudent && editingStudent && selectedStudent._id === editingStudent._id) {
            // refresh selected student details
            fetch(`/api/students/${selectedStudent._id}`)
              .then(r => r.json())
              .then(d => { if (d.success) setSelectedStudent(d.data); });
          }
        }}
      />
    </div>
  );
}

// ─── Info Item Component ────────────────────────────────────────────────
function InfoItem({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}