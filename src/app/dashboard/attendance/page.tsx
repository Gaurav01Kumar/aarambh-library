'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, LogOut, CheckIcon, Server, Monitor, RefreshCw, Wifi } from 'lucide-react';

interface AttendanceRecord {
  _id: string;
  student: {
    name: string;
    email?: string;
    seatNumber?: string;
    feeStatus?: string;
  } | null;
  date: string;
  checkIn: string;
  checkOut?: string;
  duration?: number;
  seatNumber?: string;
  checkInMethod: 'qr' | 'manual' | 'biometric';
  checkOutMethod?: 'qr' | 'manual' | 'biometric';
  deviceId?: string;
  ipAddress?: string;
  status?: string;
  createdAt?: string;
  notes?: string;
}

interface ServerTime {
  iso: string;
  timestamp: number;
  ist: string;
  istDate: string;
  istTime: string;
  timezone: string;
  utcOffset: string;
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  // Server time state
  const [serverTime, setServerTime] = useState<ServerTime | null>(null);
  const [localTime, setLocalTime] = useState<string>('');
  const [timeDrift, setTimeDrift] = useState<number | null>(null);
  const [serverTimeLoading, setServerTimeLoading] = useState(true);

  // Live clock tick
  const [liveClock, setLiveClock] = useState<string>('');

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  // Fetch server time on mount and every 30 seconds
  useEffect(() => {
    fetchServerTime();
    const interval = setInterval(fetchServerTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Tick the live clocks every second
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLiveClock(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setLocalTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchServerTime = async () => {
    try {
      setServerTimeLoading(true);
      const beforeFetch = Date.now();
      const res = await fetch('/api/server-time');
      const data = await res.json();
      const afterFetch = Date.now();

      if (data.success) {
        setServerTime(data.server);
        // Calculate drift: difference between server timestamp and local time (accounting for network latency)
        const networkLatency = (afterFetch - beforeFetch) / 2;
        const adjustedServerTime = data.server.timestamp + networkLatency;
        const drift = afterFetch - adjustedServerTime;
        setTimeDrift(drift);
      }
    } catch (err) {
      console.error('Error fetching server time:', err);
    } finally {
      setServerTimeLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const url = selectedDate
        ? `/api/attendance?date=${selectedDate}`
        : `/api/attendance`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setAttendance(data.data);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTimeIST = (isoDate?: string) => {
    if (!isoDate) return '-';
    try {
      return new Date(isoDate).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return '-';
    }
  };

  const formatDateIST = (isoDate?: string) => {
    if (!isoDate) return '-';
    try {
      return new Date(isoDate).toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  // Show time difference between record's createdAt (server time) and checkIn (device reported time)
  const getTimeDiffLabel = (checkIn: string, createdAt?: string) => {
    if (!createdAt) return null;
    const checkInMs = new Date(checkIn).getTime();
    const createdMs = new Date(createdAt).getTime();
    const diffMs = Math.abs(createdMs - checkInMs);
    const diffSecs = Math.round(diffMs / 1000);

    if (diffSecs < 5) return null; // negligible
    if (diffSecs < 60) return `${diffSecs}s`;
    const diffMins = Math.round(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m`;
    const diffHrs = Math.floor(diffMins / 60);
    const remMins = diffMins % 60;
    return `${diffHrs}h ${remMins}m`;
  };

  const totalPresent = attendance.filter(a => a.status !== 'failed').length;
  const totalActive = attendance.filter(a => !a.checkOut && a.status !== 'failed').length;
  const totalDuration = attendance.reduce((sum, a) => sum + (a.duration || 0), 0);

  const driftAbs = timeDrift !== null ? Math.abs(Math.round(timeDrift / 1000)) : null;
  const driftDirection = timeDrift !== null ? (timeDrift > 0 ? 'ahead' : 'behind') : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-slate-600 dark:text-slate-400">Track student check-in and check-out with server time</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Button
            variant={selectedDate === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDate('')}
          >
            All
          </Button>
          <Button
            variant={selectedDate === new Date().toISOString().split('T')[0] ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          >
            Today
          </Button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-sm"
          />
          <Button variant="outline" size="icon" onClick={() => { fetchAttendance(); fetchServerTime(); }} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Server Time & Device Time Comparison Card */}
      <Card className="border-indigo-200 dark:border-indigo-800/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Server &amp; Device Time Monitor
          </CardTitle>
          <CardDescription>
            Live comparison between server time and your device time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Server Time */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Server className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Server Time (IST)</span>
              </div>
              <div className="text-2xl font-mono font-bold text-indigo-700 dark:text-indigo-300">
                {serverTime ? serverTime.istTime : '--:--:--'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {serverTime ? serverTime.istDate : '--'} · {serverTime?.timezone || 'Asia/Kolkata'}
              </div>
            </div>

            {/* Your Device Time */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Device Time</span>
              </div>
              <div className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {liveClock || '--:--:--'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · Local
              </div>
            </div>

            {/* Drift / Sync Status */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sync Status</span>
              </div>
              {driftAbs !== null ? (
                <>
                  <div className={`text-2xl font-mono font-bold ${driftAbs < 3 ? 'text-emerald-600 dark:text-emerald-400' : driftAbs < 30 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {driftAbs < 3 ? '✓ In Sync' : `${driftAbs}s ${driftDirection}`}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {driftAbs < 3 ? 'Server & device clocks are synchronized' : driftAbs < 30 ? 'Minor drift detected — acceptable' : '⚠ Large drift — device clock may be wrong'}
                  </div>
                </>
              ) : (
                <div className="text-lg font-mono text-slate-400">Checking...</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Present</CardTitle>
            <User className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPresent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Active</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{totalActive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
            <Calendar className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalDuration)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPresent > 0 ? formatDuration(Math.round(totalDuration / totalPresent)) : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records — {selectedDate ? formatDateIST(selectedDate + 'T00:00:00') : 'All Dates'}</CardTitle>
          <CardDescription>
            Server Time = time recorded by the server • Device Mark Time = when check-in/out was received
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading attendance...</div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No attendance records for this date</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Seat</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Server className="h-3 w-3 text-indigo-500" />
                        Server Check-In
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Monitor className="h-3 w-3 text-emerald-500" />
                        Device Mark Time
                      </div>
                    </TableHead>
                    <TableHead>Check-Out</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Device / IP</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record) => {
                    const timeDiff = getTimeDiffLabel(record.checkIn, record.createdAt);
                    const isFailed = record.status === 'failed';

                    return (
                      <TableRow key={record._id} className={isFailed ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">
                          {record.student?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {record.seatNumber || '-'}
                          </Badge>
                        </TableCell>
                        {/* Server recorded time (createdAt) */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Server className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span className="font-mono text-xs">
                              {formatTimeIST(record.createdAt || record.checkIn)}
                            </span>
                          </div>
                        </TableCell>
                        {/* Device/client reported check-in time */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Monitor className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span className="font-mono text-xs">
                              {formatTimeIST(record.checkIn)}
                            </span>
                          </div>
                          {timeDiff && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium ml-5">
                              Δ {timeDiff} drift
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.checkOut ? (
                            <div className="flex items-center gap-1.5">
                              <LogOut className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                              <span className="font-mono text-xs">
                                {formatTimeIST(record.checkOut)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">{formatDuration(record.duration)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {record.deviceId && (
                              <div className="text-[10px] font-mono text-slate-500 truncate max-w-[100px]" title={record.deviceId}>
                                {record.deviceId}
                              </div>
                            )}
                            {record.ipAddress && (
                              <div className="text-[10px] font-mono text-slate-400" title={record.ipAddress}>
                                {record.ipAddress}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isFailed ? (
                            <Badge variant="destructive" className="text-[10px]">Failed</Badge>
                          ) : record.checkOut ? (
                            <Badge variant="secondary" className="text-[10px]">Completed</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-[10px]">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}