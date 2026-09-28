'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Clock,
  Shield,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface EditStudentDialogProps {
  student: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentUpdated?: () => void;
}

export function EditStudentDialog({ student, open, onOpenChange, onStudentUpdated }: EditStudentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    idProof: 'Aadhar',
    idProofNumber: '',
    seatNumber: '',
    feeAmount: 1000,
    feeStatus: 'unpaid',
    feeDueDate: '',
    subscriptionPlan: 'standard',
    startTime: '08:00',
    endTime: '20:00',
    isActive: true,
  });

  // Keep formData in sync whenever selected student or open state changes
  useEffect(() => {
    if (student && open) {
      setFormData({
        name: student.name || '',
        email: student.email || '',
        phone: student.phone || '',
        idProof: student.idProof || 'Aadhar',
        idProofNumber: student.idProofNumber || '',
        seatNumber: student.seatNumber || '',
        feeAmount: student.feeAmount !== undefined ? student.feeAmount : 1000,
        feeStatus: student.feeStatus || 'unpaid',
        feeDueDate: student.feeDueDate ? new Date(student.feeDueDate).toISOString().split('T')[0] : '',
        subscriptionPlan: student.subscriptionPlan || 'standard',
        startTime: student.startTime || '08:00',
        endTime: student.endTime || '20:00',
        isActive: student.isActive !== undefined ? student.isActive : true,
      });
      setError('');
    }
  }, [student, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?._id) return;
    setLoading(true);
    setError('');

    try {
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        idProof: formData.idProof,
        idProofNumber: formData.idProofNumber.trim(),
        seatNumber: formData.seatNumber.trim(),
        feeAmount: Number(formData.feeAmount) || 0,
        feeStatus: formData.feeStatus,
        subscriptionPlan: formData.subscriptionPlan,
        startTime: formData.startTime,
        endTime: formData.endTime,
        isActive: formData.isActive,
      };

      if (formData.feeDueDate) {
        payload.feeDueDate = new Date(formData.feeDueDate);
      }

      const response = await fetch(`/api/students/${student._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onOpenChange(false);
        onStudentUpdated?.();
      } else {
        setError(data.error || 'Failed to update student profile');
      }
    } catch (err: any) {
      console.error('Error updating student:', err);
      setError('Network error occurred while updating student');
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-5 sm:p-7">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 flex-shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Edit Student: <span className="text-indigo-600 dark:text-indigo-400">{student.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update student profile, shift timing, seat allocation, and fee details.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pt-1">
          {/* Section 1: Personal Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
              Personal Information
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Full Name */}
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="edit-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" /> Full Name *
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  required
                  className="h-9 text-xs"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="edit-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Address *
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@example.com"
                  required
                  className="h-9 text-xs"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="edit-phone" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> Phone Number *
                </Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  required
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Shift Timing & Seat */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-purple-500"></span>
              Shift & Seat Allocation
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Assigned Seat */}
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="edit-seatNumber" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" /> Assigned Seat
                </Label>
                <Input
                  id="edit-seatNumber"
                  placeholder="e.g. A-12 or 45"
                  value={formData.seatNumber}
                  onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
                  className="h-9 text-xs font-semibold uppercase"
                />
              </div>

              {/* Shift Timing From */}
              <div className="space-y-1.5 sm:col-span-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Shift From *
                </Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                  className="h-9 text-xs font-medium"
                />
              </div>

              {/* Shift Timing To */}
              <div className="space-y-1.5 sm:col-span-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Shift To *
                </Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                  className="h-9 text-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Subscription & Fee Billing */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Fee & Subscription
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              {/* Monthly Plan Fee */}
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="edit-feeAmount" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5 text-slate-400" /> Monthly Fee (₹)
                </Label>
                <Input
                  id="edit-feeAmount"
                  type="number"
                  value={formData.feeAmount}
                  onChange={(e) => setFormData({ ...formData, feeAmount: Number(e.target.value) || 0 })}
                  className="h-9 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>

              {/* Fee Status */}
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="edit-feeStatus" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Fee Status
                </Label>
                <Select
                  value={formData.feeStatus}
                  onValueChange={(value: any) => setFormData({ ...formData, feeStatus: value })}
                >
                  <SelectTrigger className="h-9 text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fee Due Date */}
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="edit-feeDueDate" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" /> Due Date
                </Label>
                <Input
                  id="edit-feeDueDate"
                  type="date"
                  value={formData.feeDueDate}
                  onChange={(e) => setFormData({ ...formData, feeDueDate: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              {/* Subscription Plan */}
              <div className="space-y-1.5 sm:col-span-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Plan</Label>
                <Select
                  value={formData.subscriptionPlan}
                  onValueChange={(value) => setFormData({ ...formData, subscriptionPlan: value })}
                >
                  <SelectTrigger className="h-9 text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Plan</SelectItem>
                    <SelectItem value="standard">Standard Plan</SelectItem>
                    <SelectItem value="premium">Premium 24x7</SelectItem>
                    <SelectItem value="custom">Custom Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 4: Identity & Account Status */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              Verification & Status
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* ID Proof Type */}
              <div className="space-y-1.5 sm:col-span-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-slate-400" /> ID Proof Type
                </Label>
                <Select
                  value={formData.idProof}
                  onValueChange={(value) => setFormData({ ...formData, idProof: value })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aadhar">Aadhar Card</SelectItem>
                    <SelectItem value="PAN">PAN Card</SelectItem>
                    <SelectItem value="Voter ID">Voter ID</SelectItem>
                    <SelectItem value="Driving License">Driving License</SelectItem>
                    <SelectItem value="Student ID">Student ID</SelectItem>
                    <SelectItem value="Passport">Passport</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ID Proof Number */}
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="edit-idProofNumber" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ID Proof Number
                </Label>
                <Input
                  id="edit-idProofNumber"
                  placeholder="e.g. 1234 5678 9012"
                  value={formData.idProofNumber}
                  onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              {/* Membership Status */}
              <div className="space-y-1.5 sm:col-span-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Account Access</Label>
                <Select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
                >
                  <SelectTrigger className="h-9 text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Access Granted)</SelectItem>
                    <SelectItem value="inactive">Inactive (Suspended)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-row items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="h-9 px-5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Student'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}