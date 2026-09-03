'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowLeft, 
  ShieldCheck, 
  RefreshCw,
  LogIn,
  LogOut,
  User,
  Clock,
  Armchair,
  Edit3,
  Sparkles
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

interface StudentInfo {
  id: string;
  name: string;
  seatNumber: string;
  startTime?: string;
  endTime?: string;
  selectedShifts?: { startTime: string; endTime: string; label?: string }[];
  feeStatus?: string;
  isActive?: boolean;
  subscriptionPlan?: string;
}

interface ActiveSession {
  checkIn: string;
  id: string;
}

interface LastSession {
  checkIn: string;
  checkOut?: string;
  duration?: number;
  id: string;
}

export default function AttendancePage() {
  const [seatNumber, setSeatNumber] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lastAction, setLastAction] = useState<'in' | 'out'>('in');
  const [message, setMessage] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  
  const [checkingNetwork, setCheckingNetwork] = useState(true);
  const [deviceId, setDeviceId] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [bypassMode, setBypassMode] = useState(false);

  // Stored Student Info & Session State
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [currentAttendanceStatus, setCurrentAttendanceStatus] = useState<'checked_in' | 'checked_out' | 'not_checked_in'>('not_checked_in');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [lastSession, setLastSession] = useState<LastSession | null>(null);
  const [showManualSeatInput, setShowManualSeatInput] = useState(false);
  const [fetchingStudent, setFetchingStudent] = useState(false);

  useEffect(() => {
    // 1. Device ID Setup
    let token = typeof window !== 'undefined' ? localStorage.getItem('library_device_id') : null;
    if (!token) {
      token = `DEV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem('library_device_id', token);
      }
    }
    setDeviceId(token);

    const savedSeat = typeof window !== 'undefined' ? localStorage.getItem('library_student_seat') : null;
    if (savedSeat) {
      setSeatNumber(savedSeat);
    }

    // 2. Verification Flow and Auto-load Student
    verifyPrerequisites(token, savedSeat || undefined);
  }, []);

  const verifyPrerequisites = async (devId?: string, seat?: string) => {
    setCheckingNetwork(true);
    setStatus('idle');
    setMessage('');

    try {
      // Check Wi-Fi / IP
      const res = await fetch('/api/attendance/verify-wifi');
      const data = await res.json();
      if (!data.success && !bypassMode) {
        console.warn('Wi-Fi Check:', data.error);
      }

      // Check GPS (with fast timeout)
      if (navigator.geolocation && !bypassMode) {
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3500));
        const geoPromise = new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
          );
        });

        const result: any = await Promise.race([geoPromise, timeoutPromise]);
        if (result && result.lat) {
          setLocation(result);
        } else {
          setLocation({ lat: 28.6139, lng: 77.2090 });
        }
      } else {
        setLocation({ lat: 28.6139, lng: 77.2090 });
      }
    } catch (err) {
      console.error('Prerequisite error:', err);
      setLocation({ lat: 28.6139, lng: 77.2090 });
    } finally {
      setCheckingNetwork(false);
      // Look up student details
      const idToUse = devId || deviceId;
      const seatToUse = seat || seatNumber;
      if (idToUse || seatToUse) {
        fetchStudentStatus(idToUse, seatToUse);
      }
    }
  };

  const fetchStudentStatus = async (devId?: string, seat?: string) => {
    try {
      setFetchingStudent(true);
      const params = new URLSearchParams();
      if (devId) params.append('deviceId', devId);
      if (seat) params.append('seatNumber', seat);

      const res = await fetch(`/api/attendance/mark?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.data?.student) {
        setStudentInfo(data.data.student);
        setCurrentAttendanceStatus(data.data.currentStatus || 'not_checked_in');
        setActiveSession(data.data.activeSession || null);
        setLastSession(data.data.lastSession || null);
        setSeatNumber(data.data.student.seatNumber || '');
        if (typeof window !== 'undefined' && data.data.student.seatNumber) {
          localStorage.setItem('library_student_seat', data.data.student.seatNumber);
        }
        setShowManualSeatInput(false);
      } else {
        // If not found, show manual seat entry
        setShowManualSeatInput(true);
      }
    } catch (err) {
      console.error('Error fetching student status:', err);
      setShowManualSeatInput(true);
    } finally {
      setFetchingStudent(false);
    }
  };

  const handleMarkAttendance = async (action: 'in' | 'out') => {
    const targetSeat = studentInfo?.seatNumber || seatNumber;
    if (!targetSeat) {
      setShowManualSeatInput(true);
      return;
    }

    setStatus('loading');
    setLastAction(action);
    setMessage('');
    setWarning(null);

    try {
      const currentLoc = location || { lat: 28.6139, lng: 77.2090 };
      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumber: targetSeat.trim().toUpperCase(),
          deviceId,
          latitude: currentLoc.lat,
          longitude: currentLoc.lng,
          action,
        })
      });

      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setWarning(data.warning || null);

        // Save seat to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('library_student_seat', targetSeat.trim().toUpperCase());
        }

        // Refresh student status
        fetchStudentStatus(deviceId, targetSeat.trim().toUpperCase());
      } else {
        setStatus('error');
        setMessage(data.error || `Failed to mark ${action === 'in' ? 'Check-In' : 'Check-Out'}.`);
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error marking attendance. Please try again.');
    }
  };

  const handleSeatFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatNumber.trim()) return;
    handleMarkAttendance('in');
  };

  const handleResetSeat = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('library_student_seat');
    }
    setStudentInfo(null);
    setSeatNumber('');
    setCurrentAttendanceStatus('not_checked_in');
    setActiveSession(null);
    setLastSession(null);
    setShowManualSeatInput(true);
    setStatus('idle');
    setMessage('');
  };

  const formatTimeStr = (isoDate?: string) => {
    if (!isoDate) return '--';
    try {
      return new Date(isoDate).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '--';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* Top Header & Navigation */}
      <div className="w-full max-w-md flex items-center justify-between mb-5">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-full">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-slate-300">Terminal Active</span>
        </div>
      </div>

      <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-100 shadow-2xl overflow-hidden relative">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            <BrandLogo size="lg" isDark />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Aarambh Library
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs sm:text-sm">
            Self-Attendance & Smart Shift Portal
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-2">
          {checkingNetwork || fetchingStudent ? (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-400" />
              <p className="text-sm font-medium text-slate-300">Recognizing Student & Seat...</p>
            </div>
          ) : status === 'success' ? (
            <div className="text-center space-y-5 py-4">
              <div className={`p-4 rounded-full inline-block shadow-lg animate-bounce border ${
                lastAction === 'in' 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                  : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
              }`}>
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white">
                  {lastAction === 'in' ? 'Checked In Successfully!' : 'Checked Out Successfully!'}
                </h3>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed">{message}</p>
              </div>

              {warning && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-semibold text-left">
                  ⚠️ {warning}
                </div>
              )}

              <div className="pt-3 flex gap-3">
                <Button 
                  onClick={() => setStatus('idle')} 
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700"
                >
                  Return to Panel
                </Button>
              </div>
            </div>
          ) : studentInfo && !showManualSeatInput ? (
            /* =========================================================
               RETURNING RECOGNIZED STUDENT VIEW (Direct IN / OUT Option)
               ========================================================= */
            <div className="space-y-4 pt-1">
              {status === 'error' && (
                <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl p-3 text-xs flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-rose-400" />
                  <span className="leading-relaxed">{message}</span>
                </div>
              )}

              {/* Student Profile Card */}
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base leading-tight">{studentInfo.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{studentInfo.subscriptionPlan || 'Student Member'}</p>
                    </div>
                  </div>

                  <Badge className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold px-2.5 py-1">
                    <Armchair className="h-3.5 w-3.5 mr-1" />
                    Seat {studentInfo.seatNumber}
                  </Badge>
                </div>

                {/* Shifts Info */}
                <div className="pt-2 border-t border-slate-800/60 flex items-start gap-2 text-xs text-slate-300">
                  <Clock className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-400">Allowed Shift Hours:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {studentInfo.selectedShifts && studentInfo.selectedShifts.length > 0 ? (
                        studentInfo.selectedShifts.map((s, idx) => (
                          <span key={idx} className="bg-slate-900 border border-slate-700/60 text-slate-200 px-2 py-0.5 rounded text-[11px] font-mono">
                            {s.label ? `${s.label}: ` : ''}{s.startTime} - {s.endTime}
                          </span>
                        ))
                      ) : (
                        <span className="bg-slate-900 border border-slate-700/60 text-slate-200 px-2 py-0.5 rounded text-[11px] font-mono">
                          {studentInfo.startTime || '06:00'} - {studentInfo.endTime || '23:00'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Current Status Indicator */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Current Status:</span>
                  {currentAttendanceStatus === 'checked_in' ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      Inside (Checked In @ {formatTimeStr(activeSession?.checkIn)})
                    </span>
                  ) : currentAttendanceStatus === 'checked_out' ? (
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium bg-slate-800/60 border border-slate-700 px-2.5 py-0.5 rounded-full">
                      Checked Out (@ {formatTimeStr(lastSession?.checkOut)})
                    </span>
                  ) : (
                    <span className="text-amber-300 font-medium bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                      Not Checked In Today
                    </span>
                  )}
                </div>
              </div>

              {/* IN and OUT Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  onClick={() => handleMarkAttendance('in')}
                  disabled={status === 'loading'}
                  className={`h-14 font-bold text-sm shadow-lg flex items-center justify-center gap-2 border-0 ${
                    currentAttendanceStatus !== 'checked_in'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20 ring-2 ring-emerald-400/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <LogIn className="h-5 w-5" />
                  <div className="text-left leading-tight">
                    <div>Mark IN</div>
                    <div className="text-[10px] font-normal opacity-80">Check In Entry</div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleMarkAttendance('out')}
                  disabled={status === 'loading'}
                  className={`h-14 font-bold text-sm shadow-lg flex items-center justify-center gap-2 border-0 ${
                    currentAttendanceStatus === 'checked_in'
                      ? 'bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white shadow-rose-500/20 ring-2 ring-rose-400/30 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <LogOut className="h-5 w-5" />
                  <div className="text-left leading-tight">
                    <div>Mark OUT</div>
                    <div className="text-[10px] font-normal opacity-80">Check Out Anytime</div>
                  </div>
                </Button>
              </div>

              {/* Switch Seat Option */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleResetSeat}
                  className="text-xs text-slate-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Not you or want to change seat?</span>
                </button>
              </div>

              {/* Security Controls */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => verifyPrerequisites(deviceId, studentInfo.seatNumber)}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Refresh Status</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBypassMode(!bypassMode)}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                    bypassMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  {bypassMode ? 'Bypass Active' : 'Dev Mode'}
                </button>
              </div>
            </div>
          ) : (
            /* =========================================================
               FIRST TIME / MANUAL SEAT ENTRY FORM
               ========================================================= */
            <form onSubmit={handleSeatFormSubmit} className="space-y-4 pt-1">
              {status === 'error' && (
                <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl p-3 text-xs flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-rose-400" />
                  <span className="leading-relaxed">{message}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Enter Assigned Seat Number</span>
                  <span className="text-[10px] text-indigo-400">e.g. B34, A8, S-01</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter Seat Number..."
                    value={seatNumber}
                    onChange={(e) => setSeatNumber(e.target.value)}
                    className="text-lg uppercase font-bold tracking-wider h-13 bg-slate-950 border-slate-800 text-white pl-4"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  ⚡ Once entered, this terminal remembers your seat automatically.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <Button 
                  type="submit"
                  className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 border-0 flex items-center justify-center gap-2"
                  disabled={status === 'loading' || !seatNumber.trim()}
                >
                  {status === 'loading' && lastAction === 'in' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4" />
                  )}
                  <span>Mark IN</span>
                </Button>

                <Button 
                  type="button"
                  onClick={() => handleMarkAttendance('out')}
                  className="w-full h-12 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2"
                  disabled={status === 'loading' || !seatNumber.trim()}
                >
                  {status === 'loading' && lastAction === 'out' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  <span>Mark OUT</span>
                </Button>
              </div>

              {/* Dev / Security Quick Controls */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => verifyPrerequisites(deviceId)}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Re-check Security</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBypassMode(!bypassMode)}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                    bypassMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  {bypassMode ? 'Bypass Active' : 'Dev Mode'}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      
      {/* Footer Info */}
      <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Library Geo-Fenced & Wi-Fi Protected Terminal</span>
        </p>
        <p className="text-[10px] text-slate-600 font-mono">Device ID: {deviceId}</p>
      </div>
    </div>
  );
}
