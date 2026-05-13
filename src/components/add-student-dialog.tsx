'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { Plus, Loader2, User, Armchair, Upload, Clock, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddStudentDialogProps {
  onStudentAdded?: () => void;
}

interface Seat {
  _id: string;
  seatNumber: string;
  floor: string;
  section: string;
  isOccupied: boolean;
  isAvailable: boolean;
  isAC: boolean;
  occupiedShifts?: { startTime: string; endTime: string }[];
}

interface Shift {
  startTime: string;
  endTime: string;
  label?: string;
}

interface Subscription {
  _id: string;
  name: string;
  salePrice: number;
  regularPrice: number;
  shifts: Shift[];
}

export function AddStudentDialog({ onStudentAdded }: AddStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seats, setSeats] = useState<Seat[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [currentFloor, setCurrentFloor] = useState('Ground Floor');
  const [currentSection, setCurrentSection] = useState('All');
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  
  const [selectedPlan, setSelectedPlan] = useState<Subscription | null>(null);
  const [selectedShiftIndex, setSelectedShiftIndex] = useState<number>(-1);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    idProof: '',
    idProofNumber: '',
    seatNumber: '',
    feeAmount: 0,
    feeStatus: 'unpaid',
    subscriptionPlan: '',
    startTime: '',
    endTime: '',
    profileImage: '',
  });

  useEffect(() => {
    if (open) {
      fetchSeats();
      fetchSubscriptions();
    }
  }, [open, formData.startTime, formData.endTime]);

  const fetchSeats = async () => {
    try {
      setLoadingSeats(true);
      // Fetch seats with timing info if available
      let url = '/api/seats?limit=500';
      if (formData.startTime && formData.endTime) {
        url += `&startTime=${formData.startTime}&endTime=${formData.endTime}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setSeats(data.data);
      }
    } catch (error) {
      console.error('Error fetching seats:', error);
    } finally {
      setLoadingSeats(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions');
      const data = await response.json();
      if (data.success) {
        setSubscriptions(data.data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfilePreview(base64);
        setFormData(prev => ({ ...prev, profileImage: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.seatNumber) {
      setError('Please select a seat from the map');
      return;
    }
    if (!formData.subscriptionPlan) {
      setError('Please select a subscription plan');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setOpen(false);
        resetForm();
        onStudentAdded?.();
      } else {
        setError(data.error || 'Failed to add student');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      setError('Failed to add student. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      idProof: '',
      idProofNumber: '',
      seatNumber: '',
      feeAmount: 0,
      feeStatus: 'unpaid',
      subscriptionPlan: '',
      startTime: '',
      endTime: '',
      profileImage: '',
    });
    setProfilePreview(null);
    setSelectedPlan(null);
    setSelectedShiftIndex(-1);
  };

  const handlePlanChange = (subId: string) => {
    const sub = subscriptions.find(s => s._id === subId);
    if (sub) {
      setSelectedPlan(sub);
      setSelectedShiftIndex(-1);
      setFormData(prev => ({
        ...prev,
        subscriptionPlan: sub.name,
        feeAmount: sub.salePrice || sub.regularPrice,
        startTime: '',
        endTime: '',
        seatNumber: '', // Reset seat if plan changes
      }));
    }
  };

  const handleShiftSelect = (index: number) => {
    if (selectedPlan && selectedPlan.shifts[index]) {
      const shift = selectedPlan.shifts[index];
      setSelectedShiftIndex(index);
      setFormData(prev => ({
        ...prev,
        startTime: shift.startTime,
        endTime: shift.endTime,
        seatNumber: '', // Clear seat selection as it might be occupied in new shift
      }));
    }
  };

  const filteredSeats = seats.filter(s => 
    s.floor === currentFloor && 
    (currentSection === 'All' || s.section === currentSection)
  );

  const floors = Array.from(new Set(seats.map(s => s.floor)));
  const sections = ['All', ...Array.from(new Set(seats.filter(s => s.floor === currentFloor).map(s => s.section)))];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Student Registration</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-4">
              <div className="relative group w-32 h-32 mx-auto">
                <div className="w-full h-full rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-900 shadow-inner">
                  {profilePreview ? (
                    <img src={profilePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-slate-300" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
              
              <div className="pt-4 border-t space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">1. Select Membership Plan *</Label>
                  <Select onValueChange={handlePlanChange}>
                    <SelectTrigger><SelectValue placeholder="Pick a plan" /></SelectTrigger>
                    <SelectContent>
                      {subscriptions.map(sub => (
                        <SelectItem key={sub._id} value={sub._id}>
                          {sub.name} (₹{sub.salePrice || sub.regularPrice})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPlan && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-xs font-bold uppercase text-slate-500">2. Choose Available Shift *</Label>
                    <div className="grid gap-2">
                      {selectedPlan.shifts?.map((shift, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleShiftSelect(idx)}
                          className={`
                            flex flex-col items-start p-2 rounded-lg border-2 text-left transition-all
                            ${selectedShiftIndex === idx 
                              ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                              : 'border-slate-100 hover:border-slate-200 bg-white dark:bg-slate-900'}
                          `}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{shift.label || `Shift ${idx + 1}`}</span>
                            {selectedShiftIndex === idx && <Check className="h-3 w-3 text-primary" />}
                          </div>
                          <span className="text-xs font-bold">{shift.startTime} - {shift.endTime}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Total Fees:</span>
                    <span className="font-bold text-lg">₹{formData.feeAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idProof">ID Proof *</Label>
                  <select
                    value={formData.idProof}
                    onChange={(e) => setFormData({ ...formData, idProof: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-slate-900"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Aadhar">Aadhar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idProofNumber">ID Proof Number *</Label>
                  <Input id="idProofNumber" value={formData.idProofNumber} onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })} required />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <Armchair className="h-4 w-4" />
                    3. Pick a Seat (Shift: {formData.startTime || 'Select Plan First'}) *
                  </Label>
                  <div className="flex gap-2">
                    <Select value={currentFloor} onValueChange={setCurrentFloor}>
                      <SelectTrigger className="w-[130px] h-8 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {floors.length > 0 ? floors.map(f => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        )) : (
                          <SelectItem value="Ground Floor">Ground Floor</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border rounded-xl p-4 bg-white dark:bg-slate-950 overflow-x-auto min-h-[150px]">
                  {!formData.startTime ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                      <Clock className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-xs">Please select a plan and shift to see available seats</p>
                    </div>
                  ) : loadingSeats ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : filteredSeats.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">No seats available in this area</div>
                  ) : (
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                      {filteredSeats.map((seat) => (
                        <button
                          key={seat._id}
                          type="button"
                          disabled={seat.isOccupied || !seat.isAvailable}
                          onClick={() => setFormData({ ...formData, seatNumber: seat.seatNumber })}
                          className={`
                            relative p-1.5 rounded border transition-all flex flex-col items-center
                            ${formData.seatNumber === seat.seatNumber 
                              ? 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-1' 
                              : seat.isOccupied 
                                ? 'border-red-50 bg-red-50/30 opacity-40 cursor-not-allowed' 
                                : 'border-slate-100 hover:border-primary/40 bg-slate-50/30'}
                          `}
                        >
                          <Armchair className={`h-4 w-4 ${formData.seatNumber === seat.seatNumber ? 'text-primary' : seat.isOccupied ? 'text-red-400' : 'text-slate-400'}`} />
                          <span className="text-[9px] font-bold mt-1">{seat.seatNumber}</span>
                          {seat.isOccupied && <span className="absolute -top-1 -right-1 text-[8px] px-1 bg-red-100 text-red-600 rounded">Taken</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4 text-[10px] text-slate-500 font-medium italic">
                  <p>* Seats are filtered in real-time based on your selected shift.</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t flex items-center justify-between sm:justify-between w-full">
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              {formData.startTime && (
                <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formData.startTime} - {formData.endTime}</div>
              )}
              {formData.seatNumber && (
                <div className="flex items-center gap-1"><Armchair className="h-3 w-3" /> Seat {formData.seatNumber}</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading || !formData.seatNumber || !formData.startTime} className="px-8 font-bold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Registration
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}