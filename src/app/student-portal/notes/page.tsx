'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStudentPortal } from '@/context/StudentPortalContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Search,
  Download,
  Plus,
  Trash2,
  NotebookPen,
  Loader2,
  X,
  Pencil,
} from 'lucide-react';

interface PersonalNote {
  _id: string;
  title: string;
  subject: string;
  examTag: string;
  content: string;
  createdAt: string;
}

export default function StudentNotesPage() {
  const { student, materials } = useStudentPortal();
  const [activeSection, setActiveSection] = useState<'my-notes' | 'pyq-bank'>('my-notes');

  // Personal Notes state (MongoDB)
  const [myNotes, setMyNotes] = useState<PersonalNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSubject, setNoteSubject] = useState('');
  const [noteExamTag, setNoteExamTag] = useState(student?.targetExam || '');
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // PYQ Bank filter state
  const [notesCategory, setNotesCategory] = useState<string>('all');
  const [notesSearch, setNotesSearch] = useState<string>('');

  const categories = ['all', 'UPSC', 'SSC', 'Banking', 'PYQ', 'General'];

  const fetchPersonalNotes = useCallback(async () => {
    if (!student?.id) return;
    setLoadingNotes(true);
    try {
      const res = await fetch(`/api/student-portal/notes?studentId=${student.id}`);
      const data = await res.json();
      if (data.success) {
        setMyNotes(data.data || []);
      }
    } catch (e) {
      console.error('Error loading personal notes:', e);
    } finally {
      setLoadingNotes(false);
    }
  }, [student?.id]);

  useEffect(() => {
    fetchPersonalNotes();
  }, [fetchPersonalNotes]);

  const openCreateEditor = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteSubject('');
    setNoteExamTag(student?.targetExam || '');
    setNoteContent('');
    setShowEditor(true);
  };

  const openEditEditor = (note: PersonalNote) => {
    setEditingNoteId(note._id);
    setNoteTitle(note.title);
    setNoteSubject(note.subject);
    setNoteExamTag(note.examTag);
    setNoteContent(note.content);
    setShowEditor(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !noteTitle.trim() || !noteContent.trim()) return;
    setSavingNote(true);
    try {
      if (editingNoteId) {
        const res = await fetch('/api/student-portal/notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingNoteId,
            title: noteTitle,
            subject: noteSubject || 'General',
            examTag: noteExamTag || student.targetExam || '',
            content: noteContent,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setMyNotes((prev) =>
            prev.map((n) => (n._id === editingNoteId ? data.data : n))
          );
          setShowEditor(false);
          setEditingNoteId(null);
        }
      } else {
        const res = await fetch('/api/student-portal/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: student.id,
            studentEmail: student.email,
            title: noteTitle,
            subject: noteSubject || 'General',
            examTag: noteExamTag || student.targetExam || '',
            content: noteContent,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setMyNotes((prev) => [data.data, ...prev]);
          setShowEditor(false);
        }
      }
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      const res = await fetch(`/api/student-portal/notes?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMyNotes((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (err) {
      console.error('Delete note error:', err);
    }
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesCat =
      notesCategory === 'all' ||
      m.category.toLowerCase() === notesCategory.toLowerCase();
    const matchesSearch =
      notesSearch.trim() === '' ||
      m.title.toLowerCase().includes(notesSearch.toLowerCase()) ||
      m.subject.toLowerCase().includes(notesSearch.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(notesSearch.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            My Study Notes & PYQ Bank
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Write, edit, and organize your personal notes, or download curated PYQ PDFs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => setActiveSection('my-notes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeSection === 'my-notes'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              My Notes ({myNotes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('pyq-bank')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeSection === 'pyq-bank'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              PYQ Bank ({materials.length})
            </button>
          </div>
        </div>
      </div>

      {/* ─── SECTION 1: STUDENT PERSONAL NOTES ─── */}
      {activeSection === 'my-notes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => (showEditor ? setShowEditor(false) : openCreateEditor())}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
            >
              {showEditor ? (
                <>
                  <X className="h-3.5 w-3.5 mr-1.5" /> Close Editor
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add New Note
                </>
              )}
            </Button>
          </div>

          {showEditor && (
            <Card className="bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <NotebookPen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  {editingNoteId ? 'Edit Personal Note' : 'Create Personal Study Note'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSaveNote} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Title *</Label>
                      <Input
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder="e.g., Fundamental Rights Articles 12-35"
                        required
                        className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subject</Label>
                      <Input
                        value={noteSubject}
                        onChange={(e) => setNoteSubject(e.target.value)}
                        placeholder="e.g., Polity, Economy, Maths"
                        className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Exam Tag</Label>
                      <Input
                        value={noteExamTag}
                        onChange={(e) => setNoteExamTag(e.target.value)}
                        placeholder="e.g., UPSC CSE"
                        className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Note Content *</Label>
                    <textarea
                      rows={5}
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Write your revision points, formulas, or key takeaways..."
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={savingNote}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6"
                  >
                    {savingNote ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving...
                      </>
                    ) : editingNoteId ? (
                      'Update Note'
                    ) : (
                      'Save Note'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {loadingNotes ? (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardContent className="py-10 text-center text-slate-500 dark:text-slate-400 text-sm">
                Loading your notes...
              </CardContent>
            </Card>
          ) : myNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myNotes.map((note) => (
                <Card
                  key={note._id}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px]">
                          {note.subject}
                        </Badge>
                        {note.examTag && (
                          <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            {note.examTag}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditEditor(note)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60"
                          title="Edit Note"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                          title="Delete Note"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {note.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-1 space-y-2">
                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {note.content}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                      Saved {new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardContent className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                <NotebookPen className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No personal notes yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Click &ldquo;Add New Note&rdquo; above to save your revision points and formulas.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── SECTION 2: DIGITAL NOTES & PYQ BANK ─── */}
      {activeSection === 'pyq-bank' && (
        <div className="space-y-4">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search notes, subjects, or tags..."
                  value={notesSearch}
                  onChange={(e) => setNotesSearch(e.target.value)}
                  className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNotesCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                      notesCategory === cat
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat === 'all' ? 'All Materials' : cat}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {filteredMaterials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map((item) => (
                <Card
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 transition-all shadow-2xs flex flex-col justify-between"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px]">
                        {item.category}
                      </Badge>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.fileSize} • {item.year}
                      </span>
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                      {item.subject}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <a
                      href={item.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block pt-2"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 font-semibold text-xs"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download PDF
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardContent className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                <FileText className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No study materials found</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
