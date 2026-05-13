'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Loader2, AlertCircle, Trash2, Clock } from 'lucide-react';

interface AddSubscriptionDialogProps {
  onSubscriptionAdded?: () => void;
}

export function AddSubscriptionDialog({ onSubscriptionAdded }: AddSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [shifts, setShifts] = useState([{ startTime: '08:00', endTime: '20:00', label: 'Full Day' }]);

  const [formData, setFormData] = useState({
    name: '',
    totalHours: 0,
    regularPrice: 0,
    salePrice: 0,
    price: 0,
    billingCycle: 'monthly' as 'monthly' | 'quarterly' | 'half-yearly' | 'yearly',
    allowDiscount: false,
    discountRange: '',
    planType: 'basic' as 'free' | 'basic' | 'pro',
    isActive: true,
  });

  const addShift = () => {
    setShifts([...shifts, { startTime: '08:00', endTime: '14:00', label: 'Shift ' + (shifts.length + 1) }]);
  };

  const removeShift = (index: number) => {
    if (shifts.length > 1) {
      setShifts(shifts.filter((_, i) => i !== index));
    }
  };

  const updateShift = (index: number, field: string, value: string) => {
    const newShifts = [...shifts];
    (newShifts[index] as any)[field] = value;
    setShifts(newShifts);
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Plan name is required';
    if (formData.totalHours <= 0) return 'Total hours must be greater than 0';
    if (formData.regularPrice <= 0) return 'Regular price must be greater than 0';
    
    for (const shift of shifts) {
      if (shift.startTime >= shift.endTime) return `End time must be after start time in ${shift.label || 'shift'}`;
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    const submissionData = {
      ...formData,
      shifts,
      price: formData.regularPrice,
      // For compatibility
      startTime: shifts[0]?.startTime,
      endTime: shifts[0]?.endTime,
    };

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        setOpen(false);
        resetForm();
        onSubscriptionAdded?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add subscription');
      }
    } catch (error) {
      console.error('Error adding subscription:', error);
      setError('Failed to add subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      totalHours: 0,
      regularPrice: 0,
      salePrice: 0,
      price: 0,
      billingCycle: 'monthly',
      allowDiscount: false,
      discountRange: '',
      planType: 'basic',
      isActive: true,
    });
    setShifts([{ startTime: '08:00', endTime: '20:00', label: 'Full Day' }]);
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Subscription
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Subscription Plan</DialogTitle>
          <DialogDescription>
            Configure membership name, pricing, and available shifts
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm font-medium">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Plan Basics */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Subscription Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Student Membership"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalHours">Duration (Hours) *</Label>
              <Input
                id="totalHours"
                type="number"
                min="1"
                value={formData.totalHours || ''}
                onChange={(e) => setFormData({ ...formData, totalHours: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          {/* Shifts Section */}
          <div className="space-y-4 border rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Available Shifts
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addShift}>
                <Plus className="h-4 w-4 mr-1" /> Add Shift
              </Button>
            </div>
            
            <div className="space-y-3">
              {shifts.map((shift, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-white dark:bg-slate-950 p-3 rounded-lg border shadow-sm">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-slate-500">Shift Name</Label>
                    <Input
                      value={shift.label}
                      onChange={(e) => updateShift(index, 'label', e.target.value)}
                      placeholder="e.g. Morning"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-slate-500">From</Label>
                    <Input
                      type="time"
                      value={shift.startTime}
                      onChange={(e) => updateShift(index, 'startTime', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-slate-500">To</Label>
                    <Input
                      type="time"
                      value={shift.endTime}
                      onChange={(e) => updateShift(index, 'endTime', e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      disabled={shifts.length === 1}
                      onClick={() => removeShift(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="regularPrice">Regular Price (₹) *</Label>
              <Input
                id="regularPrice"
                type="number"
                min="1"
                value={formData.regularPrice || ''}
                onChange={(e) => setFormData({ ...formData, regularPrice: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Sale Price (₹)</Label>
              <Input
                id="salePrice"
                type="number"
                value={formData.salePrice || ''}
                onChange={(e) => setFormData({ ...formData, salePrice: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingCycle">Billing Cycle *</Label>
              <Select
                value={formData.billingCycle}
                onValueChange={(value: any) => setFormData({ ...formData, billingCycle: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="half-yearly">Half-Yearly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Controls */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Active Plan</Label>
            </div>
            <div className="flex items-center space-x-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <Switch
                id="allowDiscount"
                checked={formData.allowDiscount}
                onCheckedChange={(checked) => setFormData({ ...formData, allowDiscount: checked })}
              />
              <Label htmlFor="allowDiscount">Allow Discount</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="px-8">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Subscription'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}