'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  useStudentPortal,
  formatTime,
  formatDate,
  formatDateTime,
  calculateDaysLeft,
} from '@/context/StudentPortalContext';
import { ExamTargetSetup } from '@/components/student-portal/ExamTargetSetup';
import { EditExamTargetModal } from '@/components/student-portal/EditExamTargetModal';
import { MarkdownRenderer } from '@/components/student-portal/MarkdownRenderer';
import { OneTimeFeedbackCard } from '@/components/student-portal/OneTimeFeedbackCard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Armchair,
  Clock,
  CreditCard,
  Calendar,
  Download,
  CheckCircle2,
  AlertCircle,
  Shield,
  Phone,
  Mail,
  MapPin,
  QrCode,
  FileText,
  Map,
  Headphones,
  Sparkles,
  Users,
  X,
  ChevronRight,
  Target,
  Plus,
  Trash2,
  Award,
  Pencil,
} from 'lucide-react';

export default function StudentPortalDashboardPage() {
  const { student, setStudent, currentUser, attendance, library, error } = useStudentPortal();
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [showEditExamModal, setShowEditExamModal] = useState(false);
  const [selectedTargetIdx, setSelectedTargetIdx] = useState(0);

  const examTargets = student?.examTargets || [];
  const activeTarget = examTargets[selectedTargetIdx] || examTargets[0] || null;

  const handleDeleteExamTarget = async (targetId: string) => {
    if (!student || !confirm('Remove this exam target?')) return;
    try {
      const res = await fetch(
        `/api/student-portal/exam-targets?studentId=${student.id}&targetId=${targetId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        setSelectedTargetIdx(0);
        setStudent({
          ...student,
          examTargets: data.data.examTargets,
          targetExam: data.data.targetExam,
        });
      }
    } catch (err) {
      console.error('Error removing exam target:', err);
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('student-portal-qr');
    if (svg && student) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${student.name.replace(/\s+/g, '_')}_QR_Pass.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const shiftDisplay =
    student?.selectedShifts && student.selectedShifts.length > 0
      ? student.selectedShifts
          .map((s) => `${formatTime(s.startTime)} – ${formatTime(s.endTime)}`)
          .join(', ')
      : student?.startTime
      ? `${formatTime(student.startTime)} – ${formatTime(student.endTime)}`
      : 'Full Day';

  const feeBadgeClass =
    student?.feeStatus === 'paid'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : student?.feeStatus === 'partial'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';

  const quickApps = [
    { href: '/student-portal/roadmap', label: 'Study Roadmap', icon: Map, bg: 'bg-indigo-50 text-indigo-600' },
    { href: '/student-portal/practice', label: 'Practice Sets', icon: Target, bg: 'bg-emerald-50 text-emerald-600' },
    { href: '/student-portal/current-affairs', label: 'Daily News', icon: Sparkles, bg: 'bg-amber-50 text-amber-600' },
    { href: '/student-portal/notes', label: 'Notes & PYQ', icon: FileText, bg: 'bg-blue-50 text-blue-600' },
    { href: '/student-portal/focus', label: 'Focus Timer', icon: Headphones, bg: 'bg-purple-50 text-purple-600' },
    { href: '/student-portal/exams', label: 'Exam Alerts', icon: Calendar, bg: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MOBILE APPLICATION VIEW (md:hidden) — App-like Cards & Wallet Pass
         ════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden space-y-5">
        {/* App Pass Wallet Card */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white p-5 shadow-lg shadow-indigo-600/20 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">
                Digital Library Pass
              </span>
              <h1 className="text-xl font-extrabold mt-0.5">
                {student?.name || currentUser?.name || 'Student Member'}
              </h1>
              {student?.targetExam && (
                <p className="text-xs text-indigo-100 mt-0.5">
                  🎯 {student.targetExam}
                </p>
              )}
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                student?.isActive
                  ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/30'
                  : 'bg-rose-500/30 text-white'
              }`}
            >
              {student?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/15">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-indigo-200 block">
                Assigned Seat
              </span>
              <span className="text-lg font-black">
                {student?.seatNumber || 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-indigo-200 block">
                Fee Status
              </span>
              <span className="text-sm font-bold uppercase">
                {student?.feeStatus || 'Unpaid'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="text-xs text-indigo-100 truncate">
              <Clock className="h-3.5 w-3.5 inline mr-1 opacity-80" />
              {shiftDisplay}
            </div>
            <Button
              size="sm"
              onClick={() => setShowQrModal(true)}
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl shadow-sm shrink-0 h-9 px-4"
            >
              <QrCode className="h-4 w-4 mr-1.5" />
              Show QR
            </Button>
          </div>
        </div>

        {/* Mobile Quick Stats Strip */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Check-Ins
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">
              {attendance.length}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Next Exam
            </span>
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5 block">
              {activeTarget ? `${calculateDaysLeft(activeTarget.examDate)}d left` : '--'}
            </span>
          </div>
        </div>

        {/* Study Hub Quick App Tiles */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 px-1">
            Study Hub Apps
          </h2>
          <div className="grid grid-cols-3 gap-2.5">
            {quickApps.map((app) => {
              const Icon = app.icon;
              return (
                <Link
                  key={app.href}
                  href={app.href}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-2 shadow-2xs active:scale-95 transition-transform"
                >
                  <div className={`p-2.5 rounded-xl ${app.bg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {app.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Subscription & Fee Card (Mobile) */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Membership & Fees
              </span>
              <Badge variant="outline" className={`text-[10px] uppercase font-bold ${feeBadgeClass}`}>
                {student?.feeStatus || 'Unpaid'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Plan</span>
              <span className="font-semibold text-slate-900 dark:text-white capitalize">
                {student?.subscriptionPlan || 'Standard'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Monthly Fee</span>
              <span className="font-bold text-slate-900 dark:text-white">
                ₹{student?.feeAmount?.toLocaleString('en-IN') || '0'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 dark:text-slate-400">Valid Till</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatDate(student?.subscriptionExpiry || student?.feeDueDate)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Attendance (Mobile) */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Recent Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendance.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendance.slice(0, 5).map((rec, idx) => (
                  <div key={rec._id || idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{formatDate(rec.date)}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        In: {formatDateTime(rec.checkIn)} • Out: {formatDateTime(rec.checkOut)}
                      </p>
                    </div>
                    <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px]">
                      Present
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
                No attendance logs recorded yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          DESKTOP DASHBOARD VIEW (hidden md:block)
         ════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block space-y-6">
        {/* Profile Header Card */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-6 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-sm">
                {student?.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'ST'}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {student?.name || currentUser?.name || 'Student Member'}
                  </h1>
                  {student?.isActive ? (
                    <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Active Member
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                  {student?.targetExam && (
                    <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      🎯 {student.targetExam}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {student?.email || currentUser?.email}
                  </span>
                  {student?.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      +91 {student.phone}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="border-l border-slate-200 dark:border-slate-800 pl-6 text-right">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                Assigned Desk
              </span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {student?.seatNumber || 'Unassigned'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Desktop 4-Column Quick KPI Strip */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Target Exams</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{examTargets.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Days to Next Exam</span>
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                {activeTarget ? `${calculateDaysLeft(activeTarget.examDate)}d` : '--'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Logged Check-Ins</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{attendance.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Daily Study Goal</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {activeTarget?.studyPlan?.dailyHours || 8} hrs
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* 3-Column Core Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Gate Access QR Pass */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Gate Access QR Pass
                </CardTitle>
                <Badge variant="outline" className="text-[11px] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  Instant Entry
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Scan this code at the library entrance to log check-in & check-out.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center flex-1 space-y-4">
              <div className="p-4 bg-white rounded-2xl border-2 border-indigo-100 dark:border-indigo-900 shadow-sm">
                <QRCodeSVG
                  id="student-portal-qr"
                  value={student?.qrCode || `STU-${student?.id || 'DEMO'}`}
                  size={170}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="text-center space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Pass ID
                </span>
                <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-md">
                  {student?.qrCode || 'N/A'}
                </code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQR}
                className="w-full border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                Download QR Pass (PNG)
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Desk, Shift & Fee Status */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Armchair className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Desk & Fee Details
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Your seat allocation, shift timing and subscription validity
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Seat Number</span>
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {student?.seatNumber || 'Unassigned'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Fee Status</span>
                  <Badge variant="outline" className={`mt-0.5 uppercase font-bold ${feeBadgeClass}`}>
                    {student?.feeStatus || 'Unpaid'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" /> Shift Timing
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{shiftDisplay}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-slate-400" /> Plan & Amount
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white capitalize">
                    {student?.subscriptionPlan || 'Standard'} • ₹{student?.feeAmount || 0}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> Next Fee Due
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatDate(student?.feeDueDate || student?.subscriptionExpiry)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Joined On</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(student?.joinDate)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Library Information & Study Hub Shortcuts */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                {library?.name || 'Aarambh Library'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Library timings, support contact & quick study tools
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-xs flex-1 flex flex-col justify-between">
              <div className="space-y-2.5">
                {library?.address && (
                  <p className="text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>{library.address}</span>
                  </p>
                )}
                {library?.phone && (
                  <p className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{library.phone}</span>
                  </p>
                )}
                {library?.email && (
                  <p className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{library.email}</span>
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Jump
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {quickApps.slice(0, 4).map((app) => (
                    <Link
                      key={app.href}
                      href={app.href}
                      className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/40 transition-colors font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <span className="truncate">{app.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance History Table */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Attendance History
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Your recent daily QR check-in and check-out logs
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {attendance.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendance.slice(0, 10).map((rec, idx) => (
                  <div
                    key={rec._id || idx}
                    className="py-3 flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{formatDate(rec.date)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Check-In: {formatDateTime(rec.checkIn)} • Check-Out: {formatDateTime(rec.checkOut)}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Present
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                No attendance logs recorded yet. Scan your QR pass at the library entrance.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MY EXAM TARGETS & AI STUDY PLAN (Visible on both Mobile & Desktop)
         ════════════════════════════════════════════════════════════════ */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                My Exam Targets & AI Study Plan
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Personalized roadmap generated for your target score and exam date
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {activeTarget && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEditExamModal(true)}
                  className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl h-8"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit Target
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setShowAddExamModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Exam
              </Button>
            </div>
          </div>

          {examTargets.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1">
              {examTargets.map((t, idx) => (
                <button
                  key={t._id || idx}
                  type="button"
                  onClick={() => setSelectedTargetIdx(idx)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedTargetIdx === idx
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                >
                  🎯 {t.examName}
                </button>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-5">
          {activeTarget ? (
            <div className="space-y-5">
              {/* Target Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Exam Date</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatDate(activeTarget.examDate)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800">
                  <span className="text-[11px] text-indigo-700 dark:text-indigo-300 block">Days Left</span>
                  <span className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300">
                    {calculateDaysLeft(activeTarget.examDate)} Days
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block">Target Score</span>
                  <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                    {activeTarget.targetScore} / {activeTarget.totalScore}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-amber-800 dark:text-amber-300 block">Daily Goal</span>
                    <span className="text-sm font-extrabold text-amber-800 dark:text-amber-300">
                      {activeTarget.studyPlan?.dailyHours || 8} hrs/day
                    </span>
                  </div>
                  {examTargets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteExamTarget(activeTarget._id)}
                      className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950"
                      title="Remove Exam Target"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* AI Markdown Roadmap */}
              {activeTarget.studyPlan && (
                <div className="space-y-4">
                  {activeTarget.studyPlan.roadmapMarkdown ? (
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                      <MarkdownRenderer content={activeTarget.studyPlan.roadmapMarkdown} />
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                        <Link href="/student-portal/roadmap">
                          <Button size="sm" variant="outline" className="text-xs border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950">
                            Open Full Study Roadmap <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                        <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider mb-1">
                          <Sparkles className="h-3.5 w-3.5" />
                          AI Study Strategy
                        </div>
                        {activeTarget.studyPlan.summary}
                      </div>
                      <div className="flex justify-end">
                        <Link href="/student-portal/roadmap">
                          <Button size="sm" variant="outline" className="text-xs border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950">
                            Open Markdown Study Roadmap <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
              No exam target configured yet. Click &ldquo;Add Exam&rdquo; to create your AI study plan.
            </div>
          )}
        </CardContent>
      </Card>

      {/* One-Time App Feedback Card */}
      <OneTimeFeedbackCard />

      {/* ─── ADD EXAM TARGET MODAL ─── */}
      {showAddExamModal && student && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <ExamTargetSetup
            studentId={student.id}
            studentEmail={student.email}
            studentName={student.name}
            isFirstTime={false}
            onCancel={() => setShowAddExamModal(false)}
            onSuccess={(updatedTargets, primaryExam) => {
              setStudent({
                ...student,
                examTargets: updatedTargets,
                targetExam: primaryExam,
              });
              setSelectedTargetIdx(Math.max(0, updatedTargets.length - 1));
              setShowAddExamModal(false);
            }}
          />
        </div>
      )}

      {/* ─── EDIT EXAM TARGET MODAL ─── */}
      {showEditExamModal && student && activeTarget && (
        <EditExamTargetModal
          studentId={student.id}
          target={activeTarget}
          onClose={() => setShowEditExamModal(false)}
          onSuccess={(updatedTargets, primaryExam) => {
            setStudent({
              ...student,
              examTargets: updatedTargets,
              targetExam: primaryExam,
            });
            setShowEditExamModal(false);
          }}
        />
      )}

      {/* ─── MOBILE FULL-SCREEN QR MODAL ─── */}
      {showQrModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Gate Entry Pass
              </span>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto">
              <QRCodeSVG
                value={student?.qrCode || `STU-${student?.id || 'DEMO'}`}
                size={210}
                level="H"
                includeMargin={true}
              />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-900">{student?.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Seat: <span className="font-bold text-indigo-600">{student?.seatNumber || 'Unassigned'}</span> • {student?.qrCode || 'N/A'}
              </p>
            </div>
            <Button
              onClick={downloadQR}
              variant="outline"
              className="w-full rounded-xl border-slate-200 text-slate-700 font-semibold"
            >
              <Download className="h-4 w-4 mr-2 text-indigo-600" />
              Save QR Image
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
