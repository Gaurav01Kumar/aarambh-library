'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Loader2, Wifi, MapPin } from 'lucide-react';

export default function AttendancePage() {
  const [seatNumber, setSeatNumber] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'wifi_error' | 'gps_error'>('idle');
  const [message, setMessage] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  
  const [checkingNetwork, setCheckingNetwork] = useState(true);
  const [deviceId, setDeviceId] = useState('');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    // 1. Device Token Setup
    let token = localStorage.getItem('library_device_id');
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem('library_device_id', token);
    }
    setDeviceId(token);

    // 2. Wi-Fi and GPS Verification Flow
    const verifyPrerequisites = async () => {
      try {
        // Wi-Fi Check
        const res = await fetch('/api/attendance/verify-wifi');
        const data = await res.json();
        
        if (!data.success) {
          setStatus('wifi_error');
          setMessage(data.error || 'Please connect to the Library Wi-Fi to mark attendance.');
          setCheckingNetwork(false);
          return;
        }

        // GPS Check
        if (!navigator.geolocation) {
          setStatus('gps_error');
          setMessage('Geolocation is not supported by your browser.');
          setCheckingNetwork(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            setCheckingNetwork(false);
          },
          (error) => {
            setStatus('gps_error');
            setMessage('Please allow Location access to verify you are at the library.');
            setCheckingNetwork(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

      } catch (err) {
        setStatus('wifi_error');
        setMessage('Network error verifying prerequisites.');
        setCheckingNetwork(false);
      }
    };
    
    verifyPrerequisites();
  }, []);

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatNumber || !deviceId || !location) return;

    setStatus('loading');
    
    try {
      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          seatNumber,
          deviceId,
          latitude: location.lat,
          longitude: location.lng
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setWarning(data.warning || null);
        setSeatNumber('');
      } else {
        setStatus('error');
        setMessage(data.error);
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  if (checkingNetwork) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-slate-500">Verifying Wi-Fi and GPS Location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Library Attendance</CardTitle>
          <CardDescription>
            Enter your seat number to mark your daily attendance.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          {status === 'wifi_error' ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center space-y-3">
              <Wifi className="h-8 w-8 mx-auto text-red-500" />
              <p className="font-medium text-sm">{message}</p>
            </div>
          ) : status === 'gps_error' ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center space-y-3">
              <MapPin className="h-8 w-8 mx-auto text-red-500" />
              <p className="font-medium text-sm">{message}</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="mt-2 w-full">Try Again</Button>
            </div>
          ) : status === 'success' ? (
            <div className="text-center space-y-4 py-4">
              <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-full inline-block">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-green-700 dark:text-green-500">Attendance Marked!</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{message}</p>
              
              {warning && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md text-amber-700 dark:text-amber-500 text-sm font-medium">
                  {warning}
                </div>
              )}
              
              {/* Only allow re-marking if the API actually allowed it (which it shouldn't for same device normally) */}
              <Button onClick={() => setStatus('idle')} variant="outline" className="mt-4 w-full">
                Back
              </Button>
            </div>
          ) : (
            <form onSubmit={handleMarkAttendance} className="space-y-6">
              {status === 'error' && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 rounded p-3 text-sm flex items-start gap-2">
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{message}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Seat Number
                </label>
                <Input
                  type="text"
                  placeholder="e.g. A10"
                  value={seatNumber}
                  onChange={(e) => setSeatNumber(e.target.value.toUpperCase())}
                  className="text-lg uppercase"
                  autoFocus
                  required
                />
              </div>
              
              <Button type="submit" className="w-full text-base py-6" disabled={status === 'loading' || !seatNumber}>
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Verifying Security...
                  </>
                ) : (
                  'Mark Attendance IN'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-8 text-center text-sm text-slate-500">
        <p>Ensure you are connected to the Library Wi-Fi.</p>
        <p className="text-xs opacity-70 mt-1">Device ID: {deviceId.split('-')[0]}...</p>
      </div>
    </div>
  );
}
