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
import { Plus, Search, Loader2, CheckCircle, CreditCard } from 'lucide-react';

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
  transactionId: string;
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

  const handleStudentSelect = (studentId: string) => {
    const student = students.find(s => s._id === studentId);
    setSelectedStudent(student || null);
    setFormData(prev => ({ ...prev, studentId }));
  };

  const calculateTotal = () => {
    if (!selectedStudent) return 0;
    const months = parseInt(formData.months) || 1;
    return selectedStudent.feeAmount * months;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        resetForm();
        fetchPayments();
        fetchStudents();
      }
    } catch (error) {
      console.error('Error saving payment:', error);
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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Payments</h1>
          <p className="text-slate-600 dark:text-slate-400">Record and manage student fee payments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(val) => { setDialogOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Student Payment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
                        {student.name} - {student.email} (Seat: {student.seatNumber})
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

              <Button type="submit" className="w-full" disabled={saving || !selectedStudent}>
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
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ₹{payments.reduce((sum, p) => sum + p.totalPrice, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg per Student</CardTitle>
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
              placeholder="Search students..."
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
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No payments recorded yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Months</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell className="font-medium">{payment.studentName}</TableCell>
                    <TableCell className="font-bold text-green-600">
                      ₹{payment.totalPrice.toLocaleString()}
                    </TableCell>
                    <TableCell>{payment.months}</TableCell>
                    <TableCell className="capitalize">{payment.paymentMethod.replace('_', ' ')}</TableCell>
                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {payment.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
