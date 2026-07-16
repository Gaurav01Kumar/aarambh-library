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
import { Plus, Armchair, Loader2 } from 'lucide-react';

interface AddSeatDialogProps {
  onSeatAdded?: () => void;
}

const FLOORS = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function AddSeatDialog({ onSeatAdded }: AddSeatDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [startRange, setStartRange] = useState(1);
  const [endRange, setEndRange] = useState(10);
  const [floor, setFloor] = useState('Ground Floor');
  const [section, setSection] = useState('A');
  const [isAC, setIsAC] = useState(false);
  const [genderCategory, setGenderCategory] = useState('any');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const seatsToCreate = [];
      for (let i = startRange; i <= endRange; i++) {
        seatsToCreate.push({
          seatNumber: `${section}${i}`,
          floor,
          section,
          isAC,
          genderCategory,
          isAvailable: true,
          isOccupied: false,
          type: 'regular',
        });
      }

      const response = await fetch('/api/seats/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seats: seatsToCreate }),
      });

      if (response.ok) {
        setOpen(false);
        setStartRange(1);
        setEndRange(10);
        setIsAC(false);
        setGenderCategory('any');
        onSeatAdded?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add seats');
      }
    } catch (error) {
      console.error('Error adding seats:', error);
      alert('Failed to add seats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Seats
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Batch Seats</DialogTitle>
          <DialogDescription>
            Quickly create a range of seats for a specific floor and section.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Floor Location *</Label>
              <Select value={floor} onValueChange={setFloor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FLOORS.map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Section *</Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map(s => (
                    <SelectItem key={s} value={s}>Section {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <Label htmlFor="seat-isAC" className="cursor-pointer font-medium">Air Conditioned (AC)</Label>
              <Switch
                id="seat-isAC"
                checked={isAC}
                onCheckedChange={setIsAC}
              />
            </div>

            <div className="space-y-2">
              <Label>Category (Boys / Girls)</Label>
              <Select value={genderCategory} onValueChange={setGenderCategory}>
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

            <div className="space-y-3">
              <Label>Seat Number Range *</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Start From</span>
                  <Input
                    type="number"
                    min="1"
                    value={startRange}
                    onChange={(e) => setStartRange(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">End At</span>
                  <Input
                    type="number"
                    min="1"
                    value={endRange}
                    onChange={(e) => setEndRange(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                <Armchair className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  This will generate {endRange - startRange + 1} seats: {section}{startRange} to {section}{endRange}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || startRange > endRange}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                `Create ${endRange - startRange + 1} Seats`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
