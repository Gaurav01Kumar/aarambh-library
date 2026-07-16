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
import { Edit, Loader2 } from 'lucide-react';

interface EditSeatDialogProps {
  seat: any;
  onSeatUpdated?: () => void;
}

export function EditSeatDialog({ seat, onSeatUpdated }: EditSeatDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    seatNumber: seat.seatNumber || '',
    floor: seat.floor || 'Ground Floor',
    section: seat.section || 'A',
    isAC: seat.isAC || false,
    isAvailable: seat.isAvailable !== false,
    genderCategory: seat.genderCategory || 'any',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/seats/${seat._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setOpen(false);
        onSeatUpdated?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update seat');
      }
    } catch (error) {
      console.error('Error updating seat:', error);
      alert('Failed to update seat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Seat {seat.seatNumber}</DialogTitle>
          <DialogDescription>
            Update seat configuration and availability
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-seatNumber">Seat Number *</Label>
              <Input
                id="edit-seatNumber"
                value={formData.seatNumber}
                onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-floor">Floor *</Label>
              <Select
                value={formData.floor}
                onValueChange={(value) => setFormData({ ...formData, floor: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ground Floor">Ground Floor</SelectItem>
                  <SelectItem value="First Floor">First Floor</SelectItem>
                  <SelectItem value="Second Floor">Second Floor</SelectItem>
                  <SelectItem value="Third Floor">Third Floor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-section">Section *</Label>
              <Select
                value={formData.section}
                onValueChange={(value) => setFormData({ ...formData, section: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Section A</SelectItem>
                  <SelectItem value="B">Section B</SelectItem>
                  <SelectItem value="C">Section C</SelectItem>
                  <SelectItem value="D">Section D</SelectItem>
                  <SelectItem value="E">Section E</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <Label htmlFor="edit-isAC" className="cursor-pointer">Air Conditioned (AC)</Label>
              <Switch
                id="edit-isAC"
                checked={formData.isAC}
                onCheckedChange={(checked) => setFormData({ ...formData, isAC: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>Category (Boys / Girls)</Label>
              <Select
                value={formData.genderCategory}
                onValueChange={(value) => setFormData({ ...formData, genderCategory: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any / Unisex</SelectItem>
                  <SelectItem value="boys">Boys Only</SelectItem>
                  <SelectItem value="girls">Girls Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <Label htmlFor="edit-isAvailable" className="cursor-pointer">Is Available</Label>
              <Switch
                id="edit-isAvailable"
                checked={formData.isAvailable}
                onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Seat'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}