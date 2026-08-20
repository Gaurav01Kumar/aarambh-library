'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Loader2, CheckCircle, ArrowLeft, Check, Clock } from 'lucide-react';

interface Shift {
  startTime: string;
  endTime: string;
  label?: string;
}

interface SlotPrice {
  slotCount: number;
  price: number;
}

interface Subscription {
  _id: string;
  name: string;
  regularPrice: number;
  salePrice: number;
  shifts: Shift[];
  slotPrices?: SlotPrice[];
}

function formatTime(timeStr: string) {
  if (!timeStr) return '--:--';
  const [h, m] = timeStr.split(':');
  if (!h || !m) return timeStr;
  let hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
}

export default function StudentRegistrationPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Subscription | null>(null);
  const [selectedShiftIndices, setSelectedShiftIndices] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    idProof: '',
    idProofNumber: '',
    subscriptionPlan: '',
    feeAmount: 0,
    startTime: '08:00',
    endTime: '20:00',
    selectedShifts: [] as Shift[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/subscriptions');
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.data);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    }
  };

  const handlePlanChange = (subId: string) => {
    const sub = subscriptions.find(s => s._id === subId);
    if (sub) {
      setSelectedPlan(sub);
      setSelectedShiftIndices([]);
      setFormData(prev => ({
        ...prev,
        subscriptionPlan: sub.name,
        feeAmount: 0,
        startTime: '',
        endTime: '',
        selectedShifts: [],
      }));
    }
  };

  const toggleShiftSelect = (index: number) => {
    if (!selectedPlan || !selectedPlan.shifts[index]) return;

    let newIndices: number[];
    if (selectedShiftIndices.includes(index)) {
      newIndices = selectedShiftIndices.filter(i => i !== index);
    } else {
      newIndices = [...selectedShiftIndices, index].sort((a, b) => a - b);
    }

    setSelectedShiftIndices(newIndices);

    if (newIndices.length === 0) {
      setFormData(prev => ({
        ...prev,
        feeAmount: 0,
        startTime: '',
        endTime: '',
        selectedShifts: [],
      }));
      return;
    }

    const slotCount = newIndices.length;
    let calculatedFee = 0;

    if (selectedPlan.slotPrices && selectedPlan.slotPrices.length > 0) {
      const tier = selectedPlan.slotPrices.find(sp => sp.slotCount === slotCount);
      if (tier) {
        calculatedFee = tier.price;
      } else {
        calculatedFee = slotCount * (selectedPlan.salePrice || selectedPlan.regularPrice);
      }
    } else {
      calculatedFee = slotCount * (selectedPlan.salePrice || selectedPlan.regularPrice);
    }

    const selectedShiftsList = newIndices.map(i => selectedPlan.shifts[i]);
    const startTimes = selectedShiftsList.map(s => s.startTime).sort();
    const endTimes = selectedShiftsList.map(s => s.endTime).sort();

    setFormData(prev => ({
      ...prev,
      feeAmount: calculatedFee,
      startTime: startTimes[0],
      endTime: endTimes[endTimes.length - 1],
      selectedShifts: selectedShiftsList,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlan && selectedShiftIndices.length === 0) {
      setError('Please select at least one shift/slot');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Error registering student:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <Card className="w-full max-w-md text-center p-8">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl mb-2">Registration Successful!</CardTitle>
          <CardDescription className="text-lg mb-8">
            Thank you for registering with Aarambh Library. Our team will contact you shortly to confirm your seat.
          </CardDescription>
          <Link href="/">
            <Button className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Aarambh Library</span>
          </Link>
          <h1 className="text-3xl font-bold">Student Registration</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Fill in your details to join our library</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal & Subscription Information</CardTitle>
            <CardDescription>All fields are required for registration</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idProof">ID Proof Type *</Label>
                  <Select
                    value={formData.idProof}
                    onValueChange={(value) => setFormData({ ...formData, idProof: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID Proof" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                      <SelectItem value="pan">PAN Card</SelectItem>
                      <SelectItem value="voter">Voter ID</SelectItem>
                      <SelectItem value="license">Driving License</SelectItem>
                      <SelectItem value="student_id">College ID Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idProofNumber">ID Proof Number *</Label>
                <Input
                  id="idProofNumber"
                  placeholder="Enter your ID card number"
                  value={formData.idProofNumber}
                  onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Membership Plan Selection */}
              {subscriptions.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Select Membership Plan *</Label>
                    <Select onValueChange={handlePlanChange}>
                      <SelectTrigger><SelectValue placeholder="Choose a membership plan" /></SelectTrigger>
                      <SelectContent>
                        {subscriptions.map(sub => (
                          <SelectItem key={sub._id} value={sub._id}>
                            {sub.name} (Base Price: ₹{sub.salePrice || sub.regularPrice})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedPlan && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase text-slate-600">Select Shift Slot(s) *</Label>
                        <span className="text-[11px] text-indigo-600 font-medium">Select 1 or multiple slots</span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {selectedPlan.shifts?.map((shift, idx) => {
                          const isSelected = selectedShiftIndices.includes(idx);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleShiftSelect(idx)}
                              className={`
                                flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all cursor-pointer
                                ${isSelected 
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                                  : 'border-slate-200 hover:border-slate-300 bg-white dark:bg-slate-900'}
                              `}
                            >
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">{shift.label || `Shift ${idx + 1}`}</span>
                                <span className="text-xs font-bold flex items-center gap-1 mt-0.5">
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                </span>
                              </div>
                              <div className={`h-5 w-5 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white'}`}>
                                {isSelected && <Check className="h-3.5 w-3.5" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex justify-between items-center mt-3">
                        <div>
                          <span className="text-slate-600 dark:text-slate-400 font-medium text-xs block">Total Selected Slots:</span>
                          <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{selectedShiftIndices.length} Slot(s)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 text-xs block">Calculated Fee:</span>
                          <span className="font-bold text-2xl text-primary">₹{formData.feeAmount}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4">
                <Button type="submit" className="w-full py-6 text-lg font-bold" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register Now'
                  )}
                </Button>
              </div>

              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account? <Link href="/auth/signin" className="text-primary hover:underline">Sign in</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
