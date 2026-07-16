'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Filter, MoreVertical, Edit, Trash2, QrCode, SmartphoneNfc } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddStudentDialog } from '@/components/add-student-dialog';
import { EditStudentDialog } from '@/components/edit-student-dialog';
import { QRCodeDisplay } from '@/components/qr-code-display';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Student {
  _id: string;
  name: string;
  email: string;
  phone: string;
  seatNumber?: string;
  feeStatus: 'paid' | 'unpaid' | 'partial';
  feeAmount: number;
  feeDueDate?: string;
  isActive: boolean;
  joinDate: string;
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

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [searchTerm, filterStatus]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('feeStatus', filterStatus);

      const response = await fetch(`/api/students?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setStudents(students.filter(s => s._id !== id));
      }
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleResetDevice = async (id: string) => {
    if (!confirm('Are you sure you want to reset the registered device for this student? They will need to re-register their new device.')) return;

    try {
      const response = await fetch(`/api/students/${id}/reset-device`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        alert('Device reset successfully');
      } else {
        alert(data.error || 'Failed to reset device');
      }
    } catch (error) {
      console.error('Error resetting device:', error);
      alert('Network error while resetting device');
    }
  };

  const handleViewQRCode = (student: Student) => {
    setSelectedStudent(student);
    setShowQRCode(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'unpaid':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your library students</p>
        </div>
        <div>
          <AddStudentDialog onStudentAdded={fetchStudents} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {students.filter(s => s.feeStatus === 'paid').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {students.filter(s => s.feeStatus === 'unpaid').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filterStatus}
              onValueChange={setFilterStatus}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No students found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Seat</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Fee Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.phone}</TableCell>
                    <TableCell>{student.seatNumber || '-'}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-slate-500">
                      {student.startTime ? `${formatTime(student.startTime)} - ${formatTime(student.endTime)}` : '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.feeStatus)}`}>
                        {student.feeStatus}
                      </span>
                    </TableCell>
                    <TableCell>₹{student.feeAmount.toLocaleString()}</TableCell>
                    <TableCell>{new Date(student.joinDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewQRCode(student)}>
                            <QrCode className="h-4 w-4 mr-2" />
                            View QR Code
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetDevice(student._id)}>
                            <SmartphoneNfc className="h-4 w-4 mr-2" />
                            Reset Device
                          </DropdownMenuItem>
                          <EditStudentDialog student={student} onStudentUpdated={fetchStudents} />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(student._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student QR Code</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <QRCodeDisplay
              value={selectedStudent.qrCode || selectedStudent._id}
              title={`${selectedStudent.name}'s QR Code`}
              studentId={selectedStudent._id}
              onClose={() => setShowQRCode(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}