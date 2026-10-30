'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRCodeSVG } from 'qrcode.react';
import {
  GraduationCap,
  Armchair,
  Clock,
  CreditCard,
  Calendar,
  LogOut,
  Download,
  CheckCircle2,
  AlertCircle,
  Shield,
  Wifi,
  Phone,
  Mail,
  MapPin,
  Loader2,
  RefreshCw,
  LayoutDashboard,
  BookOpen,
  FileText,
  Search,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  Target,
  Users,
  BookMarked,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Check,
  Headphones,
  Sliders,
  Send,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

interface StudentData {
  id: string;
  name: string;
  email: string;
  phone: string;
  seatNumber: string;
  qrCode: string;
  startTime: string;
  endTime: string;
  selectedShifts: { startTime: string; endTime: string; label?: string }[];
  feeStatus: string;
  feeAmount: number;
  feeDueDate?: string;
  subscriptionPlan: string;
  subscriptionExpiry?: string;
  targetExam?: string;
  studyStage?: string;
  joinDate?: string;
  isActive: boolean;
}

interface AttendanceRecord {
  _id?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  duration?: number;
  status?: string;
}

interface LibraryInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  checkInTime: string;
  checkOutTime: string;
}

interface StudyMaterial {
  id: string;
  title: string;
  category: string;
  subject: string;
  fileSize: string;
  year: string;
  downloads: number;
  downloadUrl: string;
  tags: string[];
  description: string;
}

interface NewsBite {
  id: string;
  category: string;
  title: string;
  takeaway: string;
}

interface PhysicalBook {
  id: string;
  title: string;
  author: string;
  category: string;
  shelfRack: string;
  totalCopies: number;
  availableCopies: number;
  isbn: string;
}

interface ExamItem {
  id: string;
  name: string;
  conductingBody: string;
  examDate: string;
  category: string;
  admitCardStatus: string;
  officialUrl: string;
}

interface PeerBuddy {
  id: string;
  name: string;
  seatNumber: string;
  targetExam: string;
  studyStage: string;
  shift: string;
}

function formatTime(timeStr?: string) {
  if (!timeStr) return '--:--';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0]);
  const m = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateTimeStr?: string) {
  if (!dateTimeStr) return '--:--';
  try {
    const d = new Date(dateTimeStr);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateTimeStr;
  }
}

function calculateDaysLeft(dateStr: string) {
  try {
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = target.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  } catch {
    return 0;
  }
}

export default function StudentPortalPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [library, setLibrary] = useState<LibraryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Tab: 'dashboard' | 'notes' | 'books' | 'current-affairs' | 'pomodoro' | 'exams' | 'peers'
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'notes' | 'books' | 'current-affairs' | 'pomodoro' | 'exams' | 'peers'
  >('dashboard');

  // Study Hub Data States
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [currentAffairs, setCurrentAffairs] = useState<any>(null);
  const [examCalendar, setExamCalendar] = useState<ExamItem[]>([]);
  const [books, setBooks] = useState<PhysicalBook[]>([]);
  const [peerBuddies, setPeerBuddies] = useState<PeerBuddy[]>([]);

  // Search & Filter States
  const [notesCategory, setNotesCategory] = useState<string>('all');
  const [notesSearch, setNotesSearch] = useState<string>('');
  const [bookSearch, setBookSearch] = useState<string>('');
  const [bookCategory, setBookCategory] = useState<string>('all');

  // Book Reservation Modal State
  const [selectedBookForReserve, setSelectedBookForReserve] = useState<PhysicalBook | null>(null);
  const [reservingBook, setReservingBook] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState<string | null>(null);

  // Quiz State
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);

  // Peer Match / Target Exam State
  const [myTargetExam, setMyTargetExam] = useState<string>('UPSC Civil Services');
  const [myStudyStage, setMyStudyStage] = useState<string>('General Studies & Mock Tests');
  const [isSavingTarget, setIsSavingTarget] = useState<boolean>(false);
  const [targetSuccessMsg, setTargetSuccessMsg] = useState<string>('');
  const [connectedPeerIds, setConnectedPeerIds] = useState<Record<string, boolean>>({});

  // Pomodoro Focus Timer State
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);

  // Ambient Sound State (Native Web Audio API)
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'waves' | 'binaural' | 'whitenoise'>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.4);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodesRef = useRef<any[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      fetchStudentData(user.email, user.studentId || user.id);
      fetchStudyHubData(user.email);
    } catch (e) {
      router.push('/auth/signin');
    }
  }, [router]);

  // Pomodoro Interval Timer
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (pomodoroMode === 'focus') {
        setSessionsCompleted((prev) => prev + 1);
        setPomodoroMode('shortBreak');
        setTimeLeft(5 * 60);
      } else {
        setPomodoroMode('focus');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, pomodoroMode]);

  // Stop Web Audio on Component Unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  const fetchStudentData = async (email: string, studentId?: string) => {
    setLoading(true);
    setError('');

    try {
      const queryParam = studentId ? `id=${studentId}` : `email=${encodeURIComponent(email)}`;
      const res = await fetch(`/api/student-portal/me?${queryParam}`);
      const data = await res.json();

      if (data.success) {
        setStudent(data.data.student);
        setAttendance(data.data.attendance || []);
        setLibrary(data.data.library);
        if (data.data.student.targetExam) {
          setMyTargetExam(data.data.student.targetExam);
        }
        if (data.data.student.studyStage) {
          setMyStudyStage(data.data.student.studyStage);
        }
      } else {
        setError(data.error || 'Failed to load your student profile');
      }
    } catch (err) {
      console.error('Error fetching student profile:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudyHubData = async (email: string) => {
    try {
      const res = await fetch(`/api/student-portal/study-hub?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) {
        setMaterials(data.data.materials || []);
        setCurrentAffairs(data.data.currentAffairs);
        setExamCalendar(data.data.examCalendar || []);
        setBooks(data.data.books || []);
        setPeerBuddies(data.data.peerBuddies || []);
      }
    } catch (e) {
      console.error('Error loading study hub data:', e);
    }
  };

  // Web Audio Ambient Synthesizer
  const playAmbientSound = (type: 'rain' | 'waves' | 'binaural' | 'whitenoise') => {
    stopAmbientSound();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(ambientVolume, ctx.currentTime);
      gain.connect(ctx.destination);
      gainNodeRef.current = gain;

      if (type === 'rain' || type === 'whitenoise') {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
        filter.frequency.setValueAtTime(type === 'rain' ? 800 : 1200, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gain);
        whiteNoise.start();
        soundNodesRef.current = [whiteNoise, filter];
      } else if (type === 'waves') {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        let b0 = 0,
          b1 = 0,
          b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          output[i] = (b0 + b1 + b2) * 0.11;
        }
        const pinkNoise = ctx.createBufferSource();
        pinkNoise.buffer = buffer;
        pinkNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);

        pinkNoise.connect(filter);
        filter.connect(gain);
        pinkNoise.start();
        soundNodesRef.current = [pinkNoise, filter];
      } else if (type === 'binaural') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.frequency.setValueAtTime(432, ctx.currentTime);
        osc2.frequency.setValueAtTime(442, ctx.currentTime);
        osc1.connect(gain);
        osc2.connect(gain);
        osc1.start();
        osc2.start();
        soundNodesRef.current = [osc1, osc2];
      }

      setAmbientSound(type);
    } catch (e) {
      console.error('Audio synthesizer error:', e);
    }
  };

  const stopAmbientSound = () => {
    soundNodesRef.current.forEach((node) => {
      try {
        node.stop?.();
        node.disconnect?.();
      } catch {}
    });
    soundNodesRef.current = [];

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch {}
    }
    audioCtxRef.current = null;
    setAmbientSound('none');
  };

  const handleVolumeChange = (newVolume: number) => {
    setAmbientVolume(newVolume);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVolume, audioCtxRef.current.currentTime);
    }
  };

  const handlePomodoroModeChange = (mode: 'focus' | 'shortBreak' | 'longBreak') => {
    setIsTimerRunning(false);
    setPomodoroMode(mode);
    if (mode === 'focus') setTimeLeft(25 * 60);
    if (mode === 'shortBreak') setTimeLeft(5 * 60);
    if (mode === 'longBreak') setTimeLeft(15 * 60);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    router.push('/auth/signin');
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

  const handleReserveBook = async () => {
    if (!selectedBookForReserve) return;
    setReservingBook(true);
    try {
      const res = await fetch('/api/student-portal/study-hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reserve-book',
          studentId: student?.id,
          studentEmail: student?.email,
          bookId: selectedBookForReserve.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReservationSuccess(data.reservationCode);
        // decrement local count
        setBooks((prev) =>
          prev.map((b) =>
            b.id === selectedBookForReserve.id ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b
          )
        );
      }
    } catch (e) {
      console.error('Reservation error:', e);
    } finally {
      setReservingBook(false);
    }
  };

  const handleSaveTargetExam = async () => {
    setIsSavingTarget(true);
    setTargetSuccessMsg('');
    try {
      const res = await fetch('/api/student-portal/study-hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-target-exam',
          studentId: student?.id,
          studentEmail: student?.email,
          targetExam: myTargetExam,
          studyStage: myStudyStage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTargetSuccessMsg('Your Exam Target has been saved! You are now discoverable to study peers in the library.');
        if (student) {
          setStudent({ ...student, targetExam: myTargetExam, studyStage: myStudyStage });
        }
      }
    } catch (e) {
      console.error('Error saving target exam:', e);
    } finally {
      setIsSavingTarget(false);
    }
  };

  const handleConnectPeer = (peerId: string) => {
    setConnectedPeerIds((prev) => ({ ...prev, [peerId]: true }));
  };

  // Filtered Study Materials
  const filteredMaterials = materials.filter((m) => {
    const matchesCat = notesCategory === 'all' || m.category.toLowerCase() === notesCategory.toLowerCase();
    const matchesSearch =
      notesSearch.trim() === '' ||
      m.title.toLowerCase().includes(notesSearch.toLowerCase()) ||
      m.subject.toLowerCase().includes(notesSearch.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(notesSearch.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Filtered Physical Books
  const filteredBooks = books.filter((b) => {
    const matchesCat = bookCategory === 'all' || b.category.toLowerCase() === bookCategory.toLowerCase();
    const matchesSearch =
      bookSearch.trim() === '' ||
      b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.author.toLowerCase().includes(bookSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-300">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-base font-medium">Loading your student portal & study hub...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo href="/student-portal" size="md" />
            <span className="hidden sm:inline-block text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Student Portal & Study Hub
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Ambient Sound Indicator in Header */}
            {ambientSound !== 'none' && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-800/60 text-xs text-indigo-300">
                <Headphones className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                <span className="capitalize font-medium">{ambientSound} Audio Playing</span>
                <button
                  onClick={stopAmbientSound}
                  className="text-slate-400 hover:text-white ml-1 text-xs"
                  title="Stop audio"
                >
                  ✕
                </button>
              </div>
            )}

            {(currentUser?.role === 'admin' || currentUser?.role === 'staff') && (
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="border-indigo-600 text-indigo-400 hover:bg-indigo-950/40">
                  <LayoutDashboard className="h-4 w-4 mr-1.5" />
                  Admin Dashboard
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => currentUser && fetchStudentData(currentUser.email, currentUser.studentId)}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* Profile Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/70 border border-indigo-900/40 p-6 sm:p-7 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
                {student?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {student?.name || currentUser?.name || 'Student Member'}
                  </h1>
                  {student?.isActive ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Active Member
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                  {student?.targetExam && (
                    <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                      🎯 {student.targetExam}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    {student?.email || currentUser?.email}
                  </span>
                  {student?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      +91 {student.phone}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 self-start sm:self-auto sm:border-l sm:border-slate-800 sm:pl-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Assigned Desk</span>
                <span className="text-2xl font-black text-indigo-400">
                  {student?.seatNumber ? student.seatNumber : 'Unassigned'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800 text-sm">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Armchair className="h-4 w-4" />
            <span>Gate Pass & Desk</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'notes'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Digital Notes & PYQ Bank</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/30 text-indigo-200">New</span>
          </button>

          <button
            onClick={() => setActiveTab('books')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'books'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookMarked className="h-4 w-4" />
            <span>Library Shelf & Reserve</span>
          </button>

          <button
            onClick={() => setActiveTab('current-affairs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'current-affairs'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Daily Current Affairs & Quiz</span>
          </button>

          <button
            onClick={() => setActiveTab('pomodoro')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'pomodoro'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Headphones className="h-4 w-4 text-purple-400" />
            <span>Pomodoro & Focus Audio</span>
          </button>

          <button
            onClick={() => setActiveTab('exams')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'exams'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Calendar className="h-4 w-4 text-emerald-400" />
            <span>Exam Calendar & Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('peers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'peers'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="h-4 w-4 text-cyan-400" />
            <span>Study Peer Match</span>
          </button>
        </div>

        {/* TAB 1: DASHBOARD (GATE PASS & DESK & ATTENDANCE) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card 1: Digital QR Entry Pass */}
              <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                      <Shield className="h-4 w-4 text-indigo-400" />
                      Gate Access QR Pass
                    </CardTitle>
                    <Badge variant="outline" className="text-[11px] border-slate-700 text-slate-300">
                      Instant Entry
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-400">
                    Scan this code at the library entrance scanner to log check-in & check-out.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center flex-1 space-y-4">
                  <div className="p-4 bg-white rounded-2xl shadow-2xl ring-4 ring-indigo-500/20">
                    <QRCodeSVG
                      id="student-portal-qr"
                      value={student?.qrCode || `STU-${student?.id || 'DEMO'}`}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <div className="text-center space-y-1 w-full">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block">Pass ID</span>
                    <code className="px-3 py-1 bg-slate-950 border border-slate-800 rounded text-sm font-mono text-indigo-300 inline-block font-bold">
                      {student?.qrCode || 'STU-GENERATING'}
                    </code>
                  </div>

                  <Button
                    onClick={downloadQR}
                    variant="outline"
                    className="w-full border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 mt-2"
                  >
                    <Download className="h-4 w-4 mr-2 text-indigo-400" />
                    Download Digital Pass
                  </Button>
                </CardContent>
              </Card>

              {/* Card 2: Seat & Shift Schedule */}
              <Card className="bg-slate-900 border-slate-800 shadow-xl flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                      <Armchair className="h-4 w-4 text-emerald-400" />
                      Seat & Shift Details
                    </CardTitle>
                    <Badge variant="outline" className="text-[11px] border-slate-700 text-slate-300">
                      Desk Allocation
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-400">
                    Designated study space and operating hours
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4 flex-1">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">Desk Number</span>
                      <span className="text-xl font-bold text-white">
                        {student?.seatNumber ? `Desk ${student.seatNumber}` : 'Pending Assignment'}
                      </span>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                      <Armchair className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-indigo-400" />
                        Shift Timing
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {formatTime(student?.startTime)} - {formatTime(student?.endTime)}
                      </span>
                    </div>

                    {student?.selectedShifts && student.selectedShifts.length > 0 && (
                      <div className="pt-2 border-t border-slate-800 text-xs">
                        <span className="text-slate-500 block mb-1.5 font-medium">Selected Shift Slots:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {student.selectedShifts.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium text-[11px]"
                            >
                              {s.label || `Slot ${idx + 1}`}: {formatTime(s.startTime)} - {formatTime(s.endTime)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Library Opens:</span>
                      <span className="font-semibold text-slate-200">{library?.checkInTime || '08:00 AM'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Library Closes:</span>
                      <span className="font-semibold text-slate-200">{library?.checkOutTime || '10:00 PM'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Subscription & Fee Status */}
              <Card className="bg-slate-900 border-slate-800 shadow-xl flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                      <CreditCard className="h-4 w-4 text-purple-400" />
                      Subscription & Fees
                    </CardTitle>
                    <Badge
                      className={`text-[11px] capitalize ${
                        student?.feeStatus === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : student?.feeStatus === 'partial'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}
                    >
                      {student?.feeStatus || 'Unpaid'}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-400">
                    Plan status and renewal validity
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4 flex-1">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">Current Plan</span>
                      <span className="text-xl font-bold text-white capitalize">
                        {student?.subscriptionPlan || 'Standard'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-medium block">Monthly Fee</span>
                      <span className="text-xl font-black text-indigo-400">₹{student?.feeAmount || 0}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fee Due Date:</span>
                      <span className="font-semibold text-slate-200">{formatDate(student?.feeDueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Subscription Validity:</span>
                      <span className="font-semibold text-slate-200">{formatDate(student?.subscriptionExpiry)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Member Since:</span>
                      <span className="font-semibold text-slate-200">{formatDate(student?.joinDate)}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-300/90 leading-relaxed">
                    💡 To renew or upgrade your seat subscription, please visit the library front desk or speak with the library manager.
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Table */}
            <Card className="bg-slate-900 border-slate-800 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                      <Calendar className="h-5 w-5 text-indigo-400" />
                      My Recent Attendance History
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Your daily gate check-in and check-out logs
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
                    Total Logs: {attendance.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <Calendar className="h-10 w-10 mx-auto text-slate-600" />
                    <p className="text-sm font-medium">No attendance records yet.</p>
                    <p className="text-xs text-slate-600">Scan your QR code at the entrance kiosk to record your first visit!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase font-semibold">
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Check-In</th>
                          <th className="py-3 px-4">Check-Out</th>
                          <th className="py-3 px-4">Duration</th>
                          <th className="py-3 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {attendance.map((record, index) => {
                          const durationMinutes =
                            record.duration ||
                            (record.checkIn && record.checkOut
                              ? Math.round(
                                  (new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / 60000
                                )
                              : null);
                          const hours = durationMinutes ? Math.floor(durationMinutes / 60) : 0;
                          const mins = durationMinutes ? durationMinutes % 60 : 0;

                          return (
                            <tr key={record._id || index} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-4 font-medium text-slate-200">
                                {formatDate(record.date || record.checkIn)}
                              </td>
                              <td className="py-3 px-4 text-emerald-400 font-mono text-xs">
                                {formatDateTime(record.checkIn)}
                              </td>
                              <td className="py-3 px-4 text-purple-400 font-mono text-xs">
                                {record.checkOut ? (
                                  formatDateTime(record.checkOut)
                                ) : (
                                  <span className="text-amber-400 text-xs">Active Session</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-300 text-xs">
                                {durationMinutes ? `${hours}h ${mins}m` : '--'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Verified
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: DIGITAL NOTES & PYQ BANK */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800 shadow-xl">
              <CardHeader className="pb-4 border-b border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                      <FileText className="h-5 w-5 text-indigo-400" />
                      Digital Notes, PYQs & Solved Papers
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Standard syllabus notes, topic-wise solved previous year question papers and toppers' summaries
                    </CardDescription>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="Search notes, PYQs, subjects..."
                      value={notesSearch}
                      onChange={(e) => setNotesSearch(e.target.value)}
                      className="pl-9 h-9 text-xs bg-slate-950 border-slate-800 text-white"
                    />
                  </div>
                </div>

                {/* Exam Filter Pills */}
                <div className="flex flex-wrap gap-2 pt-3">
                  {['all', 'UPSC', 'SSC', 'NEET', 'JEE', 'Banking'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNotesCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                        notesCategory === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {cat === 'all' ? 'All Exams' : cat}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMaterials.map((mat) => (
                    <div
                      key={mat.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] font-bold uppercase">
                            {mat.category} • {mat.subject}
                          </Badge>
                          <span className="text-[11px] text-slate-500 font-mono">{mat.fileSize}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                          {mat.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {mat.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {mat.tags.slice(0, 2).map((t, idx) => (
                            <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                              #{t}
                            </span>
                          ))}
                        </div>

                        <Button
                          size="sm"
                          className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium gap-1"
                          onClick={() => alert(`Starting download for: ${mat.title}`)}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: PHYSICAL BOOK LENDING & SHELF CATALOG */}
        {activeTab === 'books' && (
          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800 shadow-xl">
              <CardHeader className="pb-4 border-b border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                      <BookMarked className="h-5 w-5 text-indigo-400" />
                      Library Physical Shelf & Book Lending Catalog
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Check real-time shelf availability and reserve hardcopy reference books directly to your desk
                    </CardDescription>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="Search books, authors, subjects..."
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      className="pl-9 h-9 text-xs bg-slate-950 border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-3">
                  {['all', 'Polity', 'History', 'Economy', 'Physics', 'Aptitude', 'Geography'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setBookCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                        bookCategory === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {cat === 'all' ? 'All Subjects' : cat}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBooks.map((book) => {
                    const isAvailable = book.availableCopies > 0;
                    return (
                      <div
                        key={book.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                              {book.category}
                            </span>
                            {isAvailable ? (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                                {book.availableCopies} Copies Available
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[10px]">
                                Issued / Out of Stock
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-white line-clamp-1">{book.title}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Author: {book.author}</p>
                          <div className="mt-2 p-2 rounded-lg bg-slate-900 border border-slate-800/60 text-[11px] text-slate-300 flex items-center justify-between">
                            <span>Shelf Location:</span>
                            <span className="font-semibold text-indigo-300">{book.shelfRack}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-mono">ISBN: {book.isbn.slice(-6)}</span>
                          <Button
                            size="sm"
                            disabled={!isAvailable}
                            onClick={() => {
                              setSelectedBookForReserve(book);
                              setReservationSuccess(null);
                            }}
                            className={`h-8 text-xs font-semibold ${
                              isAvailable
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <BookOpen className="h-3.5 w-3.5 mr-1" />
                            {isAvailable ? 'Reserve for Desk' : 'Issued'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Book Reservation Dialog */}
            {selectedBookForReserve && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-indigo-400" />
                      Reserve Physical Book
                    </h3>
                    <button
                      onClick={() => setSelectedBookForReserve(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  {!reservationSuccess ? (
                    <>
                      <div className="space-y-2 text-xs text-slate-300">
                        <p className="text-sm font-semibold text-white">{selectedBookForReserve.title}</p>
                        <p>Author: <span className="text-slate-200">{selectedBookForReserve.author}</span></p>
                        <p>Shelf Rack: <span className="text-indigo-400 font-mono">{selectedBookForReserve.shelfRack}</span></p>
                        <p>Desk Assigned: <span className="text-emerald-400 font-semibold">{student?.seatNumber || 'Current Desk'}</span></p>
                      </div>

                      <div className="p-3 bg-indigo-950/40 border border-indigo-900/60 rounded-xl text-xs text-indigo-300 leading-relaxed">
                        📌 Once reserved, the library staff will hold this copy for your desk for <strong>24 hours</strong>. Please collect it from the front desk with your reservation token.
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedBookForReserve(null)}
                          className="text-slate-400"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={reservingBook}
                          onClick={handleReserveBook}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                        >
                          {reservingBook ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                          Confirm Reservation
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 space-y-3">
                      <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <Check className="h-6 w-6" />
                      </div>
                      <h4 className="text-base font-bold text-white">Book Successfully Reserved!</h4>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                        <span className="text-xs text-slate-500 uppercase tracking-wider block">Pickup Pass Code</span>
                        <span className="text-xl font-mono font-black text-indigo-300">{reservationSuccess}</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Show this pass code to the receptionist to pick up your copy.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setSelectedBookForReserve(null)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white mt-2"
                      >
                        Done
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DAILY CURRENT AFFAIRS & EDITORIAL DIGEST */}
        {activeTab === 'current-affairs' && currentAffairs && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Editorial of the day */}
              <Card className="lg:col-span-2 bg-slate-900 border-slate-800 shadow-xl">
                <CardHeader className="pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      Daily Editorial Analysis • {currentAffairs.date}
                    </CardTitle>
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                      Today's Focus
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-400">
                    Source: {currentAffairs.editorialHighlight.source}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <h3 className="text-lg font-bold text-white mb-2">
                      {currentAffairs.editorialHighlight.headline}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {currentAffairs.editorialHighlight.summary}
                    </p>
                    <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-indigo-400 font-semibold flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5" />
                      <span>{currentAffairs.editorialHighlight.relevance}</span>
                    </div>
                  </div>

                  {/* News Bites */}
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                      Key News Takeaways for Exams
                    </h4>
                    {currentAffairs.newsBites.map((bite: NewsBite) => (
                      <div key={bite.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] text-indigo-300 border-indigo-900 bg-indigo-950/40">
                            {bite.category}
                          </Badge>
                          <span className="text-xs font-bold text-white">{bite.title}</span>
                        </div>
                        <p className="text-xs text-slate-400 pl-1">{bite.takeaway}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quiz of the Day */}
              <Card className="bg-slate-900 border-slate-800 shadow-xl flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                      <HelpCircle className="h-4 w-4 text-emerald-400" />
                      Daily Aspirant Quiz
                    </CardTitle>
                    <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                      1 Question Drill
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-400">
                    Test your daily static & current affairs retention
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4 flex-1">
                  <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed font-medium">
                    {currentAffairs.quizOfTheDay.question}
                  </p>

                  <div className="space-y-2 pt-2">
                    {currentAffairs.quizOfTheDay.options.map((opt: string, idx: number) => {
                      const isSelected = selectedQuizAnswer === idx;
                      const isCorrect = idx === currentAffairs.quizOfTheDay.correctIndex;
                      let btnStyle = 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700';

                      if (isQuizSubmitted) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-rose-950/60 border-rose-500 text-rose-300';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-indigo-950 border-indigo-500 text-white font-semibold';
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => !isQuizSubmitted && setSelectedQuizAnswer(idx)}
                          className={`w-full p-2.5 rounded-lg border text-xs text-left transition-all ${btnStyle}`}
                        >
                          <span className="font-bold mr-2 text-slate-500">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {!isQuizSubmitted ? (
                    <Button
                      size="sm"
                      disabled={selectedQuizAnswer === null}
                      onClick={() => setIsQuizSubmitted(true)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold mt-2"
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1 mt-2">
                      <span className="font-bold text-emerald-400 block">Explanation:</span>
                      <p className="text-slate-400 leading-relaxed">
                        {currentAffairs.quizOfTheDay.explanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 5: POMODORO & AMBIENT FOCUS AUDIO */}
        {activeTab === 'pomodoro' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pomodoro Timer */}
              <Card className="bg-slate-900 border-slate-800 shadow-xl text-center">
                <CardHeader className="pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                      <Clock className="h-4 w-4 text-purple-400" />
                      Deep Focus Pomodoro Timer
                    </CardTitle>
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                      Sessions: {sessionsCompleted}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-400">
                    25-minute deep focus intervals followed by 5-minute cognitive rest
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-8 pb-8 space-y-6">
                  {/* Mode Buttons */}
                  <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                    <button
                      onClick={() => handlePomodoroModeChange('focus')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        pomodoroMode === 'focus' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Focus (25m)
                    </button>
                    <button
                      onClick={() => handlePomodoroModeChange('shortBreak')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        pomodoroMode === 'shortBreak'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Short Break (5m)
                    </button>
                    <button
                      onClick={() => handlePomodoroModeChange('longBreak')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        pomodoroMode === 'longBreak'
                          ? 'bg-purple-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Long Break (15m)
                    </button>
                  </div>

                  {/* Timer Display */}
                  <div className="py-6">
                    <div className="text-6xl sm:text-7xl font-mono font-extrabold text-white tracking-tight">
                      {formatTimer(timeLeft)}
                    </div>
                    <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold block mt-2">
                      {pomodoroMode === 'focus' ? '🎯 Stay in the Zone' : '☕ Step Away & Hydrate'}
                    </span>
                  </div>

                  {/* Timer Controls */}
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      size="lg"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className={`px-8 font-bold ${
                        isTimerRunning
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isTimerRunning ? (
                        <>
                          <Pause className="h-5 w-5 mr-2" /> Pause Focus
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5 mr-2" /> Start Focus
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => handlePomodoroModeChange(pomodoroMode)}
                      className="border-slate-800 hover:bg-slate-800 text-slate-300"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Native Ambient Sound Synthesizer */}
              <Card className="bg-slate-900 border-slate-800 shadow-xl flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                      <Headphones className="h-4 w-4 text-indigo-400" />
                      Ambient Study Sound Machine
                    </CardTitle>
                    <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 text-xs">
                      Web Audio Synthesizer
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-400">
                    High-focus background sounds generated in real-time by your browser (No buffering, 100% offline)
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'rain', label: 'Gentle Rain', desc: 'Calming low-pass rain frequency', icon: '🌧️' },
                      { id: 'waves', label: 'Ocean Breeze', desc: 'Pink noise wave cycles', icon: '🌊' },
                      { id: 'binaural', label: '432 Hz Binaural', desc: 'Deep alpha wave study tone', icon: '🧠' },
                      { id: 'whitenoise', label: 'Pure White Noise', desc: 'Blocks out noisy chatter', icon: '📻' },
                    ].map((sound) => {
                      const isCurrent = ambientSound === sound.id;
                      return (
                        <button
                          key={sound.id}
                          onClick={() => {
                            if (isCurrent) {
                              stopAmbientSound();
                            } else {
                              playAmbientSound(sound.id as any);
                            }
                          }}
                          className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            isCurrent
                              ? 'bg-indigo-950 border-indigo-500 shadow-lg shadow-indigo-950/50'
                              : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-2xl mb-1">{sound.icon}</div>
                            <div className="text-xs font-bold text-white flex items-center justify-between">
                              <span>{sound.label}</span>
                              {isCurrent && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">{sound.desc}</p>
                          </div>
                          <span
                            className={`text-[10px] font-semibold mt-2.5 block ${
                              isCurrent ? 'text-indigo-400' : 'text-slate-500'
                            }`}
                          >
                            {isCurrent ? '● Playing' : 'Click to Play'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Volume Slider */}
                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Volume2 className="h-4 w-4 text-indigo-400" />
                        Ambient Volume: {Math.round(ambientVolume * 100)}%
                      </span>
                      {ambientSound !== 'none' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={stopAmbientSound}
                          className="h-6 text-xs text-rose-400 hover:text-rose-300"
                        >
                          Stop Sound
                        </Button>
                      )}
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.05"
                      value={ambientVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 6: EXAM CALENDAR & ALERTS */}
        {activeTab === 'exams' && (
          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800 shadow-xl">
              <CardHeader className="pb-3 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                      <Calendar className="h-5 w-5 text-emerald-400" />
                      Upcoming Competitive Exam Timetable & Countdown
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Track upcoming preliminary and mains test dates with live countdown timers and official portals
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
                    Live Tracking
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {examCalendar.map((exam) => {
                    const daysLeft = calculateDaysLeft(exam.examDate);
                    return (
                      <div
                        key={exam.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Badge className="bg-slate-900 text-slate-300 border-slate-800 text-[10px]">
                              {exam.conductingBody} • {exam.category}
                            </Badge>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              ⏳ {daysLeft} Days to Go
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-white">{exam.name}</h3>
                          <div className="mt-2.5 space-y-1 text-xs text-slate-400">
                            <p>
                              Exam Date: <span className="text-slate-200 font-semibold">{formatDate(exam.examDate)}</span>
                            </p>
                            <p>
                              Admit Card: <span className="text-indigo-400 font-medium">{exam.admitCardStatus}</span>
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">Official Exam Portal</span>
                          <a
                            href={exam.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                          >
                            <span>Visit Portal</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 7: STUDY PEER NETWORK */}
        {activeTab === 'peers' && (
          <div className="space-y-6">
            {/* Set My Target Exam */}
            <Card className="bg-slate-900 border-slate-800 shadow-xl">
              <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                  <Target className="h-4 w-4 text-indigo-400" />
                  My Target Exam Profile
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Set your exam focus to discover other library members studying the same subjects
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Primary Target Exam</Label>
                    <select
                      value={myTargetExam}
                      onChange={(e) => setMyTargetExam(e.target.value)}
                      className="w-full h-9 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white px-3 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="UPSC Civil Services">UPSC Civil Services (IAS/IPS)</option>
                      <option value="SSC CGL">SSC CGL / CHSL</option>
                      <option value="NEET (UG)">NEET (UG) Medical</option>
                      <option value="JEE Advanced">JEE Main / Advanced</option>
                      <option value="Banking / IBPS PO">Banking / IBPS / SBI PO</option>
                      <option value="State PCS">State PCS (BPSC / UPPSC / MPPSC)</option>
                      <option value="CA / CS / CMA">CA / CS Professional</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Preparation Stage / Notes</Label>
                    <Input
                      placeholder="e.g. Prelims Mock Series, Optional Paper Revision..."
                      value={myStudyStage}
                      onChange={(e) => setMyStudyStage(e.target.value)}
                      className="h-9 text-xs bg-slate-950 border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {targetSuccessMsg && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> {targetSuccessMsg}
                    </span>
                  )}
                  <Button
                    size="sm"
                    disabled={isSavingTarget}
                    onClick={handleSaveTargetExam}
                    className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                  >
                    {isSavingTarget ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                    Save My Target
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Library Peer Buddies Grid */}
            <Card className="bg-slate-900 border-slate-800 shadow-xl">
              <CardHeader className="pb-3 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                      <Users className="h-4 w-4 text-cyan-400" />
                      Fellow Aspirants in Aarambh Library
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Connect with peers studying the same syllabus to share question banks or schedule mock tests
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
                    {peerBuddies.length} Peers Registered
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {peerBuddies.map((peer) => {
                    const isConnected = connectedPeerIds[peer.id];
                    return (
                      <div
                        key={peer.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-2.5">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                              {peer.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-white block">{peer.name}</span>
                              <span className="text-[11px] text-indigo-400 font-semibold">{peer.seatNumber}</span>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs">
                            <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-[10px]">
                              {peer.targetExam}
                            </Badge>
                            <p className="text-[11px] text-slate-400 pt-1 line-clamp-2">{peer.studyStage}</p>
                            <span className="text-[10px] text-slate-500 block pt-1">Shift: {peer.shift}</span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          disabled={isConnected}
                          onClick={() => handleConnectPeer(peer.id)}
                          className={`w-full h-7 text-xs font-medium ${
                            isConnected
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {isConnected ? (
                            <>
                              <Check className="h-3 w-3 mr-1" /> Connect Sent
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3 mr-1" /> Connect / Study Group
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Library Info & Wi-Fi guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <Wifi className="h-4 w-4 text-indigo-400" />
                Library Wi-Fi & Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <p>• Connect to <strong>Aarambh-Member-WiFi</strong> with your registered device.</p>
              <p>• Maintain absolute silence in the main study hall.</p>
              <p>• Keep mobile phones on silent/vibrate mode at all times.</p>
              <p>• Food and non-water beverages are restricted to the dining area.</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <MapPin className="h-4 w-4 text-indigo-400" />
                Library Helpdesk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-400">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                <span>Support: {library?.phone || '+91 9876543210'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                <span>Email: {library?.email || 'info@aarambhlibrary.com'}</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                <span>{library?.address || 'Aarambh Library Study Center'}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
