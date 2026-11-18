'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  StudentPortalProvider,
  useStudentPortal,
  formatTimer,
} from '@/context/StudentPortalContext';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FileText,
  Map,
  Sparkles,
  Headphones,
  Calendar,
  Users,
  LogOut,
  RefreshCw,
  Loader2,
  MoreHorizontal,
  X,
  Armchair,
  Lock,
  CreditCard,
  Sun,
  Moon,
  Target,
} from 'lucide-react';
import { ExamTargetSetup } from '@/components/student-portal/ExamTargetSetup';
import { StudyMateChat } from '@/components/student-portal/StudyMateChat';

const PORTAL_NAV_GROUPS = [
  {
    group: 'Core',
    items: [
      { href: '/student-portal', label: 'Dashboard & Pass', shortLabel: 'Home', icon: LayoutDashboard },
      { href: '/student-portal/roadmap', label: 'Study Roadmap', shortLabel: 'Roadmap', icon: Map, badge: 'AI' },
      { href: '/student-portal/exams', label: 'Exam Calendar', shortLabel: 'Exams', icon: Calendar },
    ],
  },
  {
    group: 'AI & Learning',
    items: [
      { href: '/student-portal/current-affairs', label: 'Current Affairs', shortLabel: 'Affairs', icon: Sparkles, badge: 'News' },
      { href: '/student-portal/practice', label: 'Practice Sets', shortLabel: 'Practice', icon: Target, badge: '2/Day' },
      { href: '/student-portal/notes', label: 'My Notes & PYQ', shortLabel: 'Notes', icon: FileText },
    ],
  },
  {
    group: 'Productivity',
    items: [
      { href: '/student-portal/focus', label: 'Focus & Pomodoro', shortLabel: 'Focus', icon: Headphones },
      { href: '/student-portal/peers', label: 'Study Peers', shortLabel: 'Peers', icon: Users, badge: 'Soon' },
    ],
  },
];

const FLAT_NAV = PORTAL_NAV_GROUPS.flatMap((g) => g.items);

const MOBILE_PRIMARY_TABS = [
  { href: '/student-portal', shortLabel: 'Home', icon: LayoutDashboard },
  { href: '/student-portal/notes', shortLabel: 'Notes', icon: FileText },
  { href: '/student-portal/practice', shortLabel: 'Practice', icon: Target },
  { href: '/student-portal/focus', shortLabel: 'Focus', icon: Headphones },
];

function StudentPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    student,
    setStudent,
    currentUser,
    loading,
    refreshAll,
    handleSignOut,
    ambientSound,
    stopAmbientSound,
    isTimerRunning,
    timeLeft,
  } = useStudentPortal();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [onboardingDone, setOnboardingDone] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('student_portal_theme');
      if (saved === 'dark' || saved === 'light') {
        setTheme(saved);
      }
      if (student?.id && localStorage.getItem(`student_onboarding_done_${student.id}`) === 'true') {
        setOnboardingDone(true);
      }
    } catch {}
  }, [student?.id]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem('student_portal_theme', next);
    } catch {}
  };

  const isDark = theme === 'dark';

  if (loading) {
    return (
      <div className={isDark ? 'dark' : ''}>
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300">
          <Loader2 className="h-9 w-9 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Loading your student portal...</p>
        </div>
      </div>
    );
  }

  // 1. NON-DISMISSIBLE UNPAID PAYMENT GATE
  if (student && student.feeStatus !== 'paid') {
    return (
      <div className={isDark ? 'dark' : ''}>
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
          <div className="p-6 max-w-6xl mx-auto space-y-6 blur-md pointer-events-none select-none opacity-60">
            <div className="h-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
            <div className="grid grid-cols-3 gap-6">
              <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
              <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
              <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
            </div>
          </div>

          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 flex items-center justify-center mx-auto">
                <Lock className="h-8 w-8" />
              </div>

              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                  Fee Payment Pending
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  Student Portal Locked
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Only active paid members can access the Student Portal, Digital QR Pass, and AI Study Hub.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{student.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Seat Number</span>
                  <span className="font-bold text-slate-900 dark:text-white">{student.seatNumber || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-bold uppercase text-rose-600">{student.feeStatus}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">Monthly Fee Due</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    ₹{(student.feeAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please pay your monthly fee at the library reception desk and tap &ldquo;Check Payment Status&rdquo; below.
              </p>

              <div className="space-y-2.5 pt-1">
                <Button
                  onClick={refreshAll}
                  className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Check Payment Status
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="w-full h-10 rounded-2xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. FIRST-TIME EXAM TARGET & AI PLAN ONBOARDING GATE (One-time only)
  const hasExamTargets = Boolean(student?.examTargets && student.examTargets.length > 0);
  if (student && student.feeStatus === 'paid' && !hasExamTargets && !onboardingDone) {
    return (
      <div className={isDark ? 'dark' : ''}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center p-4 sm:p-6">
          <div className="max-w-3xl w-full mx-auto mb-4 flex items-center justify-between">
            <BrandLogo href="/student-portal" size="sm" isDark={isDark} />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="h-8 px-2.5 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-xs text-slate-500 hover:text-rose-600"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" /> Sign Out
              </Button>
            </div>
          </div>
          <ExamTargetSetup
            studentId={student.id}
            studentEmail={student.email}
            studentName={student.name}
            isFirstTime={true}
            onSuccess={(examTargets, primaryExam) => {
              try {
                localStorage.setItem(`student_onboarding_done_${student.id}`, 'true');
              } catch {}
              setOnboardingDone(true);
              setStudent({
                ...student,
                examTargets,
                targetExam: primaryExam,
              });
            }}
          />
        </div>
      </div>
    );
  }

  const currentNav = FLAT_NAV.find((n) => n.href === pathname) || FLAT_NAV[0];

  const initials =
    student?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'ST';

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
        {/* ─── DESKTOP TOP HEADER (hidden on mobile) ─── */}
        <header className="hidden md:flex sticky top-0 z-40 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo href="/student-portal" size="md" isDark={isDark} />
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Student Portal
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {(ambientSound !== 'none' || isTimerRunning) && (
              <Link
                href="/student-portal/focus"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300 font-semibold"
              >
                <Headphones className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                {isTimerRunning && <span>{formatTimer(timeLeft)}</span>}
                {ambientSound !== 'none' && <span className="capitalize">{ambientSound}</span>}
                {ambientSound !== 'none' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      stopAmbientSound();
                    }}
                    className="ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    title="Stop Audio"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </Link>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 h-9 px-3 gap-1.5"
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs">Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-slate-600" />
                  <span className="text-xs">Dark</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 h-9"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 h-9"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </header>

        {/* ─── MOBILE APP TOP BAR (visible only on mobile) ─── */}
        <header className="md:hidden sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                {currentNav.label}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight">
                {student?.name || currentUser?.name || 'Student'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {student?.seatNumber && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold">
                <Armchair className="h-3 w-3" />
                {student.seatNumber}
              </span>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            {ambientSound !== 'none' && (
              <button
                type="button"
                onClick={stopAmbientSound}
                className="p-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                title="Stop Focus Audio"
              >
                <Headphones className="h-3.5 w-3.5 animate-pulse" />
              </button>
            )}
          </div>
        </header>

        {/* ─── BODY: FIXED/STICKY PROFESSIONAL DESKTOP SIDEBAR + MAIN CONTENT ─── */}
        <div className="flex-1 flex max-w-7xl w-full mx-auto items-start">
          <aside className="hidden md:flex flex-col w-68 lg:w-72 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-3.5 justify-between">
            <div className="space-y-4">
              {/* Student Profile Summary Card */}
              <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {initials}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                      {student?.name || currentUser?.name || 'Student'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Seat <span className="font-bold text-indigo-600 dark:text-indigo-400">{student?.seatNumber || 'Unassigned'}</span>
                    </p>
                  </div>
                </div>
                {student?.targetExam && (
                  <div className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 truncate">
                    🎯 {student.targetExam}
                  </div>
                )}
              </div>

              {/* Grouped Navigation */}
              <nav className="space-y-3">
                {PORTAL_NAV_GROUPS.map((group) => (
                  <div key={group.group} className="space-y-0.5">
                    <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {group.group}
                    </p>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`group flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                            active
                              ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold ring-1 ring-indigo-200/80 dark:ring-indigo-800/80 shadow-2xs'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`h-4 w-4 shrink-0 transition-colors ${
                                active
                                  ? 'text-indigo-600 dark:text-indigo-400'
                                  : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                                active
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>

            {/* Sidebar Footer */}
            <div className="pt-3 mt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-500" />}
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase">
                  {theme}
                </span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 p-4 sm:p-6 pb-24 md:pb-8">
            {children}
          </main>
        </div>

        {/* ─── MOBILE BOTTOM APP TAB BAR (visible only on mobile) ─── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(15,23,42,0.06)]">
          {MOBILE_PRIMARY_TABS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[60px] transition-colors ${
                  active
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {active && (
                  <span className="absolute -top-1.5 w-6 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
                <div
                  className={`p-1.5 rounded-xl transition-colors ${
                    active ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-[10px] mt-0.5 ${active ? 'font-bold' : 'font-medium'}`}>
                  {item.shortLabel}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreSheetOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[60px] text-slate-500 dark:text-slate-400"
          >
            <div className="p-1.5 rounded-xl">
              <MoreHorizontal className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium mt-0.5">More</span>
          </button>
        </nav>

        {/* ─── MOBILE "MORE" BOTTOM SHEET ─── */}
        {moreSheetOpen && (
          <div className="md:hidden fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 backdrop-blur-xs">
            <div
              className="absolute inset-0"
              onClick={() => setMoreSheetOpen(false)}
            />
            <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-3xl p-5 pb-8 shadow-2xl border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Study Hub & Settings</h3>
                <button
                  type="button"
                  onClick={() => setMoreSheetOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { href: '/student-portal/current-affairs', shortLabel: 'News', icon: Sparkles },
                  { href: '/student-portal/roadmap', shortLabel: 'Roadmap', icon: Map },
                  { href: '/student-portal/exams', shortLabel: 'Exams', icon: Calendar },
                  { href: '/student-portal/peers', shortLabel: 'Peers', icon: Users },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreSheetOpen(false)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center gap-1.5 ${
                        active
                          ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-semibold leading-tight">{item.shortLabel}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  onClick={toggleTheme}
                  className="rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                >
                  {isDark ? <Sun className="h-3.5 w-3.5 mr-1 text-amber-400" /> : <Moon className="h-3.5 w-3.5 mr-1" />}
                  {isDark ? 'Light' : 'Dark'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    refreshAll();
                    setMoreSheetOpen(false);
                  }}
                  className="rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="rounded-xl border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-semibold"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── FLOATING AI STUDY MATE CHAT ─── */}
        <StudyMateChat />
      </div>
    </div>
  );
}

export default function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentPortalProvider>
      <StudentPortalShell>{children}</StudentPortalShell>
    </StudentPortalProvider>
  );
}
