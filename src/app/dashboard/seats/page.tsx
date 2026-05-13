'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, MoreVertical, Edit, Trash2, Armchair } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddSeatDialog } from '@/components/add-seat-dialog';
import { EditSeatDialog } from '@/components/edit-seat-dialog';

interface Seat {
  _id: string;
  seatNumber: string;
  type: 'regular' | 'premium' | 'vip';
  price: number;
  isOccupied: boolean;
  isAvailable: boolean;
  currentStudent?: any;
  features: string[];
  floor: string;
  section: string;
}

export default function SeatsPage() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);

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
      }
    } catch (error) {
      console.error('Error deleting seat:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vip':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'premium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'regular':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  const getStatusColor = (isOccupied: boolean, isAvailable: boolean) => {
    if (!isAvailable) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
    if (isOccupied) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  const getStatusText = (isOccupied: boolean, isAvailable: boolean) => {
    if (!isAvailable) return 'Maintenance';
    if (isOccupied) return 'Occupied';
    return 'Available';
  };

  const occupancyRate = seats.length > 0 ? ((seats.filter(s => s.isOccupied).length / seats.length) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Seats</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage library seats and availability</p>
        </div>
        <AddSeatDialog onSeatAdded={fetchSeats} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Seats</CardTitle>
            <Armchair className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seats.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {seats.filter(s => s.isAvailable && !s.isOccupied).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {seats.filter(s => s.isOccupied).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Seats Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Seats</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading seats...</div>
          ) : seats.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No seats found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seat Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>AC Status</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Student</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seats.map((seat) => (
                  <TableRow key={seat._id}>
                    <TableCell className="font-medium">{seat.seatNumber}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(seat.type)}`}>
                        {seat.type}
                      </span>
                    </TableCell>
                    <TableCell>{seat.floor}</TableCell>
                    <TableCell>{seat.section}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${seat.isAC ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
                        {seat.isAC ? 'AC' : 'Non-AC'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(seat.isOccupied, seat.isAvailable)}`}>
                        {getStatusText(seat.isOccupied, seat.isAvailable)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {seat.currentStudent ? (
                        <span className="text-sm">{seat.currentStudent.name}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <EditSeatDialog seat={seat} onSeatUpdated={fetchSeats} />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(seat._id)}
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
    </div>
  );
}