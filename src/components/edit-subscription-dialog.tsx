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
import { Edit, Loader2, AlertCircle } from 'lucide-react';

interface EditSubscriptionDialogProps {
  subscription: any;
  onSubscriptionUpdated?: () => void;
}

export function EditSubscriptionDialog({ subscription, onSubscriptionUpdated }: EditSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: subscription.name || '',
    totalHours: subscription.totalHours || 0,
    startTime: subscription.startTime || '08:00',
    endTime: subscription.endTime || '20:00',
    regularPrice: subscription.regularPrice || 0,
    salePrice: subscription.salePrice || 0,
    price: subscription.price || 0,
    billingCycle: subscription.billingCycle || 'monthly',
    allowDiscount: subscription.allowDiscount || false,
    discountRange: subscription.discountRange || '',
    planType: subscription.planType || 'basic',
    isActive: subscription.isActive !== false,
  });

  const validateForm = () => {
    if (!formData.name.trim()) return 'Plan name is required';
    if (formData.totalHours <= 0) return 'Total hours must be greater than 0';
    if (!formData.startTime || !formData.endTime) return 'Start and End time are required';
    if (formData.startTime >= formData.endTime) return 'End time must be after start time';
    if (formData.regularPrice <= 0) return 'Regular price must be greater than 0';
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
      price: formData.regularPrice
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Subscription Plan</DialogTitle>
          <DialogDescription>
            Update plan details, pricing, and availability
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm font-medium mt-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label>Timing From *</Label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Timing To *</Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Regular Price (₹) *</Label>
              <Input
                type="number"
                min="1"
                value={formData.regularPrice}
                onChange={(e) => setFormData({ ...formData, regularPrice: parseInt(e.target.value) || 0 })}
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
            <div className="space-y-2">
              <Label>Plan Category</Label>
              <Select value={formData.planType} onValueChange={(v: any) => setFormData({ ...formData, planType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
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
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
