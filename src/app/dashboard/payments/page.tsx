'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Loader2, 
  CheckCircle, 
  CreditCard,
  FileText,
  Printer,
  Share2,
  Mail,
  Send,
  Check,
  MessageSquare,
  Building2,
  Copy
} from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  email: string;
  phone: string;
  seatNumber: string;
  feeStatus: string;
  feeAmount: number;
}

interface Payment {
  _id: string;
  studentId: string;
  studentName: string;
  amount: number;
  months: number;
  totalPrice: number;
  paymentMethod: string;
  date: string;
  transactionId?: string;
  receiptNumber?: string;
  status: string;
  createdAt: string;
}

export default function PaymentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Invoice Modal State
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [activePayment, setActivePayment] = useState<Payment | null>(null);
  const [activeStudentDetail, setActiveStudentDetail] = useState<Student | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [formError, setFormError] = useState('');
  const [allowDuplicate, setAllowDuplicate] = useState(false);

  const [formData, setFormData] = useState({
    studentId: '',
    months: '1',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchStudents();
    fetchPayments();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students?limit=100');
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments');
      const data = await response.json();
      if (data.success) {
        setPayments(data.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm) ||
    s.seatNumber.includes(searchTerm)
  );

  const filteredPayments = payments.filter(p =>
    p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.transactionId && p.transactionId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDuplicatePayment = () => {
    if (!formData.studentId || !formData.date) return null;
    const selectedDate = new Date(formData.date);
    if (isNaN(selectedDate.getTime())) return null;
    const selYear = selectedDate.getFullYear();
    const selMonth = selectedDate.getMonth();

    return payments.find(p => {
      if (p.studentId !== formData.studentId) return false;
      const pDate = new Date(p.date);
      return pDate.getFullYear() === selYear && pDate.getMonth() === selMonth;
    });
  };

  const duplicatePayment = getDuplicatePayment();

  const handleStudentSelect = (studentId: string) => {
    const student = students.find(s => s._id === studentId);
    setSelectedStudent(student || null);
    setFormData(prev => ({ ...prev, studentId }));
    setFormError('');
    setAllowDuplicate(false);
  };

  const calculateTotal = () => {
    if (!selectedStudent) return 0;
    const months = parseInt(formData.months) || 1;
    return selectedStudent.feeAmount * months;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (duplicatePayment && !allowDuplicate) {
      const monthName = new Date(formData.date).toLocaleString('default', { month: 'long', year: 'numeric' });
      setFormError(`Payment for ${monthName} has already been recorded for ${selectedStudent?.name}.`);
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          studentId: formData.studentId,
          months: parseInt(formData.months),
          totalPrice: calculateTotal(),
          amount: calculateTotal(),
          allowDuplicate,
        }),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        setDialogOpen(false);
        resetForm();
        fetchPayments();
        fetchStudents();
      } else {
        setFormError(resData.error || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      setFormError('Network error recording payment');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      months: '1',
      paymentMethod: 'cash',
      date: new Date().toISOString().split('T')[0],
    });
    setSelectedStudent(null);
    setFormError('');
    setAllowDuplicate(false);
  };

  // Open Invoice Dialog
  const handleOpenInvoice = (payment: Payment) => {
    setActivePayment(payment);
    const stu = students.find(s => s._id === payment.studentId || s.name === payment.studentName);
    setActiveStudentDetail(stu || null);
    setEmailInput(stu?.email || '');
    setEmailStatus(null);
    setInvoiceModalOpen(true);
  };

  // Print Invoice
  const handlePrintInvoice = () => {
    window.print();
  };

  // Send Invoice Email via Hostinger Webmail SMTP API
  const handleSendInvoiceEmail = async () => {
    if (!activePayment) return;
    if (!emailInput || !emailInput.includes('@')) {
      setEmailStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    try {
      setSendingEmail(true);
      setEmailStatus(null);

      const response = await fetch('/api/payments/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: activePayment._id,
          targetEmail: emailInput,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEmailStatus({ type: 'success', message: `Invoice email successfully sent to ${emailInput}` });
      } else {
        setEmailStatus({ type: 'error', message: data.error || 'Failed to send email. Check SMTP settings in .env' });
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      setEmailStatus({ type: 'error', message: 'Network error sending invoice email.' });
    } finally {
      setSendingEmail(false);
    }
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    if (!activePayment) return;
    const invNo = activePayment.receiptNumber || `INV-${activePayment._id.slice(-6).toUpperCase()}`;
    const dateFormatted = new Date(activePayment.date).toLocaleDateString('en-IN');
    
    const message = `🧾 *Aarambh Library - Official Payment Receipt*\n\n` +
      `*Invoice No:* ${invNo}\n` +
      `*Student:* ${activePayment.studentName}\n` +
      `*Amount Paid:* ₹${activePayment.totalPrice.toLocaleString()}\n` +
      `*Duration:* ${activePayment.months} Month(s)\n` +
      `*Payment Method:* ${activePayment.paymentMethod.toUpperCase()}\n` +
      `*Date:* ${dateFormatted}\n\n` +
      `Thank you for choosing Aarambh Library! 📚`;

    const phone = activeStudentDetail?.phone ? activeStudentDetail.phone.replace(/[^0-9]/g, '') : '';
    const whatsappUrl = phone
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
  };

  // Copy Receipt Details
  const handleCopyReceipt = () => {
    if (!activePayment) return;
    const invNo = activePayment.receiptNumber || `INV-${activePayment._id.slice(-6).toUpperCase()}`;
    const text = `Aarambh Library Receipt | Invoice #${invNo} | Student: ${activePayment.studentName} | Amount: ₹${activePayment.totalPrice} | Date: ${new Date(activePayment.date).toLocaleDateString()}`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Payments</h1>
          <p className="text-slate-600 dark:text-slate-400">Record payments, issue receipts, and email invoices</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(val) => { setDialogOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              New Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Student Payment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-semibold">
                  ⚠️ {formError}
                </div>
              )}

              {duplicatePayment && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg text-xs space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Duplicate Payment Alert
                  </p>
                  <p>
                    A payment of ₹{duplicatePayment.totalPrice} ({duplicatePayment.months} Mo) has already been recorded for <strong>{duplicatePayment.studentName}</strong> for {new Date(formData.date).toLocaleString('default', { month: 'long', year: 'numeric' })}.
                  </p>
                  <label className="flex items-center gap-2 pt-1 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={allowDuplicate} 
                      onChange={(e) => setAllowDuplicate(e.target.checked)} 
                      className="rounded border-slate-300"
                    />
                    <span>Force allow duplicate payment for same month</span>
                  </label>
                </div>
              )}

              {/* Student Selection */}
              <div className="space-y-2">
                <Label>Student Name</Label>
                <Select value={formData.studentId} onValueChange={handleStudentSelect} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Search student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.map(student => (
                      <SelectItem key={student._id} value={student._id}>
                        {student.name} - {student.email} (Seat: {student.seatNumber || 'N/A'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Auto-selected student info */}
              {selectedStudent && (
                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Monthly Fee:</span>
                        <span className="ml-2 font-bold">₹{selectedStudent.feeAmount}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Status:</span>
                        <span className={`ml-2 font-bold ${selectedStudent.feeStatus === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedStudent.feeStatus}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Number of Months */}
              <div className="space-y-2">
                <Label>Number of Months</Label>
                <Select
                  value={formData.months}
                  onValueChange={(v) => setFormData({ ...formData, months: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 6, 12].map(m => (
                      <SelectItem key={m} value={m.toString()}>{m} Month{m > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Total Price Display */}
              {selectedStudent && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                      ₹{calculateTotal().toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                    ₹{selectedStudent.feeAmount} × {formData.months} month{parseInt(formData.months) > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online / UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={saving || !selectedStudent}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Submit Payment
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue Collected</CardTitle>
            <CreditCard className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ₹{payments.reduce((sum, p) => sum + p.totalPrice, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue per Student</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{payments.length > 0
                ? Math.round(payments.reduce((sum, p) => sum + p.totalPrice, 0) / payments.length).toLocaleString()
                : 0
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search payments by student name, payment method, or ref ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History & Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading payment records...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No payment records found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt No</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Invoice Options</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const invNo = payment.receiptNumber || `INV-${payment._id.slice(-6).toUpperCase()}`;
                  return (
                    <TableRow key={payment._id}>
                      <TableCell className="font-mono text-xs text-indigo-600 font-semibold">{invNo}</TableCell>
                      <TableCell className="font-medium">{payment.studentName}</TableCell>
                      <TableCell className="font-bold text-emerald-600">
                        ₹{payment.totalPrice.toLocaleString()}
                      </TableCell>
                      <TableCell>{payment.months} Mo</TableCell>
                      <TableCell className="capitalize">{payment.paymentMethod.replace('_', ' ')}</TableCell>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {payment.status || 'Paid'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenInvoice(payment)}
                          className="h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950"
                        >
                          <FileText className="h-3.5 w-3.5 mr-1 text-indigo-500" />
                          View Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details & Actions Dialog */}
      <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          {activePayment && (
            <div>
              {/* Printable Invoice Container */}
              <div id="printable-invoice" className="p-6 sm:p-8 space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-6 border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                      AL
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Aarambh Library</h2>
                      <p className="text-xs text-slate-500">Official Payment Receipt & Invoice</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
                      PAID RECEIPT
                    </span>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      {activePayment.receiptNumber || `INV-${activePayment._id.slice(-6).toUpperCase()}`}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-0.5">Billed To:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm block">{activePayment.studentName}</span>
                    {activeStudentDetail?.email && (
                      <span className="text-slate-500 block">{activeStudentDetail.email}</span>
                    )}
                    {activeStudentDetail?.phone && (
                      <span className="text-slate-500 block">+91 {activeStudentDetail.phone}</span>
                    )}
                    {activeStudentDetail?.seatNumber && (
                      <span className="text-indigo-600 font-semibold block mt-1">Assigned Seat: Seat {activeStudentDetail.seatNumber}</span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 block mb-0.5">Payment Date:</span>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      {new Date(activePayment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-slate-500 block mt-2">Payment Method:</span>
                    <span className="font-semibold text-slate-900 dark:text-white uppercase block">
                      {activePayment.paymentMethod.replace('_', ' ')}
                    </span>
                    {activePayment.transactionId && (
                      <span className="text-slate-500 block mt-1 font-mono text-[10px]">Ref: {activePayment.transactionId}</span>
                    )}
                  </div>
                </div>

                {/* Amount Summary */}
                <div className="border rounded-xl p-4 border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Library Subscription ({activePayment.months} Month{activePayment.months > 1 ? 's' : ''})</span>
                    <span>₹{activePayment.totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Taxes & Processing Fee</span>
                    <span>₹0</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between items-center text-slate-900 dark:text-white">
                    <span className="font-bold text-sm">Total Paid Amount:</span>
                    <span className="text-2xl font-extrabold text-indigo-600">₹{activePayment.totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="text-[11px] text-slate-400 text-center">
                  This is a computer-generated receipt issued by Aarambh Library (info@aarambhlibrary.com).
                </div>
              </div>

              {/* Modal Action Controls */}
              <div className="bg-slate-50 dark:bg-slate-950 p-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Invoice Actions</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Download / Print */}
                  <Button
                    variant="outline"
                    onClick={handlePrintInvoice}
                    className="w-full flex items-center justify-center gap-2 border-slate-300 dark:border-slate-700"
                  >
                    <Printer className="h-4 w-4 text-indigo-500" />
                    <span>Print / Save PDF</span>
                  </Button>

                  {/* Share WhatsApp */}
                  <Button
                    variant="outline"
                    onClick={handleShareWhatsApp}
                    className="w-full flex items-center justify-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950"
                  >
                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                    <span>Share WhatsApp</span>
                  </Button>

                  {/* Copy Link */}
                  <Button
                    variant="outline"
                    onClick={handleCopyReceipt}
                    className="w-full flex items-center justify-center gap-2 border-slate-300 dark:border-slate-700"
                  >
                    {copiedLink ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-slate-500" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Summary'}</span>
                  </Button>
                </div>

                {/* Hostinger Webmail SMTP Email Sender Form */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Send Invoice via Email (aarambhlibrary.com)</span>
                    </Label>
                    <span className="text-[10px] text-slate-400">Hostinger Webmail SMTP</span>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Student email address..."
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="text-xs h-9 bg-white dark:bg-slate-900"
                    />
                    <Button
                      size="sm"
                      onClick={handleSendInvoiceEmail}
                      disabled={sendingEmail || !emailInput}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 whitespace-nowrap px-4"
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Send Invoice
                        </>
                      )}
                    </Button>
                  </div>

                  {emailStatus && (
                    <div className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                      emailStatus.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                    }`}>
                      {emailStatus.type === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Mail className="h-4 w-4 text-rose-500 flex-shrink-0" />
                      )}
                      <span>{emailStatus.message}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
