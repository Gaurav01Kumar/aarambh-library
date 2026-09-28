'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  Send,
  Mail,
  Eye,
  Edit3,
  Clock,
  IndianRupee,
  Users,
  Loader2,
  X,
  RefreshCw,
} from 'lucide-react';

interface Reminder {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    seatNumber: string;
    feeAmount?: number;
  } | null;
  dueDate: string;
  amount: number;
  status: string;
  reminderType: string;
  sentVia: string[];
  sentDate?: string;
  message?: string;
  emailTemplate?: string;
  createdAt: string;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  phone: string;
  seatNumber: string;
  feeStatus: string;
  feeAmount: number;
  feeDueDate: string;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Selected student / reminder for sending
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');

  // Create form data
  const [formData, setFormData] = useState({
    studentId: '',
    dueDate: '',
    amount: '',
    reminderType: 'first',
    message: '',
  });

  // Edit form data
  const [editData, setEditData] = useState({
    id: '',
    dueDate: '',
    amount: '',
    reminderType: 'first',
    status: 'pending',
    message: '',
  });

  // Send form data
  const [sendData, setSendData] = useState({
    reminderType: 'first',
    amount: '',
    dueDate: '',
    message: '',
  });

  useEffect(() => {
    fetchReminders();
    fetchAllStudents();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/fee-reminders?limit=100');
      const data = await response.json();
      if (data.success) {
        setReminders(data.data);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await fetch('/api/students?limit=200');
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // Create new reminder
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/fee-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: formData.studentId,
          amount: parseFloat(formData.amount),
          dueDate: formData.dueDate,
          reminderType: formData.reminderType,
          message: formData.message,
          status: 'pending',
        }),
      });
      if (response.ok) {
        setCreateDialogOpen(false);
        resetCreateForm();
        fetchReminders();
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
    } finally {
      setSaving(false);
    }
  };

  // Edit existing reminder
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/fee-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: editData.id,
          amount: parseFloat(editData.amount),
          dueDate: editData.dueDate,
          reminderType: editData.reminderType,
          status: editData.status,
          message: editData.message,
        }),
      });
      if (response.ok) {
        setEditDialogOpen(false);
        fetchReminders();
      }
    } catch (error) {
      console.error('Error editing reminder:', error);
    } finally {
      setSaving(false);
    }
  };

  // Send reminder email
  const handleSendReminder = async (studentOrReminder: Student | Reminder, isReminder = false) => {
    setSending(true);
    setSendResult(null);
    try {
      const payload: any = {};

      if (isReminder) {
        const rem = studentOrReminder as Reminder;
        payload.reminderId = rem._id;
        payload.reminderType = sendData.reminderType || rem.reminderType;
        payload.amount = sendData.amount ? parseFloat(sendData.amount) : rem.amount;
        payload.dueDate = sendData.dueDate || rem.dueDate;
        payload.message = sendData.message;
      } else {
        const stu = studentOrReminder as Student;
        payload.studentId = stu._id;
        payload.reminderType = sendData.reminderType;
        payload.amount = sendData.amount ? parseFloat(sendData.amount) : stu.feeAmount;
        payload.dueDate = sendData.dueDate || stu.feeDueDate;
        payload.message = sendData.message;
      }

      const response = await fetch('/api/fee-reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setSendResult({ success: data.success, message: data.message || data.error || 'Unknown result' });

      if (data.success) {
        fetchReminders();
        // Show the sent email template
        if (data.emailPreview) {
          setPreviewHtml(data.emailPreview);
        }
      }
    } catch (error) {
      setSendResult({ success: false, message: 'Network error sending reminder' });
    } finally {
      setSending(false);
    }
  };

  // Quick send directly from overdue table
  const handleQuickSend = async (student: Student) => {
    setSelectedStudent(student);
    setSendData({
      reminderType: 'overdue',
      amount: String(student.feeAmount || ''),
      dueDate: student.feeDueDate ? new Date(student.feeDueDate).toISOString().split('T')[0] : '',
      message: '',
    });
    setSendResult(null);
    setPreviewHtml('');
    setSendDialogOpen(true);
  };

  const openEditDialog = (reminder: Reminder) => {
    setEditData({
      id: reminder._id,
      dueDate: reminder.dueDate ? new Date(reminder.dueDate).toISOString().split('T')[0] : '',
      amount: String(reminder.amount),
      reminderType: reminder.reminderType,
      status: reminder.status,
      message: reminder.message || '',
    });
    setSelectedReminder(reminder);
    setEditDialogOpen(true);
  };

  const openSendFromReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setSelectedStudent(null);
    setSendData({
      reminderType: reminder.reminderType,
      amount: String(reminder.amount),
      dueDate: reminder.dueDate ? new Date(reminder.dueDate).toISOString().split('T')[0] : '',
      message: '',
    });
    setSendResult(null);
    setPreviewHtml('');
    setSendDialogOpen(true);
  };

  const openPreview = (reminder: Reminder) => {
    if (reminder.emailTemplate) {
      setPreviewHtml(reminder.emailTemplate);
      setSelectedReminder(reminder);
      setPreviewDialogOpen(true);
    }
  };

  const resetCreateForm = () => {
    setFormData({ studentId: '', dueDate: '', amount: '', reminderType: 'first', message: '' });
  };

  // Filter students: any student whose fee is not fully paid
  const unpaidStudents = students.filter(s => {
    const status = (s.feeStatus || '').toLowerCase();
    return status === 'unpaid' || status === 'partial' || status === 'pending';
  });

  const overdueStudents = unpaidStudents.filter(s => {
    if (!s.feeDueDate) return true; // Unpaid without explicit due date is overdue/due now
    return new Date(s.feeDueDate) <= new Date();
  });

  const upcomingStudents = unpaidStudents.filter(s => {
    if (!s.feeDueDate) return false;
    const dueDate = new Date(s.feeDueDate);
    const now = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  });

  const getDaysOverdue = (dateStr: string) => {
    if (!dateStr) return 0;
    const dueDate = new Date(dateStr);
    if (isNaN(dueDate.getTime())) return 0;
    const days = Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const totalOutstanding = unpaidStudents.reduce((sum, s) => sum + (s.feeAmount || 0), 0);

  const filteredReminders = reminders.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.student?.name?.toLowerCase().includes(term) ||
      r.student?.email?.toLowerCase().includes(term) ||
      r.reminderType?.toLowerCase().includes(term) ||
      r.status?.toLowerCase().includes(term)
    );
  });

  const reminderTypeBadge = (type: string) => {
    const config: Record<string, { label: string; className: string }> = {
      first: { label: '1st Reminder', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      second: { label: '2nd Reminder', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
      final: { label: 'Final', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    };
    const c = config[type] || { label: type, className: 'bg-slate-100 text-slate-800' };
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.className}`}>{c.label}</span>;
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { className: string }> = {
      pending: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      sent: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      overdue: { className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      paid: { className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    };
    const c = config[status] || { className: 'bg-slate-100 text-slate-800' };
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${c.className}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Fee Reminders</h1>
          <p className="text-slate-600 dark:text-slate-400">Track, send, and manage student fee reminders with email templates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => { fetchReminders(); fetchAllStudents(); }} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={(val) => { setCreateDialogOpen(val); if (!val) resetCreateForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Fee Reminder</DialogTitle>
                <DialogDescription>Create a reminder record. You can send the email later.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select value={formData.studentId} onValueChange={(v) => setFormData({ ...formData, studentId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name} — Seat {s.seatNumber || 'N/A'} ({s.feeStatus})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="e.g. 1500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reminder Type</Label>
                  <Select value={formData.reminderType} onValueChange={(v) => setFormData({ ...formData, reminderType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first">First Reminder</SelectItem>
                      <SelectItem value="second">Second Reminder</SelectItem>
                      <SelectItem value="final">Final Reminder</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Custom Message (optional)</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Add a personal note..."
                    rows={2}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Reminder'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-red-100 dark:border-red-950 bg-gradient-to-br from-red-50/50 to-white dark:from-slate-900 dark:to-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Unpaid / Overdue Students
            </CardTitle>
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{unpaidStudents.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              {overdueStudents.length} requiring immediate reminder
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 dark:border-amber-950 bg-gradient-to-br from-amber-50/50 to-white dark:from-slate-900 dark:to-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Total Outstanding Fee
            </CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400">
              <IndianRupee className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500 mt-1">Pending fee collection</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 dark:border-blue-950 bg-gradient-to-br from-blue-50/50 to-white dark:from-slate-900 dark:to-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Emails Sent
            </CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
              <Mail className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {reminders.filter(r => r.status === 'sent').length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Delivered to students</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 dark:border-emerald-950 bg-gradient-to-br from-emerald-50/50 to-white dark:from-slate-900 dark:to-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Total Students
            </CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{students.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              {students.length - unpaidStudents.length} fully paid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Students - Direct Action Cards */}
      {overdueStudents.length > 0 && (
        <Card className="border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5" />
              Unpaid & Overdue Students ({overdueStudents.length})
            </CardTitle>
            <CardDescription className="text-red-600/70 dark:text-red-400/60">
              Students with unpaid fees — click Send Reminder to deliver the personalized email notice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Seat</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueStudents.map(student => (
                    <TableRow key={student._id}>
                      <TableCell className="font-semibold">{student.name}</TableCell>
                      <TableCell className="text-sm">{student.email}</TableCell>
                      <TableCell className="text-sm">{student.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">{student.seatNumber || '-'}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-red-600">₹{student.feeAmount}</TableCell>
                      <TableCell className="text-red-600 text-sm font-medium">
                        {student.feeDueDate ? new Date(student.feeDueDate).toLocaleDateString('en-IN') : 'Due Now (Unpaid)'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="text-xs">
                          {student.feeDueDate ? `${getDaysOverdue(student.feeDueDate)} days` : 'Payment Due'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleQuickSend(student)}
                          className="gap-1.5"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send Reminder
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Due This Week */}
      {upcomingStudents.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Due This Week ({upcomingStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Seat</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingStudents.map(student => (
                    <TableRow key={student._id}>
                      <TableCell className="font-semibold">{student.name}</TableCell>
                      <TableCell className="text-sm">{student.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">{student.seatNumber || '-'}</Badge>
                      </TableCell>
                      <TableCell className="font-bold">₹{student.feeAmount}</TableCell>
                      <TableCell className="text-sm">
                        {student.feeDueDate ? new Date(student.feeDueDate).toLocaleDateString('en-IN') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickSend(student)}
                          className="gap-1.5"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send Reminder
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search reminders by name, email, type, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* All Reminders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            All Reminders ({filteredReminders.length})
          </CardTitle>
          <CardDescription>View all sent and pending reminders. Click actions to edit, re-send, or preview the email template.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading reminders...
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No reminders found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Seat</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent Via</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReminders.map((reminder) => (
                    <TableRow key={reminder._id}>
                      <TableCell className="font-semibold">{reminder.student?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-sm text-slate-500">{reminder.student?.email || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {reminder.student?.seatNumber || reminder.student?.seatNumber || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold">₹{reminder.amount}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(reminder.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>{reminderTypeBadge(reminder.reminderType)}</TableCell>
                      <TableCell>{statusBadge(reminder.status)}</TableCell>
                      <TableCell>
                        {reminder.sentVia && reminder.sentVia.length > 0 ? (
                          <div className="flex gap-1">
                            {reminder.sentVia.map(via => (
                              <Badge key={via} variant="secondary" className="text-[10px] capitalize">
                                {via === 'email' ? <Mail className="h-3 w-3 mr-0.5" /> : null}
                                {via}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {reminder.sentDate ? new Date(reminder.sentDate).toLocaleDateString('en-IN') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(reminder)}
                            title="Edit"
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openSendFromReminder(reminder)}
                            title="Send/Resend Email"
                            className="h-8 w-8 p-0 text-blue-600"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                          {reminder.emailTemplate && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openPreview(reminder)}
                              title="View Sent Email"
                              className="h-8 w-8 p-0 text-purple-600"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Reminder Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              Send Fee Reminder Email
            </DialogTitle>
            <DialogDescription>
              {selectedStudent
                ? `Sending reminder to ${selectedStudent.name} (${selectedStudent.email})`
                : selectedReminder?.student
                ? `Sending reminder to ${selectedReminder.student.name} (${selectedReminder.student.email})`
                : 'Select recipient'}
            </DialogDescription>
          </DialogHeader>

          {sendResult ? (
            <div className="space-y-4 pt-2">
              <div className={`p-4 rounded-xl flex items-start gap-3 ${
                sendResult.success
                  ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300'
                  : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300'
              }`}>
                {sendResult.success ? (
                  <CheckCircle className="h-5 w-5 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-sm">{sendResult.success ? 'Email Sent!' : 'Failed to Send'}</p>
                  <p className="text-xs mt-1">{sendResult.message}</p>
                </div>
              </div>

              {sendResult.success && previewHtml && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Template Sent:</p>
                  <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-[300px] border-0"
                      title="Email Preview"
                      sandbox=""
                    />
                  </div>
                </div>
              )}

              <Button onClick={() => { setSendDialogOpen(false); setSendResult(null); setPreviewHtml(''); }} className="w-full">
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reminder Type</Label>
                  <Select value={sendData.reminderType} onValueChange={(v) => setSendData({ ...sendData, reminderType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first">First Reminder</SelectItem>
                      <SelectItem value="second">Second Reminder</SelectItem>
                      <SelectItem value="final">Final Reminder</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    value={sendData.amount}
                    onChange={(e) => setSendData({ ...sendData, amount: e.target.value })}
                    placeholder="Auto from student"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={sendData.dueDate}
                  onChange={(e) => setSendData({ ...sendData, dueDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Custom Note (optional)</Label>
                <Textarea
                  value={sendData.message}
                  onChange={(e) => setSendData({ ...sendData, message: e.target.value })}
                  placeholder="Add a personal message..."
                  rows={2}
                />
              </div>

              <Button
                onClick={() => {
                  if (selectedStudent) handleSendReminder(selectedStudent, false);
                  else if (selectedReminder) handleSendReminder(selectedReminder, true);
                }}
                disabled={sending}
                className="w-full gap-2"
              >
                {sending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending Email...</>
                ) : (
                  <><Mail className="h-4 w-4" /> Send Reminder Email</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Reminder Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit Reminder — {selectedReminder?.student?.name || 'Unknown'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={editData.dueDate}
                  onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={editData.amount}
                  onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reminder Type</Label>
                <Select value={editData.reminderType} onValueChange={(v) => setEditData({ ...editData, reminderType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first">First</SelectItem>
                    <SelectItem value="second">Second</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Message / Notes</Label>
              <Textarea
                value={editData.message}
                onChange={(e) => setEditData({ ...editData, message: e.target.value })}
                placeholder="Notes..."
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Email Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              Sent Email Template — {selectedReminder?.student?.name || ''}
            </DialogTitle>
            <DialogDescription>
              This is the email that was sent to {selectedReminder?.student?.email || 'the student'}
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[500px] border-0"
              title="Email Preview"
              sandbox=""
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
