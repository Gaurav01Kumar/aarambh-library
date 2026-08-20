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
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Edit, Loader2, AlertCircle, Clock, Plus, Trash2 } from 'lucide-react';

interface EditSubscriptionDialogProps {
  subscription: any;
  onSubscriptionUpdated?: () => void;
}

export function EditSubscriptionDialog({ subscription, onSubscriptionUpdated }: EditSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [shifts, setShifts] = useState<any[]>(
    subscription?.shifts && subscription.shifts.length > 0
      ? subscription.shifts
      : [{ startTime: subscription?.startTime || '08:00', endTime: subscription?.endTime || '20:00', label: 'Full Day' }]
  );

  const initialSlotPricesMap: { [count: number]: number } = {};
  if (subscription?.slotPrices && Array.isArray(subscription.slotPrices)) {
    subscription.slotPrices.forEach((sp: any) => {
      initialSlotPricesMap[sp.slotCount] = sp.price;
    });
  }
  const [slotPrices, setSlotPrices] = useState<{ [count: number]: number }>(initialSlotPricesMap);

  const [formData, setFormData] = useState({
    name: subscription?.name || '',
    totalHours: subscription?.totalHours || 0,
    startTime: subscription?.startTime || '08:00',
    endTime: subscription?.endTime || '20:00',
    regularPrice: subscription?.regularPrice || 0,
    salePrice: subscription?.salePrice || 0,
    price: subscription?.price || 0,
    billingCycle: subscription?.billingCycle || 'monthly',
    allowDiscount: subscription?.allowDiscount || false,
    discountRange: subscription?.discountRange || '',
    planType: subscription?.planType || 'basic',
    isActive: subscription?.isActive !== false,
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && subscription) {
      const loadedShifts = subscription.shifts && subscription.shifts.length > 0
        ? subscription.shifts
        : [{ startTime: subscription.startTime || '08:00', endTime: subscription.endTime || '20:00', label: 'Full Day' }];
      
      const spMap: { [count: number]: number } = {};
      if (subscription.slotPrices && Array.isArray(subscription.slotPrices)) {
        subscription.slotPrices.forEach((sp: any) => {
          spMap[sp.slotCount] = sp.price;
        });
      }

      setShifts(loadedShifts);
      setSlotPrices(spMap);
      setFormData({
        name: subscription.name || '',
        totalHours: subscription.totalHours || 0,
        startTime: subscription.startTime || '08:00',
        endTime: subscription.endTime || '20:00',
        regularPrice: subscription.regularPrice || 0,
        salePrice: subscription.salePrice || 0,
        price: subscription.price || subscription.regularPrice || 0,
        billingCycle: subscription.billingCycle || 'monthly',
        allowDiscount: subscription.allowDiscount || false,
        discountRange: subscription.discountRange || '',
        planType: subscription.planType || 'basic',
        isActive: subscription.isActive !== false,
      });
      setError('');
    }
  };

  const addShift = () => {
    const nextCount = shifts.length + 1;
    setShifts([...shifts, { startTime: '08:00', endTime: '14:00', label: 'Shift ' + nextCount }]);
    setSlotPrices(prev => ({ ...prev, [nextCount]: prev[nextCount] || (formData.regularPrice * nextCount) }));
  };

  const removeShift = (index: number) => {
    if (shifts.length > 1) {
      setShifts(shifts.filter((_, i) => i !== index));
    }
  };

  const updateShift = (index: number, field: string, value: string) => {
    const newShifts = [...shifts];
    newShifts[index][field] = value;
    setShifts(newShifts);
  };

  const updateSlotPrice = (count: number, price: number) => {
    setSlotPrices(prev => ({ ...prev, [count]: price }));
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

    const formattedSlotPrices = Array.from({ length: shifts.length }, (_, i) => {
      const count = i + 1;
      return {
        slotCount: count,
        price: slotPrices[count] !== undefined ? slotPrices[count] : (formData.regularPrice * count),
      };
    });

    const submissionData = {
      ...formData,
      shifts,
      slotPrices: formattedSlotPrices,
      price: formData.regularPrice,
      startTime: shifts[0]?.startTime || formData.startTime,
      endTime: shifts[0]?.endTime || formData.endTime,
    };

    try {
      const response = await fetch(`/api/subscriptions/${subscription._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        setOpen(false);
        onSubscriptionUpdated?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      setError('Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800">
          <Edit className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Subscription Plan</DialogTitle>
          <DialogDescription>
            Update plan details, shifts, and multi-slot pricing tiers
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm font-medium mt-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-sub-name">Subscription Name *</Label>
              <Input
                id="edit-sub-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sub-totalHours">Total Hours *</Label>
              <Input
                id="edit-sub-totalHours"
                type="number"
                min="1"
                value={formData.totalHours}
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
                      value={shift.label || ''}
                      onChange={(e) => updateShift(index, 'label', e.target.value)}
                      placeholder="e.g. Morning"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-slate-500">From</Label>
                    <Input
                      type="time"
                      value={shift.startTime || '08:00'}
                      onChange={(e) => updateShift(index, 'startTime', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-slate-500">To</Label>
                    <Input
                      type="time"
                      value={shift.endTime || '14:00'}
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

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Base (1 Slot) Price (₹) *</Label>
              <Input
                type="number"
                min="1"
                value={formData.regularPrice}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setFormData({ ...formData, regularPrice: val });
                  setSlotPrices(prev => ({ ...prev, 1: val }));
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Sale Price (₹)</Label>
              <Input
                type="number"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Billing Cycle *</Label>
              <Select value={formData.billingCycle} onValueChange={(v: any) => setFormData({ ...formData, billingCycle: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="half-yearly">Half-Yearly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Multi-Slot Tier Pricing Section */}
          <div className="space-y-3 border rounded-xl p-4 bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40">
            <Label className="text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center justify-between">
              <span>Multi-Slot Combination Prices</span>
              <span className="text-[11px] font-normal text-slate-500">Set specific price when student chooses multiple shifts</span>
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: shifts.length }, (_, i) => {
                const count = i + 1;
                const priceVal = slotPrices[count] !== undefined ? slotPrices[count] : (formData.regularPrice * count);
                return (
                  <div key={count} className="p-3 bg-white dark:bg-slate-900 rounded-lg border shadow-xs space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {count} {count === 1 ? 'Slot' : 'Slots'} Price (₹)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={priceVal || ''}
                      onChange={(e) => updateSlotPrice(count, parseInt(e.target.value) || 0)}
                      placeholder={`e.g. ${count === 1 ? '300' : count === 2 ? '500' : count === 3 ? '700' : '800'}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <Label htmlFor="edit-sub-isActive">Is Active</Label>
              <Switch
                id="edit-sub-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <Label htmlFor="edit-sub-allowDiscount">Allow Discount</Label>
              <Switch
                id="edit-sub-allowDiscount"
                checked={formData.allowDiscount}
                onCheckedChange={(checked) => setFormData({ ...formData, allowDiscount: checked })}
              />
            </div>
          </div>

          {formData.allowDiscount && (
            <div className="space-y-2 p-4 bg-orange-50/30 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-lg">
              <Label htmlFor="edit-sub-discountRange">Discount Range Description (%)</Label>
              <Input
                id="edit-sub-discountRange"
                placeholder="e.g., 5-10"
                value={formData.discountRange}
                onChange={(e) => setFormData({ ...formData, discountRange: e.target.value })}
              />
            </div>
          )}

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="px-8 font-bold">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
