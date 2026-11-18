'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExamTarget } from '@/context/StudentPortalContext';
import { Pencil, X, Loader2, Sparkles } from 'lucide-react';

interface EditExamTargetModalProps {
  studentId: string;
  target: ExamTarget;
  onClose: () => void;
  onSuccess: (examTargets: ExamTarget[], primaryExam: string) => void;
}

export function EditExamTargetModal({
  studentId,
  target,
  onClose,
  onSuccess,
}: EditExamTargetModalProps) {
  const initialDate = target.examDate
    ? new Date(target.examDate).toISOString().split('T')[0]
    : '';

  const [examName, setExamName] = useState(target.examName);
  const [examDate, setExamDate] = useState(initialDate);
  const [totalScore, setTotalScore] = useState(String(target.totalScore));
  const [targetScore, setTargetScore] = useState(String(target.targetScore));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const total = Number(totalScore);
    const tScore = Number(targetScore);

    if (!examName.trim() || !examDate || !total || !tScore) {
      setError('All fields are required.');
      return;
    }
    if (tScore > total) {
      setError('Target score cannot exceed total score.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/student-portal/exam-targets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          targetId: target._id,
          examName: examName.trim(),
          examDate,
          totalScore: total,
          targetScore: tScore,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.data.examTargets, data.data.targetExam);
      } else {
        setError(data.error || 'Failed to update exam target');
      }
    } catch (err) {
      console.error('Update exam target error:', err);
      setError('Network error while updating exam target.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white">
                <Pencil className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white">
                  Edit Exam Target
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Updates your target and refreshes your AI study roadmap
                </CardDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Exam Name
              </Label>
              <Input
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                required
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Exam Date
              </Label>
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                required
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Total Score
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={totalScore}
                  onChange={(e) => setTotalScore(e.target.value)}
                  required
                  className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Score
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  required
                  className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Save & Update Plan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

