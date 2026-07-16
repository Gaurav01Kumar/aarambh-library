'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MoreVertical, 
  Trash2, 
  Armchair, 
  Users, 
  UserCheck, 
  AlertCircle, 
  Search,
  Filter
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

export default function SeatsPage() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<string>('');
  const [viewMode, setViewMode] = useState<'payment' | 'attendance'>('payment');

  useEffect(() => {
    fetchSeats();
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
    if (student.feeStatus !== 'paid') return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If NO date is set, we strictly consider them unpaid for the current month
    if (!student.feeDueDate && !student.subscriptionExpiry) {
      return true;
    }

    if (student.feeDueDate) {
      const dueDate = new Date(student.feeDueDate);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate < today) return true;
    }
    
    if (student.subscriptionExpiry) {
      const expiry = new Date(student.subscriptionExpiry);
      expiry.setHours(0, 0, 0, 0);
      if (expiry < today) return true;
    }
    
    return false;
  };

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
        statusFilter === 'available' ? (!seat.isOccupied && seat.isAvailable) :
        statusFilter === 'maintenance' ? !seat.isAvailable : true;

      const matchesSection = sectionFilter === 'all' || (seat.section || 'General') === sectionFilter;

      return matchesSearch && matchesStatus && matchesSection;
    });
  }, [seats, searchQuery, statusFilter, sectionFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = seats.length;
    const available = seats.filter(s => s.isAvailable && !s.isOccupied).length;
    const occupied = seats.filter(s => s.isOccupied).length;
    
    // Flat map all assigned students
    const allStudents = seats.flatMap(s => s.currentStudents || []);
    
    const pendingPayments = allStudents.filter(s => isPaymentPending(s)).length;
    const activeMemberships = allStudents.filter(s => s.isActive).length;
    const expiredMemberships = allStudents.filter(s => new Date(s.subscriptionExpiry) < new Date()).length;
    
    return { total, available, occupied, pendingPayments, activeMemberships, expiredMemberships };
  }, [seats]);

  const getSeatColor = (seat: Seat) => {
    if (!seat.isAvailable) return 'bg-slate-200 border-slate-300 text-slate-400 dark:bg-slate-800 dark:border-slate-700'; // Maintenance
    
    if (seat.isOccupied && seat.currentStudents && seat.currentStudents.length > 0) {
      if (viewMode === 'payment') {
        const hasUnpaid = seat.currentStudents.some(s => isPaymentPending(s));
        if (!hasUnpaid) {
          return 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300';
        } else {
          return 'bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-300';
        }
      } else {
        // Attendance Mode
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const hasAttendedToday = seat.currentStudents.some(student => 
          student.attendance?.some((record: any) => {
            const recordDate = new Date(record.date);
            recordDate.setHours(0, 0, 0, 0);
            return recordDate.getTime() === today.getTime();
          })
        );
        
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
      if (viewMode === 'payment') {
        const hasUnpaid = seat.currentStudents.some(s => s.feeStatus !== 'paid');
        return !hasUnpaid ? 'Paid' : 'Unpaid/Partial';
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const hasAttendedToday = seat.currentStudents.some(student => 
          student.attendance?.some((record: any) => {
            const recordDate = new Date(record.date);
            recordDate.setHours(0, 0, 0, 0);
            return recordDate.getTime() === today.getTime();
          })
        );
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
          <h1 className="text-3xl font-bold">Seats Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage library seating layout, assignments, and payments</p>
        </div>
        <AddSeatDialog onSeatAdded={fetchSeats} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Seats</CardTitle>
            <Armchair className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-100 border border-blue-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.occupied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">{stats.pendingPayments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.activeMemberships}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Memberships</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.expiredMemberships}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by seat number or student name..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
              <Button
                variant={viewMode === 'payment' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('payment')}
                className="text-xs h-8"
              >
                Payment View
              </Button>
              <Button
                variant={viewMode === 'attendance' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('attendance')}
                className="text-xs h-8"
              >
                Attendance View
              </Button>
            </div>
            <Filter className="h-4 w-4 text-slate-500 ml-2" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid / Partial</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Theatre Seating Map */}
      <Card>
        <CardHeader>
          <CardTitle>Seat Map (Theatre View)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading seat map...</div>
          ) : seats.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No seats found. Add some seats to see the layout.</div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                {floors.map(floor => (
                  <TabsTrigger key={floor} value={floor} className="min-w-[100px]">
                    {floor}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {floors.map(floor => (
                <TabsContent key={floor} value={floor} className="mt-6">
                  {/* Seating Grid (grouped by section within the floor if needed, but for now just grid) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                    <TooltipProvider delayDuration={300}>
                      {filteredSeats.filter(s => (s.floor || 'Main') === floor).map(seat => (
                        <div key={seat._id} className="relative group flex flex-col items-center">
                          <Tooltip>
                            <TooltipTrigger>
                              <div className={`w-24 h-24 rounded-lg border-2 shadow-sm flex flex-col items-center justify-center p-2 text-center transition-all ${getSeatColor(seat)}`}>
                                <div className="text-lg font-bold mb-1">{seat.seatNumber}</div>
                                {seat.isOccupied && seat.currentStudents && seat.currentStudents.length > 0 ? (
                                  <>
                                    <div className="text-xs font-bold mt-1">
                                      {seat.currentStudents.length} {seat.currentStudents.length === 1 ? 'Student' : 'Students'}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-xs opacity-70">
                                    {seat.isAvailable ? 'Empty' : 'N/A'}
                                  </div>
                                )}
                                <div className="absolute top-1 right-1 flex gap-1">
                                  {seat.isAC && <div className="text-[8px] bg-white/50 px-1 rounded-sm shadow-sm">AC</div>}
                                  {seat.genderCategory === 'boys' && <div className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded-sm shadow-sm">Boys</div>}
                                  {seat.genderCategory === 'girls' && <div className="text-[8px] bg-pink-100 text-pink-700 px-1 rounded-sm shadow-sm">Girls</div>}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="w-64 p-3 bg-black text-white border-slate-800 shadow-xl">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                  <span className="font-bold text-slate-100">Seat {seat.seatNumber}</span>
                                  <Badge variant={seat.isAvailable ? "outline" : "secondary"} className="border-slate-700 text-slate-300">
                                    {getSeatStatusText(seat)}
                                  </Badge>
                                </div>
                                {seat.currentStudents && seat.currentStudents.length > 0 ? (
                                  <div className="text-sm space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                    {seat.currentStudents.map((student, idx) => (
                                      <div key={student._id} className={idx > 0 ? "pt-3 border-t border-slate-800" : ""}>
                                        <p className="font-bold flex items-center justify-between text-slate-100">
                                          <span>{student.name}</span>
                                          <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">{student.subscriptionPlan}</Badge>
                                        </p>
                                        <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                                          <p>
                                            <span className="text-slate-400">Fee Status:</span><br/>
                                            <span className={!isPaymentPending(student) ? 'text-emerald-400 font-medium' : 'text-rose-500 font-medium'}>
                                              {isPaymentPending(student) ? (student.feeStatus !== 'paid' ? student.feeStatus.toUpperCase() : 'OVERDUE') : 'PAID'}
                                            </span>
                                          </p>
                                          <p>
                                            <span className="text-slate-400">Shift:</span><br/>
                                            <span className="font-medium whitespace-nowrap text-slate-200">
                                              {student.startTime ? formatTime(student.startTime).replace(' ', '') : 'N/A'} - {student.endTime ? formatTime(student.endTime).replace(' ', '') : 'N/A'}
                                            </span>
                                          </p>
                                          <p>
                                            <span className="text-slate-400">Fee Due:</span><br/>
                                            <span className="font-medium text-slate-200">{formatDate(student.feeDueDate)}</span>
                                          </p>
                                          <p>
                                            <span className="text-slate-400">Expiry:</span><br/>
                                            <span className="font-medium text-slate-200">{formatDate(student.subscriptionExpiry)}</span>
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm">
                                    <p className="text-slate-300">Type: {seat.type}</p>
                                    <p className="text-slate-300">Price: ${seat.price || 0}</p>
                                    <p className="text-slate-300">Section: {seat.section}</p>
                                    {seat.genderCategory && seat.genderCategory !== 'any' && (
                                      <p className="text-slate-300">Category: <span className="capitalize font-medium text-slate-100">{seat.genderCategory}</span></p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>

                          {/* Quick Actions Dropdown (appears on hover or click) */}
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                <EditSeatDialog seat={seat} onSeatUpdated={fetchSeats} />
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
                      ))}
                    </TooltipProvider>
                    
                    {filteredSeats.filter(s => (s.floor || 'Main') === floor).length === 0 && (
                      <div className="col-span-full text-center py-8 text-slate-500">
                        No seats match your filters in this section.
                      </div>
                    )}
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-4 text-sm justify-center p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    {viewMode === 'payment' ? (
                      <>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300"></div> Occupied (Paid)</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-rose-100 border border-rose-300"></div> Occupied (Unpaid/Partial)</div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300"></div> Present Today</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-rose-100 border border-rose-300"></div> Absent Today</div>
                      </>
                    )}
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-50 border border-blue-200"></div> Available</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-slate-200 border border-slate-300"></div> Maintenance</div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}