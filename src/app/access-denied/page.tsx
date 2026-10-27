'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  Volume2,
  LogOut,
  GraduationCap,
  Lock,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

export default function AccessDeniedPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isRunningRef = useRef(true);
  const synthIntervalRef = useRef<any>(null);

  useEffect(() => {
    // 1. Read logged-in user from localStorage
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }

    isRunningRef.current = true;

    // 2. Play sound automatically immediately on page load
    activateSound();

    // 3. Silent background triggers in case browser deferred unprompted audio
    const silentResume = () => {
      if (isRunningRef.current) {
        activateSound();
      }
    };

    window.addEventListener('click', silentResume);
    window.addEventListener('keydown', silentResume);
    window.addEventListener('touchstart', silentResume);
    window.addEventListener('mousemove', silentResume, { once: true });
    window.addEventListener('scroll', silentResume, { once: true });

    return () => {
      isRunningRef.current = false;
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
      window.removeEventListener('click', silentResume);
      window.removeEventListener('keydown', silentResume);
      window.removeEventListener('touchstart', silentResume);
      window.removeEventListener('mousemove', silentResume);
      window.removeEventListener('scroll', silentResume);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  const activateSound = async () => {
    if (!isRunningRef.current) return;

    // Engine A: HTML5 looped audio element
    if (audioRef.current) {
      try {
        audioRef.current.volume = 1.0;
        audioRef.current.loop = true;
        const promise = audioRef.current.play();
        if (promise !== undefined) {
          await promise;
        }
      } catch (err) {
        // Silently wait for user gesture; no popups or manual click buttons shown
      }
    }

    // Engine B: Web Audio API Emergency Siren backup
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioCtxClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          await ctx.resume().catch(() => {});
        }

        if (ctx.state === 'running' && !synthIntervalRef.current) {
          const playSirenPulse = () => {
            if (!isRunningRef.current || !audioCtxRef.current || audioCtxRef.current.state !== 'running') {
              return;
            }
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(620, now + 0.28);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.32);
          };

          playSirenPulse();
          synthIntervalRef.current = setInterval(playSirenPulse, 380);
        }
      }
    } catch (e) {
      // Ignored
    }
  };

  const handleSignOut = () => {
    isRunningRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
    localStorage.removeItem('user');
    router.push('/auth/signin');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden select-none">
      {/* Hidden looped security audio element */}
      <audio
        ref={audioRef}
        src="/sounds/security-alarm.wav"
        preload="auto"
        loop
        autoPlay
        playsInline
      />

      {/* Background Red Ambient Pulsing Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-red-600/15 rounded-full blur-[150px] pointer-events-none animate-pulse" />

      {/* Top Header with Non-Disableable Siren Status Badge */}
      <header className="relative z-10 flex items-center justify-between max-w-5xl mx-auto w-full">
        <BrandLogo href="/" size="md" />

        {/* Locked Siren Indicator - NO OPTION TO TURN OFF */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/90 border-2 border-red-500/80 text-red-300 text-xs font-bold tracking-wide shadow-lg shadow-red-950/50">
          <Radio className="h-4 w-4 text-red-400 animate-pulse" />
          <span className="flex items-center gap-1.5">
            <Volume2 className="h-3.5 w-3.5 text-red-400" />
            <span>SECURITY ALARM ACTIVE</span>
          </span>
        </div>
      </header>

      {/* Central Security Alert Box */}
      <main className="relative z-10 max-w-2xl mx-auto w-full my-8">
        <Card className="bg-slate-900/95 border-2 border-red-500/60 shadow-2xl shadow-red-950/80 rounded-2xl overflow-hidden backdrop-blur-xl">
          {/* Top Crimson Banner */}
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-6 py-3.5 flex items-center justify-between text-white font-bold text-xs uppercase tracking-widest shadow-md">
            <span className="flex items-center gap-2 animate-pulse">
              <AlertTriangle className="h-4 w-4" />
              Security Intrusion Siren Active
            </span>
            <span className="font-mono bg-black/40 px-2.5 py-0.5 rounded text-[11px] border border-white/20">
              HTTP 403 FORBIDDEN
            </span>
          </div>

          <CardContent className="p-6 sm:p-10 text-center space-y-6">
            {/* Flashing Shield Alert Graphic */}
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-red-500/30 blur-2xl animate-ping" />
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center text-white shadow-2xl shadow-red-600/50 relative z-10 ring-4 ring-red-500/50 animate-pulse">
                <ShieldAlert className="h-12 w-12" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                ACCESS DENIED
              </h1>
              <p className="text-red-400 font-bold text-sm sm:text-base mt-1 flex items-center justify-center gap-2">
                <span>⚠️ Unauthorized Administrative Access Attempt</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-red-950/50 border border-red-900/80 text-slate-200 text-sm leading-relaxed text-left space-y-2">
              <p className="font-semibold text-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-red-400 shrink-0" />
                <span>You do not have administrative permissions for this library.</span>
              </p>
              <p className="text-xs text-slate-300">
                You are currently logged in with a <strong>Student Account</strong>. The Admin Dashboard, student personal records, financial reports, and library system settings are strictly restricted to authorized staff.
              </p>
              <p className="text-[11px] text-red-400 font-semibold pt-1 border-t border-red-900/50 flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 animate-pulse text-red-400" />
                <span>Security Siren is locked: Sound plays continuously until this page is closed.</span>
              </p>
            </div>

            {/* User Session Info Card */}
            {user && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left text-xs space-y-1.5">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500">Authenticated Account:</span>
                  <span className="font-semibold text-slate-200">{user.name}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500">Email Address:</span>
                  <span className="font-mono text-slate-300">{user.email}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500">Assigned Role:</span>
                  <Badge variant="outline" className="text-[11px] border-rose-500/50 text-rose-300 bg-rose-950/40 font-bold capitalize">
                    {user.role}
                  </Badge>
                </div>
              </div>
            )}

            {/* Navigation Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link href="/student-portal" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold h-12 shadow-lg shadow-indigo-500/25">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Go to Student Portal
                </Button>
              </Link>
              <Link href="/auth/signin" className="flex-1">
                <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-slate-200 h-12 font-medium">
                  Sign In with Admin Account
                </Button>
              </Link>
            </div>

            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 text-xs"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Sign Out of This Device
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-600 max-w-md mx-auto">
        <p>Aarambh Library Security System • Unauthorized attempts are monitored & recorded.</p>
      </footer>
    </div>
  );
}
