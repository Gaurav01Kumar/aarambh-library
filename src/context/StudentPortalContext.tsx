'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';

export interface ExamTarget {
  _id: string;
  examName: string;
  examDate: string;
  totalScore: number;
  targetScore: number;
  isPrimary?: boolean;
  studyPlan?: any;
  createdAt?: string;
}

export interface StudentData {
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
  examTargets?: ExamTarget[];
  joinDate?: string;
  isActive: boolean;
}

export interface AttendanceRecord {
  _id?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  duration?: number;
  status?: string;
}

export interface LibraryInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  checkInTime: string;
  checkOutTime: string;
}

export interface StudyMaterial {
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

export interface NewsBite {
  id: string;
  category: string;
  title: string;
  takeaway: string;
}

export interface PhysicalBook {
  id: string;
  title: string;
  author: string;
  category: string;
  shelfRack: string;
  totalCopies: number;
  availableCopies: number;
  isbn: string;
}

export interface ExamItem {
  id: string;
  name: string;
  conductingBody: string;
  examDate: string;
  category: string;
  admitCardStatus: string;
  officialUrl: string;
}

export interface PeerBuddy {
  id: string;
  name: string;
  seatNumber: string;
  targetExam: string;
  studyStage: string;
  shift: string;
}

export function formatTime(timeStr?: string) {
  if (!timeStr) return '--:--';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
}

export function formatDate(dateStr?: string) {
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

export function formatDateTime(dateTimeStr?: string) {
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

export function calculateDaysLeft(dateStr: string) {
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

export function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

interface StudentPortalContextValue {
  currentUser: any;
  student: StudentData | null;
  setStudent: React.Dispatch<React.SetStateAction<StudentData | null>>;
  attendance: AttendanceRecord[];
  library: LibraryInfo | null;
  loading: boolean;
  error: string;
  materials: StudyMaterial[];
  currentAffairs: any;
  examCalendar: ExamItem[];
  books: PhysicalBook[];
  setBooks: React.Dispatch<React.SetStateAction<PhysicalBook[]>>;
  peerBuddies: PeerBuddy[];
  refreshAll: () => void;
  handleSignOut: () => void;
  // Pomodoro & Audio
  pomodoroMode: 'focus' | 'shortBreak' | 'longBreak';
  timeLeft: number;
  isTimerRunning: boolean;
  setIsTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
  sessionsCompleted: number;
  handlePomodoroModeChange: (mode: 'focus' | 'shortBreak' | 'longBreak') => void;
  ambientSound: 'none' | 'rain' | 'waves' | 'binaural' | 'whitenoise';
  ambientVolume: number;
  playAmbientSound: (type: 'rain' | 'waves' | 'binaural' | 'whitenoise') => void;
  stopAmbientSound: () => void;
  handleVolumeChange: (newVolume: number) => void;
}

const StudentPortalContext = createContext<StudentPortalContextValue | null>(null);

export function StudentPortalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [library, setLibrary] = useState<LibraryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Study Hub Data
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [currentAffairs, setCurrentAffairs] = useState<any>(null);
  const [examCalendar, setExamCalendar] = useState<ExamItem[]>([]);
  const [books, setBooks] = useState<PhysicalBook[]>([]);
  const [peerBuddies, setPeerBuddies] = useState<PeerBuddy[]>([]);

  // Pomodoro Timer
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);

  // Ambient Sound Synthesizer
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'waves' | 'binaural' | 'whitenoise'>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.4);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodesRef = useRef<any[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  const fetchStudentData = useCallback(async (email: string, studentId?: string) => {
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
      } else {
        setError(data.error || 'Failed to load your student profile');
      }
    } catch (err) {
      console.error('Error fetching student profile:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudyHubData = useCallback(async (email: string) => {
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
  }, []);

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
    } catch {
      router.push('/auth/signin');
    }
  }, [router, fetchStudentData, fetchStudyHubData]);

  // Pomodoro Interval
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

  const stopAmbientSound = useCallback(() => {
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
  }, []);

  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, [stopAmbientSound]);

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

  const refreshAll = () => {
    if (currentUser) {
      fetchStudentData(currentUser.email, currentUser.studentId || currentUser.id);
      fetchStudyHubData(currentUser.email);
    }
  };

  const handleSignOut = () => {
    stopAmbientSound();
    localStorage.removeItem('user');
    router.push('/auth/signin');
  };

  return (
    <StudentPortalContext.Provider
      value={{
        currentUser,
        student,
        setStudent,
        attendance,
        library,
        loading,
        error,
        materials,
        currentAffairs,
        examCalendar,
        books,
        setBooks,
        peerBuddies,
        refreshAll,
        handleSignOut,
        pomodoroMode,
        timeLeft,
        isTimerRunning,
        setIsTimerRunning,
        sessionsCompleted,
        handlePomodoroModeChange,
        ambientSound,
        ambientVolume,
        playAmbientSound,
        stopAmbientSound,
        handleVolumeChange,
      }}
    >
      {children}
    </StudentPortalContext.Provider>
  );
}

export function useStudentPortal() {
  const ctx = useContext(StudentPortalContext);
  if (!ctx) {
    throw new Error('useStudentPortal must be used within a StudentPortalProvider');
  }
  return ctx;
}

