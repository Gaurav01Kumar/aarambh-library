'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Target,
  Sparkles,
  Loader2,
  X,
  CheckSquare,
  Square,
  Landmark,
  Cpu,
  Briefcase,
  PlusCircle,
} from 'lucide-react';
import { ExamTarget } from '@/context/StudentPortalContext';

interface ExamPreset {
  name: string;
  total: number;
  target: number;
}

const EXAM_CATEGORIES: Array<{
  id: 'govt' | 'tech' | 'other_cats';
  label: string;
  badge: string;
  icon: React.ReactNode;
  exams: ExamPreset[];
}> = [
  {
    id: 'govt',
    label: 'Government & Non-Tech',
    badge: 'Govt',
    icon: <Landmark className="h-3.5 w-3.5" />,
    exams: [
      { name: 'UPSC CSE', total: 2025, target: 1050 },
      { name: 'State PCS (BPSC/UPPSC/RAS)', total: 1500, target: 950 },
      { name: 'SSC CGL', total: 390, target: 325 },
      { name: 'SSC CHSL / MTS', total: 200, target: 165 },
      { name: 'Railway (RRB NTPC / Group D)', total: 120, target: 95 },
      { name: 'IBPS PO / Clerk', total: 100, target: 80 },
      { name: 'SBI PO / Clerk', total: 200, target: 155 },
      { name: 'RBI Grade B', total: 300, target: 230 },
      { name: 'NDA / CDS / CAPF', total: 900, target: 520 },
      { name: 'CTET / Teaching TET', total: 150, target: 120 },
      { name: 'Police / SI / Constable', total: 200, target: 160 },
    ],
  },
  {
    id: 'tech',
    label: 'Tech, Engineering & Medical',
    badge: 'Tech & Sci',
    icon: <Cpu className="h-3.5 w-3.5" />,
    exams: [
      { name: 'GATE (CS / EC / ME / CE)', total: 100, target: 72 },
      { name: 'JEE Main & Advanced', total: 300, target: 240 },
      { name: 'NEET UG', total: 720, target: 650 },
      { name: 'SSC JE / RRB JE (Tech)', total: 200, target: 155 },
      { name: 'ISRO / DRDO / BARC', total: 300, target: 235 },
      { name: 'NIMCET / MCA Entrance', total: 1000, target: 680 },
      { name: 'Tech Placement & Coding', total: 100, target: 85 },
    ],
  },
  {
    id: 'other_cats',
    label: 'Commerce, Law & Management',
    badge: 'Pro',
    icon: <Briefcase className="h-3.5 w-3.5" />,
    exams: [
      { name: 'CAT / XAT (MBA)', total: 198, target: 115 },
      { name: 'CLAT (Law)', total: 120, target: 96 },
      { name: 'CA Foundation / Inter / Final', total: 600, target: 420 },
      { name: 'CS / CMA', total: 400, target: 280 },
      { name: 'CUET UG / PG', total: 800, target: 680 },
    ],
  },
];

interface SelectedExamConfig {
  examName: string;
  examDate: string;
  totalScore: string;
  targetScore: string;
}

interface ExamTargetSetupProps {
  studentId: string;
  studentEmail: string;
  studentName?: string;
  isFirstTime?: boolean;
  onSuccess: (examTargets: ExamTarget[], primaryExam: string) => void;
  onCancel?: () => void;
}

export function ExamTargetSetup({
  studentId,
  studentEmail,
  studentName,
  isFirstTime = false,
  onSuccess,
  onCancel,
}: ExamTargetSetupProps) {
  const defaultDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [activeCategory, setActiveCategory] = useState<'all' | 'govt' | 'tech' | 'other_cats'>('all');
  const [selectedExams, setSelectedExams] = useState<Record<string, SelectedExamConfig>>({
    'UPSC CSE': {
      examName: 'UPSC CSE',
      examDate: defaultDate,
      totalScore: '2025',
      targetScore: '1050',
    },
  });

  // "Other" custom exam tick + input
  const [otherChecked, setOtherChecked] = useState(false);
  const [otherExamName, setOtherExamName] = useState('');
  const [otherDate, setOtherDate] = useState(defaultDate);
  const [otherTotal, setOtherTotal] = useState('100');
  const [otherTarget, setOtherTarget] = useState('85');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleExam = (preset: ExamPreset) => {
    setSelectedExams((prev) => {
      const next = { ...prev };
      if (next[preset.name]) {
        delete next[preset.name];
      } else {
        next[preset.name] = {
          examName: preset.name,
          examDate: defaultDate,
          totalScore: String(preset.total),
          targetScore: String(preset.target),
        };
      }
      return next;
    });
  };

  const updateSelectedExamField = (
    name: string,
    field: keyof SelectedExamConfig,
    value: string
  ) => {
    setSelectedExams((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payloadExams = Object.values(selectedExams).map((item) => ({
      examName: item.examName,
      examDate: item.examDate,
      totalScore: Number(item.totalScore),
      targetScore: Number(item.targetScore),
    }));

    if (otherChecked) {
      if (!otherExamName.trim()) {
        setError('Please enter your custom exam name under "Other".');
        return;
      }
      payloadExams.push({
        examName: otherExamName.trim(),
        examDate: otherDate,
        totalScore: Number(otherTotal),
        targetScore: Number(otherTarget),
      });
    }

    if (payloadExams.length === 0) {
      setError('Please tick at least one exam target.');
      return;
    }

    for (const ex of payloadExams) {
      if (!ex.examDate || !ex.totalScore || !ex.targetScore) {
        setError(`Please complete date and scores for ${ex.examName}.`);
        return;
      }
      if (ex.targetScore > ex.totalScore) {
        setError(`Target score cannot exceed total score for ${ex.examName}.`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/student-portal/exam-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          email: studentEmail,
          exams: payloadExams,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.data.examTargets, data.data.targetExam);
      } else {
        setError(data.error || 'Failed to save exam targets');
      }
    } catch (err) {
      console.error('Exam target save error:', err);
      setError('Network error while creating your AI study plan.');
    } finally {
      setSaving(false);
    }
  };

  const visibleCategories =
    activeCategory === 'all'
      ? EXAM_CATEGORIES
      : EXAM_CATEGORIES.filter((c) => c.id === activeCategory);

  const selectedCount =
    Object.keys(selectedExams).length + (otherChecked && otherExamName.trim() ? 1 : 0);

  return (
    <Card className="w-full max-w-3xl mx-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-sm">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                {isFirstTime
                  ? `Welcome${studentName ? `, ${studentName.split(' ')[0]}` : ''}! Set Your Exam Target`
                  : 'Add Multiple Target Exams'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tick one or multiple exams (Govt, Tech, Non-Tech, or Other). AI will build a personalized study plan and tailor your daily 20-question quiz.
              </CardDescription>
            </div>
          </div>
          {!isFirstTime && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 max-h-[82vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Exams' },
              { id: 'govt', label: 'Govt & Non-Tech' },
              { id: 'tech', label: 'Tech & Medical' },
              { id: 'other_cats', label: 'Commerce / MBA / Law' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                  activeCategory === tab.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Multi-Select Checkbox Grid by Category */}
          <div className="space-y-4">
            {visibleCategories.map((cat) => (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {cat.icon}
                  <span>{cat.label}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {cat.exams.map((ex) => {
                    const checked = !!selectedExams[ex.name];
                    return (
                      <button
                        key={ex.name}
                        type="button"
                        onClick={() => toggleExam(ex)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                          checked
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-2xs'
                            : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{ex.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* "Other" Custom Exam Checkbox */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setOtherChecked(!otherChecked)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  otherChecked
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                }`}
              >
                {otherChecked ? (
                  <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <PlusCircle className="h-4 w-4 text-slate-400" />
                )}
                <span>Other Exam (Type Custom Exam)</span>
              </button>

              {otherChecked && (
                <div className="mt-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Custom Exam Name *
                    </Label>
                    <Input
                      value={otherExamName}
                      onChange={(e) => setOtherExamName(e.target.value)}
                      placeholder="e.g., UGC NET, Judiciary, B.Ed"
                      className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Exam Date
                    </Label>
                    <Input
                      type="date"
                      value={otherDate}
                      onChange={(e) => setOtherDate(e.target.value)}
                      className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Total
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={otherTotal}
                        onChange={(e) => setOtherTotal(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Target
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={otherTarget}
                        onChange={(e) => setOtherTarget(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected Exams Configuration List (Date, Total Score, Target Score) */}
          {Object.values(selectedExams).length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Configure Selected Exams ({Object.values(selectedExams).length})
              </Label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {Object.values(selectedExams).map((item) => (
                  <div
                    key={item.examName}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                  >
                    <div className="sm:col-span-4 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        🎯 {item.examName}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedExams((prev) => {
                            const next = { ...prev };
                            delete next[item.examName];
                            return next;
                          })
                        }
                        className="text-slate-400 hover:text-rose-500 sm:hidden"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="sm:col-span-4">
                      <Input
                        type="date"
                        value={item.examDate}
                        onChange={(e) =>
                          updateSelectedExamField(item.examName, 'examDate', e.target.value)
                        }
                        className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        title="Exam Date"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        type="number"
                        min={1}
                        value={item.totalScore}
                        onChange={(e) =>
                          updateSelectedExamField(item.examName, 'totalScore', e.target.value)
                        }
                        placeholder="Total"
                        className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        title="Total Score"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={1}
                        value={item.targetScore}
                        onChange={(e) =>
                          updateSelectedExamField(item.examName, 'targetScore', e.target.value)
                        }
                        placeholder="Target"
                        className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        title="Target Score"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedExams((prev) => {
                            const next = { ...prev };
                            delete next[item.examName];
                            return next;
                          })
                        }
                        className="hidden sm:inline-flex p-1 text-slate-400 hover:text-rose-500"
                        title="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating AI Study Plans ({selectedCount})...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {isFirstTime
                  ? `Create AI Plan${selectedCount > 1 ? 's' : ''} & Open Dashboard`
                  : `Add ${selectedCount || 1} Exam Target${selectedCount > 1 ? 's' : ''}`}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
