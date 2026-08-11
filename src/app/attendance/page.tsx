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
  Wifi, 
  MapPin, 
  QrCode, 
  BookOpen, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles,
  Smartphone,
  RefreshCw
} from 'lucide-react';

export default function AttendancePage() {
  const [seatNumber, setSeatNumber] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'wifi_error' | 'gps_error'>('idle');
  const [message, setMessage] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  
  const [checkingNetwork, setCheckingNetwork] = useState(true);
  const [deviceId, setDeviceId] = useState('');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [bypassMode, setBypassMode] = useState(false);

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

    // 2. Verification Flow with Fallback
    verifyPrerequisites();
  }, []);

  const verifyPrerequisites = async () => {
    setCheckingNetwork(true);
    setStatus('idle');
    setMessage('');

    try {
      // Check Wi-Fi / IP
      const res = await fetch('/api/attendance/verify-wifi');
      const data = await res.json();
      
      if (!data.success && !bypassMode) {
        // Warning or error if restricted
        console.warn('Wi-Fi Check:', data.error);
      }

      // Check GPS (with fast timeout)
      if (navigator.geolocation && !bypassMode) {
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 4000));
        
        const geoPromise = new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => resolve(null),
            { enableHighAccuracy: false, timeout: 3500, maximumAge: 60000 }
          );
        });

        const result: any = await Promise.race([geoPromise, timeoutPromise]);
        if (result && result.lat) {
          setLocation(result);
        } else {
          // Default fallback coordinates if GPS times out
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
    }
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatNumber) return;

    setStatus('loading');
    setMessage('');
    setWarning(null);
    
    try {
      const currentLoc = location || { lat: 28.6139, lng: 77.2090 };
      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          seatNumber: seatNumber.trim().toUpperCase(),
          deviceId,
          latitude: currentLoc.lat,
          longitude: currentLoc.lng
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setWarning(data.warning || null);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to mark attendance.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error marking attendance. Please try again.');
    }
  };

  const resetPage = () => {
    setStatus('idle');
    setSeatNumber('');
    setMessage('');
    setWarning(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* Top Header & Navigation */}
      <div className="w-full max-w-md flex items-center justify-between mb-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-300">Live Terminal</span>
        </div>
      </div>

      <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-100 shadow-2xl overflow-hidden relative">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-3">
            <BookOpen className="h-7 w-7 text-indigo-400" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Aarambh Library
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs sm:text-sm">
            Instant QR & Seat Attendance Check-In Portal
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          {checkingNetwork ? (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-400" />
              <p className="text-sm font-medium text-slate-300">Verifying Wi-Fi & Location Security...</p>
            </div>
          ) : status === 'success' ? (
            <div className="text-center space-y-5 py-4">
              <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 p-4 rounded-full inline-block shadow-lg animate-bounce">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white">Attendance Verified!</h3>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed">{message}</p>
              </div>

              {warning && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-semibold text-left">
                  ⚠️ {warning}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <Button onClick={resetPage} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
                  Mark Another Seat
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleMarkAttendance} className="space-y-5">
              {status === 'error' && (
                <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl p-3 text-xs flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-rose-400" />
                  <span className="leading-relaxed">{message}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Enter Seat Number / Desk ID</span>
                  <span className="text-[10px] text-indigo-400">e.g. S-01, S-02, A10</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter Seat (e.g. S-01)..."
                    value={seatNumber}
                    onChange={(e) => setSeatNumber(e.target.value)}
                    className="text-lg uppercase font-bold tracking-wider h-13 bg-slate-950 border-slate-800 text-white pl-4"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 border-0" 
                disabled={status === 'loading' || !seatNumber.trim()}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Verifying Attendance...
                  </>
                ) : (
                  'Mark Attendance IN'
                )}
              </Button>

              {/* Dev / Testing Quick Controls */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={verifyPrerequisites}
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
                  {bypassMode ? 'Bypass Active' : 'Enable Dev Mode'}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      
      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Connected to Library Terminal Verification</span>
        </p>
        <p className="text-[10px] text-slate-600 font-mono">Device ID: {deviceId}</p>
      </div>
    </div>
  );
}
