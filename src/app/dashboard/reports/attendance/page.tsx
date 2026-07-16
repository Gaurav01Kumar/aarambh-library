'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Printer, Search, MapPin, Map, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AttendanceRecord {
  _id: string;
  student: {
    _id: string;
    name: string;
    seatNumber: string;
  };
  seatNumber: string;
  date: string;
  checkIn: string;
  deviceId: string;
  ipAddress: string;
  latitude: number;
  longitude: number;
  status: 'success' | 'failed';
  failureReason: string;
  createdAt: string;
}

export default function AttendanceReportsPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('daily');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRecords();
  }, [filter]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/attendance/reports?filter=${filter}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch records', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    
    const headers = ['Date', 'Time', 'Student', 'Seat', 'Status', 'Reason', 'IP Address', 'GPS Lat', 'GPS Lng'];
    const csvContent = [
      headers.join(','),
      ...records.map(r => [
        new Date(r.createdAt).toLocaleDateString(),
        new Date(r.createdAt).toLocaleTimeString(),
        `"${r.student?.name || 'Unknown'}"`,
        r.seatNumber || r.student?.seatNumber,
        r.status,
        `"${r.failureReason || ''}"`,
        r.ipAddress,
        r.latitude || '',
        r.longitude || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${filter}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/attendance/reports/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setRecords(records.filter(r => r._id !== id));
      } else {
        alert(data.error || 'Failed to delete record');
      }
    } catch (err) {
      console.error('Failed to delete', err);
      alert('Network error while deleting.');
    }
  };

  const filteredRecords = records.filter(r => 
    r.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.seatNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Attendance Reports</h1>
          <p className="text-slate-600 dark:text-slate-400">View and export detailed security and attendance logs.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by student or seat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Today (Daily)</SelectItem>
                <SelectItem value="monthly">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance & Security Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Seat</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Device/IP</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Loading logs...</TableCell></TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">No records found for this period.</TableCell></TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record._id} className={record.status === 'failed' ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm font-medium">{new Date(record.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-500">{new Date(record.createdAt).toLocaleTimeString()}</div>
                      </TableCell>
                      <TableCell className="font-medium">{record.student?.name || 'Unknown'}</TableCell>
                      <TableCell>{record.seatNumber}</TableCell>
                      <TableCell>
                        {record.status === 'success' ? (
                          <span className="flex items-center text-green-600 text-sm">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Success
                          </span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="flex items-center text-red-600 text-sm font-medium">
                              <XCircle className="h-4 w-4 mr-1" />
                              Failed
                            </span>
                            <span className="text-xs text-red-500 max-w-[200px] truncate" title={record.failureReason}>
                              {record.failureReason}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono truncate w-24" title={record.deviceId}>{record.deviceId ? record.deviceId.split('-')[0] + '...' : 'N/A'}</div>
                        <div className="text-xs text-slate-500">{record.ipAddress || 'Unknown IP'}</div>
                      </TableCell>
                      <TableCell>
                        {record.latitude && record.longitude ? (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${record.latitude},${record.longitude}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center text-blue-600 hover:underline text-xs"
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            View Map
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">No GPS</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(record._id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
