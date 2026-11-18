'use client';

import React, { useState } from 'react';
import {
  useStudentPortal,
  PhysicalBook,
} from '@/context/StudentPortalContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookMarked, Search, CheckCircle2, X, Loader2 } from 'lucide-react';

export default function StudentBooksPage() {
  const { student, books, setBooks } = useStudentPortal();
  const [bookSearch, setBookSearch] = useState('');
  const [bookCategory, setBookCategory] = useState('all');
  const [selectedBook, setSelectedBook] = useState<PhysicalBook | null>(null);
  const [reserving, setReserving] = useState(false);
  const [reservationCode, setReservationCode] = useState<string | null>(null);

  const categories = ['all', ...Array.from(new Set(books.map((b) => b.category)))];

  const filteredBooks = books.filter((b) => {
    const matchesCat =
      bookCategory === 'all' ||
      b.category.toLowerCase() === bookCategory.toLowerCase();
    const matchesSearch =
      bookSearch.trim() === '' ||
      b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.author.toLowerCase().includes(bookSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleReserveBook = async () => {
    if (!selectedBook) return;
    setReserving(true);
    try {
      const res = await fetch('/api/student-portal/study-hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reserve-book',
          studentId: student?.id,
          studentEmail: student?.email,
          bookId: selectedBook.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReservationCode(data.reservationCode);
        setBooks((prev) =>
          prev.map((b) =>
            b.id === selectedBook.id
              ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) }
              : b
          )
        );
      }
    } catch (e) {
      console.error('Reservation error:', e);
    } finally {
      setReserving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Library Shelf & Book Reservation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Browse available reference books on the library racks and reserve your copy
        </p>
      </div>

      {/* Search & Category Filters */}
      <Card className="bg-white border-slate-200 shadow-2xs">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by book title or author..."
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-slate-900"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setBookCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  bookCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Books' : cat}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Books Grid */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => {
            const isAvailable = book.availableCopies > 0;
            return (
              <Card
                key={book.id}
                className="bg-white border-slate-200 shadow-2xs flex flex-col justify-between"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">
                      {book.category}
                    </Badge>
                    <Badge
                      className={
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 text-[10px]'
                      }
                    >
                      {isAvailable ? `${book.availableCopies} Available` : 'Out of Stock'}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    {book.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    by {book.author}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span>Shelf Rack: <strong>{book.shelfRack}</strong></span>
                    <span>Total: {book.totalCopies}</span>
                  </div>
                  <Button
                    size="sm"
                    disabled={!isAvailable}
                    onClick={() => {
                      setSelectedBook(book);
                      setReservationCode(null);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                  >
                    <BookMarked className="h-3.5 w-3.5 mr-1.5" />
                    {isAvailable ? 'Reserve Copy' : 'Currently Unavailable'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-white border-slate-200">
          <CardContent className="py-12 text-center text-slate-500 space-y-2">
            <BookMarked className="h-10 w-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No books found</p>
          </CardContent>
        </Card>
      )}

      {/* Reserve Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Reserve Library Book</h3>
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {reservationCode ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-emerald-900">Book Reserved!</p>
                <p className="text-xs text-emerald-700">
                  Show this code at the library desk to collect your copy:
                </p>
                <div className="text-lg font-mono font-black text-emerald-800 bg-white py-2 px-4 rounded-xl border border-emerald-200 inline-block">
                  {reservationCode}
                </div>
              </div>
            ) : (
              <>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <p className="text-sm font-bold text-slate-900">{selectedBook.title}</p>
                  <p className="text-xs text-slate-500">
                    {selectedBook.author} • Rack {selectedBook.shelfRack}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedBook(null)}
                    className="flex-1 border-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReserveBook}
                    disabled={reserving}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {reserving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        Reserving...
                      </>
                    ) : (
                      'Confirm Reservation'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

