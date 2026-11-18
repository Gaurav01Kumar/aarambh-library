'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MoreVertical, 
  Trash2, 
  Armchair, 
  Users, 
  UserCheck, 
  AlertCircle, 
  AlertTriangle,
  Search,
  Filter,
  Edit,
  Sparkles,
  Layers,
  CreditCard,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Phone,
  ArrowRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddSeatDialog } from '@/components/add-seat-dialog';
import { EditSeatDialog } from '@/components/edit-seat-dialog';

interface Student {
  _id: string;
  name: string;
  email: string;
  phone: string;
  feeStatus: 'paid' | 'unpaid' | 'partial';
  paidForCurrentMonth?: boolean;
  isOverdue?: boolean;
  lastPaymentDate?: string | null;
  feeDueDate: string;
  isActive: boolean;
  subscriptionPlan: string;
  subscriptionExpiry: string;
  startTime?: string;
  endTime?: string;
  attendance?: any[];
}

interface Seat {
  _id: string;
  seatNumber: string;
  type: 'regular' | 'premium' | 'vip';
  price: number;
  isOccupied: boolean;
  isAvailable: boolean;
  currentStudents?: Student[];
  features: string[];
  floor: string;
  section: string;
  isAC: boolean;
  genderCategory?: 'any' | 'boys' | 'girls';
}

interface SubscriptionPlan {
  _id: string;
  name: string;
  planType?: string;
  salePrice?: number;
  regularPrice?: number;
}

function formatTime(timeStr?: string) {
  if (!timeStr) return '--:--';
  const [h, m] = timeStr.split(':');
  if (!h || !m) return timeStr;
  
  let hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  
  return `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
}

// Color palettes for different subscription plans
const SUBSCRIPTION_PALETTES = [
  { bg: 'bg-indigo-100 dark:bg-indigo-950/40', border: 'border-indigo-300 dark:border-indigo-800', text: 'text-indigo-900 dark:text-indigo-300', badge: 'bg-indigo-500 text-white', dot: 'bg-indigo-500' },
  { bg: 'bg-purple-100 dark:bg-purple-950/40', border: 'border-purple-300 dark:border-purple-800', text: 'text-purple-900 dark:text-purple-300', badge: 'bg-purple-500 text-white', dot: 'bg-purple-500' },
  { bg: 'bg-emerald-100 dark:bg-emerald-950/40', border: 'border-emerald-300 dark:border-emerald-800', text: 'text-emerald-900 dark:text-emerald-300', badge: 'bg-emerald-500 text-white', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-100 dark:bg-amber-950/40', border: 'border-amber-300 dark:border-amber-800', text: 'text-amber-900 dark:text-amber-300', badge: 'bg-amber-500 text-white', dot: 'bg-amber-500' },
  { bg: 'bg-cyan-100 dark:bg-cyan-950/40', border: 'border-cyan-300 dark:border-cyan-800', text: 'text-cyan-900 dark:text-cyan-300', badge: 'bg-cyan-500 text-white', dot: 'bg-cyan-500' },
  { bg: 'bg-rose-100 dark:bg-rose-950/40', border: 'border-rose-300 dark:border-rose-800', text: 'text-rose-900 dark:text-rose-300', badge: 'bg-rose-500 text-white', dot: 'bg-rose-500' },
  { bg: 'bg-teal-100 dark:bg-teal-950/40', border: 'border-teal-300 dark:border-teal-800', text: 'text-teal-900 dark:text-teal-300', badge: 'bg-teal-500 text-white', dot: 'bg-teal-500' },
  { bg: 'bg-blue-100 dark:bg-blue-950/40', border: 'border-blue-300 dark:border-blue-800', text: 'text-blue-900 dark:text-blue-300', badge: 'bg-blue-500 text-white', dot: 'bg-blue-500' },
];

export default function SeatsPage() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [subscriptionsList, setSubscriptionsList] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<string>('');
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [viewMode, setViewMode] = useState<'payment' | 'attendance' | 'subscription'>('payment');
  const [showOverduePanel, setShowOverduePanel] = useState<boolean>(true);

  useEffect(() => {
    fetchSeats();
    fetchSubscriptions();
  }, []);

  const fetchSeats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/seats');
      const data = await response.json();
      if (data.success) {
        setSeats(data.data);
        
        // Set initial active tab
        const floors = Array.from(new Set(data.data.map((s: Seat) => s.floor || 'Main')));
        if (floors.length > 0 && !activeTab) {
          setActiveTab(floors[0] as string);
        }
      }
    } catch (error) {
      console.error('Error fetching seats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions?limit=100');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setSubscriptionsList(data.data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this seat?')) return;

    try {
      const response = await fetch(`/api/seats/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setSeats(seats.filter(s => s._id !== id));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete seat');
      }
    } catch (error) {
      console.error('Error deleting seat:', error);
      alert('Failed to delete seat');
    }
  };

  const handleEmptySeat = async (id: string, seatNumber: string) => {
    if (!confirm(`Are you sure you want to empty seat ${seatNumber}? This will unassign all students currently assigned to it.`)) return;

    try {
      const response = await fetch(`/api/seats/${id}/empty`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchSeats();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to empty seat');
      }
    } catch (error) {
      console.error('Error emptying seat:', error);
      alert('Failed to empty seat');
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string, seatNumber: string) => {
    if (!confirm(`Are you sure you want to remove ${studentName} from seat ${seatNumber}?`)) return;

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatNumber: '' }),
      });
      if (response.ok) {
        fetchSeats();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove student');
      }
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Failed to remove student');
    }
  };

  const isPaymentPending = (student: any) => {
    if (typeof student.paidForCurrentMonth === 'boolean') {
      return !student.paidForCurrentMonth || student.feeStatus !== 'paid';
    }
    if (student.feeStatus !== 'paid') return true;

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    if (!student.feeDueDate) {
      return true;
    }

    const dueDate = new Date(student.feeDueDate);
    dueDate.setHours(0, 0, 0, 0);
    if (dueDate <= startOfCurrentMonth) return true;

    return false;
  };

  const isStudentOverdue = (student: any) => {
    if (typeof student.isOverdue === 'boolean') {
      return student.isOverdue;
    }
    if (!isPaymentPending(student)) return false;

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // Overdue if not paid by the 10th of the current month OR due from an earlier month
    if (now.getDate() > 10) return true;
    if (student.feeDueDate && new Date(student.feeDueDate) < startOfCurrentMonth) return true;

    return false;
  };

  // Extract all unique subscription plan names across DB and current active assignments
  const allSubscriptionNames = useMemo(() => {
    const set = new Set<string>();
    subscriptionsList.forEach(sub => {
      if (sub.name) set.add(sub.name);
    });
    seats.forEach(seat => {
      seat.currentStudents?.forEach(student => {
        if (student.subscriptionPlan) set.add(student.subscriptionPlan);
      });
    });
    return Array.from(set).sort();
  }, [subscriptionsList, seats]);

  // Color map for subscriptions
  const subscriptionColorMap = useMemo(() => {
    const map = new Map<string, typeof SUBSCRIPTION_PALETTES[0]>();
    allSubscriptionNames.forEach((planName, index) => {
      map.set(planName, SUBSCRIPTION_PALETTES[index % SUBSCRIPTION_PALETTES.length]);
    });
    return map;
  }, [allSubscriptionNames]);

  // Derived state
  const { floors, sections } = useMemo(() => {
    const f = Array.from(new Set(seats.map(s => s.floor || 'Main')));
    const s = Array.from(new Set(seats.map(s => s.section || 'General')));
    return { floors: f, sections: s };
  }, [seats]);

  const filteredSeats = useMemo(() => {
    return seats.filter(seat => {
      const students = seat.currentStudents || [];
      const matchesSearch = 
        seat.seatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (students.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesStatus = 
        statusFilter === 'all' ? true :
        statusFilter === 'paid' ? students.every(s => !isPaymentPending(s)) && students.length > 0 :
        statusFilter === 'unpaid' ? students.some(s => isPaymentPending(s)) :
        statusFilter === 'overdue' ? students.some(s => isStudentOverdue(s)) :
        statusFilter === 'available' ? (!seat.isOccupied && seat.isAvailable) :
        statusFilter === 'maintenance' ? !seat.isAvailable : true;

      const matchesSection = sectionFilter === 'all' || (seat.section || 'General') === sectionFilter;

      const matchesSubscription = 
        subscriptionFilter === 'all' ? true :
        subscriptionFilter === '__none__' ? (!seat.isOccupied || students.length === 0) :
        students.some(s => (s.subscriptionPlan || '').toLowerCase() === subscriptionFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesSection && matchesSubscription;
    }).sort((a, b) => 
      a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [seats, searchQuery, statusFilter, sectionFilter, subscriptionFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = seats.length;
    const available = seats.filter(s => s.isAvailable && !s.isOccupied).length;
    const occupied = seats.filter(s => s.isOccupied).length;
    
    // Flat map all assigned students
    const allStudents = seats.flatMap(s => s.currentStudents || []);
    
    const pendingPayments = allStudents.filter(s => isPaymentPending(s)).length;
    const overdueStudentsList: Array<{ student: Student; seatNumber: string; floor: string }> = [];
    seats.forEach(seat => {
      seat.currentStudents?.forEach(student => {
        if (isStudentOverdue(student)) {
          overdueStudentsList.push({
            student,
            seatNumber: seat.seatNumber,
            floor: seat.floor || 'Main',
          });
        }
      });
    });

    const activeMemberships = allStudents.filter(s => s.isActive).length;
    const expiredMemberships = allStudents.filter(s => new Date(s.subscriptionExpiry) < new Date()).length;
    
    // Subscription plan counts
    const planCounts: Record<string, number> = {};
    allStudents.forEach(st => {
      const plan = st.subscriptionPlan || 'Standard';
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });

    return {
      total,
      available,
      occupied,
      pendingPayments,
      overdueCount: overdueStudentsList.length,
      overdueStudentsList,
      activeMemberships,
      expiredMemberships,
      planCounts,
    };
  }, [seats]);

  const isStudentPresentToday = (student: Student) => {
    if (!student || !student.attendance || student.attendance.length === 0) return false;
    const todayStr = new Date().toDateString();
    return student.attendance.some((record: any) => {
      const dateVal = record.date || record.checkIn;
      return dateVal ? new Date(dateVal).toDateString() === todayStr : false;
    });
  };

  const getSeatColor = (seat: Seat) => {
    if (!seat.isAvailable) return 'bg-slate-200 border-slate-300 text-slate-400 dark:bg-slate-800 dark:border-slate-700'; // Maintenance
    
    if (seat.isOccupied && seat.currentStudents && seat.currentStudents.length > 0) {
      if (viewMode === 'subscription') {
        // Subscription Mode
        const firstStudentPlan = seat.currentStudents[0]?.subscriptionPlan;
        if (firstStudentPlan && subscriptionColorMap.has(firstStudentPlan)) {
          const palette = subscriptionColorMap.get(firstStudentPlan)!;
          return `${palette.bg} ${palette.border} ${palette.text}`;
        }
        return 'bg-indigo-100 border-indigo-300 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300';
      }

      if (viewMode === 'payment') {
        const hasOverdue = seat.currentStudents.some(s => isStudentOverdue(s));
        const hasUnpaid = seat.currentStudents.some(s => isPaymentPending(s));
        if (!hasUnpaid) {
          return 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300';
        } else if (hasOverdue) {
          return 'bg-rose-100 border-rose-400 text-rose-900 dark:bg-rose-950/50 dark:border-rose-700 dark:text-rose-200 ring-1 ring-rose-300 dark:ring-rose-800';
        } else {
          return 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300';
        }
      } else {
        // Attendance Mode
        const hasAttendedToday = seat.currentStudents.some(student => isStudentPresentToday(student));
        
        if (hasAttendedToday) {
          return 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300';
        } else {
          return 'bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-300';
        }
      }
    }
    
    return 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/40 cursor-pointer transition-colors';
  };

  const getSeatStatusText = (seat: Seat) => {
    if (!seat.isAvailable) return 'Maintenance';
    if (seat.isOccupied && seat.currentStudents && seat.currentStudents.length > 0) {
      if (viewMode === 'subscription') {
        return seat.currentStudents.map(s => s.subscriptionPlan || 'Standard').join(', ');
      }
      if (viewMode === 'payment') {
        const hasOverdue = seat.currentStudents.some(s => isStudentOverdue(s));
        const hasUnpaid = seat.currentStudents.some(s => isPaymentPending(s));
        if (!hasUnpaid) return 'Paid';
        return hasOverdue ? 'Overdue (>10th)' : 'Unpaid (Due 10th)';
      } else {
        const hasAttendedToday = seat.currentStudents.some(student => isStudentPresentToday(student));
        return hasAttendedToday ? 'Present Today' : 'Absent Today';
      }
    }
    return 'Available';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seats Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manage library seating layout, assignments, subscriptions & payments</p>
        </div>
        <AddSeatDialog onSeatAdded={fetchSeats} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Seats</CardTitle>
            <Armchair className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Available</CardTitle>
            <div className="h-3 w-3 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Occupied</CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.occupied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Subscribed Plans</CardTitle>
            <Layers className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{allSubscriptionNames.length}</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:border-rose-300 transition-colors"
          onClick={() => {
            setViewMode('payment');
            setStatusFilter(stats.overdueCount > 0 ? 'overdue' : 'unpaid');
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending / Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-rose-500">{stats.pendingPayments}</div>
              {stats.overdueCount > 0 && (
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  {stats.overdueCount} Overdue
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Members</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.activeMemberships}</div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Students Alert Panel (Students who haven't paid till 10th of the month) */}
      {stats.overdueCount > 0 && (
        <Card className="border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                      Overdue Students (Not Paid Till 10th)
                    </h3>
                    <Badge className="bg-rose-600 text-white text-[10px]">
                      {stats.overdueCount} {stats.overdueCount === 1 ? 'Student' : 'Students'}
                    </Badge>
                  </div>
                  <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                    Monthly fees reset to unpaid on the 1st of every month. Students unpaid after the 10th are marked overdue.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={statusFilter === 'overdue' ? 'default' : 'outline'}
                  onClick={() => {
                    setViewMode('payment');
                    setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue');
                  }}
                  className={
                    statusFilter === 'overdue'
                      ? 'h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white'
                      : 'h-8 text-xs border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300'
                  }
                >
                  {statusFilter === 'overdue' ? 'Show All Seats' : 'Filter Overdue Seats'}
                </Button>
                <Link href="/dashboard/payments">
                  <Button size="sm" className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900">
                    Collect Fee <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowOverduePanel(!showOverduePanel)}
                  className="h-8 px-2 text-rose-700 dark:text-rose-300"
                >
                  {showOverduePanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {showOverduePanel && (
              <div className="mt-3 pt-3 border-t border-rose-200/70 dark:border-rose-900/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {stats.overdueStudentsList.map(({ student, seatNumber, floor }) => (
                  <div
                    key={student._id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-2xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          {seatNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {student.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                        <span className="flex items-center gap-0.5">
                          <Phone className="h-2.5 w-2.5" /> {student.phone || 'N/A'}
                        </span>
                        <span>• {floor}</span>
                      </div>
                    </div>
                    <Link href="/dashboard/payments">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] font-bold border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400">
                        Pay
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters, View Mode & Subscription Filter */}
      <Card className="overflow-visible shadow-sm">
        <CardContent className="p-4 flex flex-col gap-4 overflow-visible">
          {/* Top Row: Search & View Mode Switcher */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by seat number, student name..."
                className="pl-9 text-xs sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <Button
                variant={viewMode === 'payment' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('payment')}
                className="text-xs h-8 px-3 gap-1.5"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Payment View
              </Button>
              <Button
                variant={viewMode === 'attendance' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('attendance')}
                className="text-xs h-8 px-3 gap-1.5"
              >
                <CalendarCheck className="h-3.5 w-3.5" />
                Attendance View
              </Button>
              <Button
                variant={viewMode === 'subscription' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('subscription')}
                className="text-xs h-8 px-3 gap-1.5 font-semibold text-indigo-700 dark:text-indigo-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
              >
                <Layers className="h-3.5 w-3.5" />
                Subscription View
              </Button>
            </div>
          </div>

          {/* Bottom Row: Granular Filters */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase">
              <Filter className="h-3.5 w-3.5" /> Filters:
            </div>

            {/* Filter by Subscription Plan */}
            <div className="w-[210px]">
              <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                <SelectTrigger className="h-8 text-xs font-medium border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-300">
                  <SelectValue placeholder="All Subscriptions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subscriptions</SelectItem>
                  <SelectItem value="__none__">Available (No Subscription)</SelectItem>
                  {allSubscriptionNames.map(plan => {
                    const count = stats.planCounts[plan] || 0;
                    return (
                      <SelectItem key={plan} value={plan}>
                        {plan} {count > 0 ? `(${count})` : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Payment / Availability Status */}
            <div className="w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid / Pending</SelectItem>
                  <SelectItem value="overdue">Overdue (After 10th)</SelectItem>
                  <SelectItem value="available">Available (Empty)</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Section */}
            <div className="w-[150px]">
              <Select value={sectionFilter} onValueChange={setSectionFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(subscriptionFilter !== 'all' || statusFilter !== 'all' || sectionFilter !== 'all' || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSubscriptionFilter('all');
                  setStatusFilter('all');
                  setSectionFilter('all');
                  setSearchQuery('');
                }}
                className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Theatre Seating Map */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Armchair className="h-5 w-5 text-indigo-600" />
              Seat Map (Theatre View)
              <Badge variant="outline" className="text-xs font-normal ml-2">
                {filteredSeats.length} of {seats.length} seats shown
              </Badge>
            </CardTitle>

            {viewMode === 'subscription' && (
              <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 text-xs">
                Color-coded by Subscription Plan
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-16 text-slate-500">Loading seat map...</div>
          ) : seats.length === 0 ? (
            <div className="text-center py-16 text-slate-500">No seats found. Add some seats to see the layout.</div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                {floors.map(floor => (
                  <TabsTrigger key={floor} value={floor} className="min-w-[100px] text-xs font-semibold">
                    {floor}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {floors.map(floor => (
                <TabsContent key={floor} value={floor} className="mt-4">
                  {/* Seating Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3.5 p-4 bg-slate-50/70 dark:bg-slate-900/50 rounded-xl border">
                    <TooltipProvider>
                      {filteredSeats.filter(s => (s.floor || 'Main') === floor).map(seat => {
                        const firstStudent = seat.currentStudents?.[0];
                        return (
                          <div key={seat._id} className="relative group flex flex-col items-center">
                            <Tooltip>
                              <TooltipTrigger>
                                <div className={`w-full min-h-[96px] rounded-xl border-2 shadow-sm flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer hover:scale-[1.03] ${getSeatColor(seat)}`}>
                                  <div className="text-base font-black tracking-tight">{seat.seatNumber}</div>
                                  
                                  {seat.isOccupied && seat.currentStudents && seat.currentStudents.length > 0 ? (
                                    <>
                                      <div className="text-[11px] font-semibold mt-0.5 truncate max-w-[90%]">
                                        {firstStudent?.name}
                                      </div>
                                      {viewMode === 'subscription' && firstStudent?.subscriptionPlan ? (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 mt-1 rounded bg-black/10 dark:bg-white/10 truncate max-w-[95%]">
                                          {firstStudent.subscriptionPlan}
                                        </span>
                                      ) : (
                                        <div className="text-[10px] opacity-75 font-medium">
                                          {seat.currentStudents.length > 1 ? `+${seat.currentStudents.length - 1} shift` : (firstStudent?.subscriptionPlan || 'Occupied')}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="text-[11px] font-medium opacity-70 mt-1">
                                      {seat.isAvailable ? 'Empty' : 'Maintenance'}
                                    </div>
                                  )}
                                  
                                  <div className="absolute top-1 left-1 flex gap-1">
                                    {viewMode === 'payment' && seat.isOccupied && seat.currentStudents?.some(s => isStudentOverdue(s)) && (
                                      <div className="text-[7px] font-black bg-rose-600 text-white px-1 py-0.5 rounded shadow-sm tracking-wide">
                                        OVERDUE
                                      </div>
                                    )}
                                  </div>

                                  <div className="absolute top-1 right-1 flex gap-1">
                                    {seat.isAC && <div className="text-[7px] font-bold bg-white/70 dark:bg-black/50 px-1 rounded shadow-sm">AC</div>}
                                    {seat.genderCategory === 'boys' && <div className="text-[7px] font-bold bg-blue-200 text-blue-800 px-1 rounded shadow-sm">B</div>}
                                    {seat.genderCategory === 'girls' && <div className="text-[7px] font-bold bg-pink-200 text-pink-800 px-1 rounded shadow-sm">G</div>}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="w-72 p-3.5 bg-slate-900 text-white border-slate-800 shadow-2xl rounded-xl z-50">
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                                      <Armchair className="h-4 w-4 text-indigo-400" />
                                      Seat {seat.seatNumber}
                                    </div>
                                    <Badge variant={seat.isAvailable ? "outline" : "secondary"} className="border-slate-700 text-[10px] text-slate-300">
                                      {getSeatStatusText(seat)}
                                    </Badge>
                                  </div>

                                  {seat.currentStudents && seat.currentStudents.length > 0 ? (
                                    <div className="text-xs space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                                      {seat.currentStudents.map((student, idx) => (
                                        <div key={student._id} className={idx > 0 ? "pt-2.5 border-t border-slate-800" : ""}>
                                          <p className="font-bold flex items-center justify-between text-slate-100 text-xs">
                                            <span>{student.name}</span>
                                            <Badge variant="outline" className="text-[9px] border-indigo-500/50 bg-indigo-950/60 text-indigo-300">
                                              {student.subscriptionPlan || 'Standard'}
                                            </Badge>
                                          </p>
                                          <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
                                            <div>
                                              <span className="text-slate-400 text-[10px] uppercase font-semibold">Shift</span>
                                              <p className="font-medium text-slate-200">
                                                {student.startTime ? `${formatTime(student.startTime)} - ${formatTime(student.endTime)}` : 'Full Day'}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="text-slate-400 text-[10px] uppercase font-semibold">Payment</span>
                                              <p className={
                                                !isPaymentPending(student)
                                                  ? 'text-emerald-400 font-bold'
                                                  : isStudentOverdue(student)
                                                  ? 'text-rose-400 font-bold'
                                                  : 'text-amber-400 font-bold'
                                              }>
                                                {!isPaymentPending(student)
                                                  ? 'PAID'
                                                  : isStudentOverdue(student)
                                                  ? 'OVERDUE (>10th)'
                                                  : student.feeStatus === 'partial'
                                                  ? 'PARTIAL'
                                                  : 'UNPAID (Due 10th)'}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="text-slate-400 text-[10px] uppercase font-semibold">Attendance</span>
                                              <p className={isStudentPresentToday(student) ? 'text-emerald-400 font-bold' : 'text-slate-400 font-medium'}>
                                                {isStudentPresentToday(student) ? '✓ PRESENT' : 'ABSENT'}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="text-slate-400 text-[10px] uppercase font-semibold">Expires</span>
                                              <p className="text-slate-300 font-medium">{formatDate(student.subscriptionExpiry)}</p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-xs space-y-1 text-slate-300">
                                      <p><span className="text-slate-400">Type:</span> {seat.type}</p>
                                      <p><span className="text-slate-400">Section:</span> {seat.section}</p>
                                      {seat.genderCategory && seat.genderCategory !== 'any' && (
                                        <p><span className="text-slate-400">Category:</span> <span className="capitalize font-medium text-slate-100">{seat.genderCategory}</span></p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>

                            {/* Quick Actions Dropdown */}
                            <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <DropdownMenu>
                                <DropdownMenuTrigger>
                                  <Button variant="secondary" size="icon" className="h-6 w-6 rounded-full shadow-md bg-white text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuGroup>
                                    <DropdownMenuLabel>Seat {seat.seatNumber}</DropdownMenuLabel>
                                  </DropdownMenuGroup>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setEditingSeat(seat)}
                                    className="cursor-pointer font-medium text-slate-700 dark:text-slate-200"
                                  >
                                    <Edit className="h-4 w-4 mr-2 text-indigo-600" />
                                    Edit Seat
                                  </DropdownMenuItem>
                                  {seat.isOccupied && seat.currentStudents && (
                                    <>
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="text-orange-600 focus:text-orange-600 focus:bg-orange-50 dark:focus:bg-orange-950/50">
                                          Empty Seat...
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                          {seat.currentStudents.map(student => (
                                            <DropdownMenuItem key={student._id} onClick={() => handleRemoveStudent(student._id, student.name, seat.seatNumber)}>
                                              Remove {student.name}
                                            </DropdownMenuItem>
                                          ))}
                                          {seat.currentStudents.length > 1 && (
                                            <>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleEmptySeat(seat._id, seat.seatNumber)}>
                                                Empty Entire Seat (All)
                                              </DropdownMenuItem>
                                            </>
                                          )}
                                        </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                    </>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDelete(seat._id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Seat
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })}
                    </TooltipProvider>
                    
                    {filteredSeats.filter(s => (s.floor || 'Main') === floor).length === 0 && (
                      <div className="col-span-full text-center py-12 text-slate-500 text-xs">
                        No seats match your search or filters in this floor section.
                      </div>
                    )}
                  </div>
                  
                  {/* Dynamic Interactive Legend */}
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border flex flex-wrap items-center justify-center gap-4 text-xs">
                    {viewMode === 'subscription' ? (
                      <>
                        <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Plans:</span>
                        {allSubscriptionNames.map(plan => {
                          const palette = subscriptionColorMap.get(plan);
                          const count = stats.planCounts[plan] || 0;
                          return (
                            <div key={plan} className="flex items-center gap-1.5 font-medium">
                              <span className={`w-3 h-3 rounded-full ${palette?.dot || 'bg-indigo-500'}`}></span>
                              <span>{plan}</span>
                              <span className="text-[10px] text-slate-400">({count})</span>
                            </div>
                          );
                        })}
                        <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></span>
                          <span>Available</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium text-slate-400">
                          <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300"></span>
                          <span>Maintenance</span>
                        </div>
                      </>
                    ) : viewMode === 'payment' ? (
                      <>
                        <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300"></div> Occupied (Paid)</div>
                        <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-300"></div> Unpaid (Due 1st–10th)</div>
                        <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-rose-100 border border-rose-400"></div> Overdue (Not Paid Till 10th)</div>
                        <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-blue-50 border border-blue-200"></div> Available (Empty)</div>
                        <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300"></div> Maintenance</div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300"></div> Present Today</div>
                        <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-rose-100 border border-rose-300"></div> Absent Today</div>
                        <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-blue-50 border border-blue-200"></div> Available (Empty)</div>
                        <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300"></div> Maintenance</div>
                      </>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Edit Seat Dialog */}
      {editingSeat && (
        <EditSeatDialog
          seat={editingSeat}
          open={!!editingSeat}
          onOpenChange={(val) => {
            if (!val) setEditingSeat(null);
          }}
          onSeatUpdated={() => {
            setEditingSeat(null);
            fetchSeats();
          }}
        />
      )}
    </div>
  );
}