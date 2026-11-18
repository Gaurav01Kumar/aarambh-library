'use client';

import React, { useState } from 'react';
import {
  useStudentPortal,
  formatDate,
  calculateDaysLeft,
} from '@/context/StudentPortalContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/components/student-portal/MarkdownRenderer';
import { ExamTargetSetup } from '@/components/student-portal/ExamTargetSetup';
import { EditExamTargetModal } from '@/components/student-portal/EditExamTargetModal';
import {
  Map,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  Trash2,
  Loader2,
  Pencil,
} from 'lucide-react';

export default function StudentRoadmapPage() {
  const { student, setStudent } = useStudentPortal();
  const examTargets = student?.examTargets || [];
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeTarget = examTargets[selectedIdx] || examTargets[0] || null;

  const getFallbackMarkdown = () => {
    if (!activeTarget) return '';
    const daysLeft = calculateDaysLeft(activeTarget.examDate);
    return `# ${activeTarget.examName} — Study Roadmap

> **Target Score:** ${activeTarget.targetScore} / ${activeTarget.totalScore} • **Exam Date:** ${formatDate(activeTarget.examDate)} • **Days Remaining:** ${daysLeft} Days

---

## 1. Strategy Summary
${activeTarget.studyPlan?.summary || `Structured ${daysLeft}-day plan to reach ${activeTarget.targetScore}/${activeTarget.totalScore}.`}

## 2. Phase Milestones
${(activeTarget.studyPlan?.weeklyMilestones || [])
  .map((m: any) => `### ${m.phase}\n- **Focus:** ${m.focus}\n- **Target:** ${m.target}`)
  .join('\n\n')}

## 3. Daily Study Routine
${(activeTarget.studyPlan?.dailyRoutine || [])
  .map((r: any) => `- **${r.slot}:** ${r.activity}`)
  .join('\n')}`;
  };

  const markdownContent =
    activeTarget?.studyPlan?.roadmapMarkdown || getFallbackMarkdown();

  const handleRegenerate = async () => {
    if (!student || !activeTarget) return;
    setRegenerating(true);
    try {
      const res = await fetch('/api/student-portal/exam-targets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          targetId: activeTarget._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStudent({
          ...student,
          examTargets: data.data.examTargets,
        });
      }
    } catch (e) {
      console.error('Error regenerating roadmap:', e);
    } finally {
      setRegenerating(false);
    }
  };

  const handleDeleteTarget = async (targetId: string) => {
    if (!student || !confirm('Remove this exam target?')) return;
    try {
      const res = await fetch(
        `/api/student-portal/exam-targets?studentId=${student.id}&targetId=${targetId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        setSelectedIdx(0);
        setStudent({
          ...student,
          examTargets: data.data.examTargets,
          targetExam: data.data.targetExam,
        });
      }
    } catch (e) {
      console.error('Error removing target:', e);
    }
  };

  const handleCopyMarkdown = async () => {
    if (!markdownContent) return;
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Map className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            AI Study Roadmap
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Markdown-formatted preparation roadmap tailored to your target score & exam date
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Exam Target
        </Button>
      </div>

      {/* Multi-Exam Switcher */}
      {examTargets.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {examTargets.map((t, idx) => (
            <button
              key={t._id || idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                selectedIdx === idx
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}
            >
              🎯 {t.examName}
            </button>
          ))}
        </div>
      )}

      {activeTarget ? (
        <div className="space-y-5">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
              <CardContent className="p-4">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Exam Date</span>
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {formatDate(activeTarget.examDate)}
                </span>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
              <CardContent className="p-4">
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 block">Days Remaining</span>
                <span className="text-sm sm:text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                  {calculateDaysLeft(activeTarget.examDate)} Days
                </span>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
              <CardContent className="p-4">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">Target Score</span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {activeTarget.targetScore} / {activeTarget.totalScore}
                </span>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
              <CardContent className="p-4">
                <span className="text-[11px] text-amber-600 dark:text-amber-400 block">Daily Study Goal</span>
                <span className="text-sm sm:text-base font-extrabold text-amber-600 dark:text-amber-400">
                  {activeTarget.studyPlan?.dailyHours || 8} hrs / day
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Markdown Roadmap Document Card */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {activeTarget.studyPlan?.generatedByAI ? 'AI Roadmap' : 'Structured Roadmap'}
                </Badge>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Generated in Markdown for {activeTarget.examName}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyMarkdown}
                  className="h-8 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copy MD
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={regenerating}
                  onClick={handleRegenerate}
                  className="h-8 text-xs border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                >
                  {regenerating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Regenerate AI Plan
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEditModal(true)}
                  className="h-8 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit Target
                </Button>

                {examTargets.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteTarget(activeTarget._id)}
                    className="h-8 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-7">
              <MarkdownRenderer content={markdownContent} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="py-12 text-center text-slate-500 dark:text-slate-400">
            No exam targets added yet. Click &ldquo;Add Exam Target&rdquo; to generate your Markdown study roadmap.
          </CardContent>
        </Card>
      )}

      {showAddModal && student && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <ExamTargetSetup
            studentId={student.id}
            studentEmail={student.email}
            studentName={student.name}
            isFirstTime={false}
            onCancel={() => setShowAddModal(false)}
            onSuccess={(updatedTargets, primaryExam) => {
              setStudent({
                ...student,
                examTargets: updatedTargets,
                targetExam: primaryExam,
              });
              setSelectedIdx(Math.max(0, updatedTargets.length - 1));
              setShowAddModal(false);
            }}
          />
        </div>
      )}
      {showEditModal && student && activeTarget && (
        <EditExamTargetModal
          studentId={student.id}
          target={activeTarget}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updatedTargets, primaryExam) => {
            setStudent({
              ...student,
              examTargets: updatedTargets,
              targetExam: primaryExam,
            });
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}
