'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStudentPortal, formatDate } from '@/context/StudentPortalContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Award,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  History,
  Languages,
  Eye,
  Play,
} from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  difficulty: string;
}

interface PracticeAttemptRecord {
  _id: string;
  dateKey: string;
  examType: string;
  questions: QuizQuestion[];
  userAnswers: Record<string, number>;
  score: number;
  totalQuestions: number;
  accuracyPercent: number;
  status: 'in_progress' | 'completed';
  generatedByAI: boolean;
  createdAt: string;
  completedAt?: string;
}

const TRANSLATE_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
];

export default function StudentPracticePage() {
  const { student } = useStudentPortal();
  const examTargets = student?.examTargets || [];
  const defaultExam =
    examTargets[0]?.examName || student?.targetExam || 'UPSC Civil Services';

  const [selectedExam, setSelectedExam] = useState<string>(defaultExam);
  const [attempts, setAttempts] = useState<PracticeAttemptRecord[]>([]);
  const [remainingToday, setRemainingToday] = useState<number>(2);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    completedAttempts: 0,
    avgAccuracy: 0,
    bestScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [activeAttempt, setActiveAttempt] = useState<PracticeAttemptRecord | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [activeLang, setActiveLang] = useState<string>('en');

  // Google Translate setup
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        const container = document.getElementById('google_translate_practice');
        if (container && container.innerHTML.trim() === '') {
          new window.google.translate.TranslateElement(
            { pageLanguage: 'en', autoDisplay: false },
            'google_translate_practice'
          );
        }
      }
    };
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    }
  }, []);

  const handleQuickTranslate = (langCode: string) => {
    setActiveLang(langCode);
    document.cookie = `googtrans=/en/${langCode}; path=/`;
    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (combo) {
      combo.value = langCode;
      combo.dispatchEvent(new Event('change'));
    }
  };

  useEffect(() => {
    if (examTargets.length > 0 && !examTargets.some((e) => e.examName === selectedExam)) {
      setSelectedExam(examTargets[0].examName);
    }
  }, [examTargets, selectedExam]);

  const fetchPracticeHistory = useCallback(async () => {
    if (!student?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/student-portal/practice?studentId=${student.id}`);
      const json = await res.json();
      if (json.success) {
        setAttempts(json.data.attempts || []);
        setRemainingToday(json.data.remainingToday ?? 2);
        setTodayCount(json.data.todayCount ?? 0);
        setStats(json.data.stats || { totalAttempts: 0, completedAttempts: 0, avgAccuracy: 0, bestScore: 0 });
        // If there is an in-progress attempt, load it automatically
        const inProg = (json.data.attempts || []).find((a: PracticeAttemptRecord) => a.status === 'in_progress');
        if (inProg && !activeAttempt) {
          setActiveAttempt(inProg);
          setAnswers(inProg.userAnswers || {});
        }
      }
    } catch (e) {
      console.error('Failed to fetch practice history:', e);
    } finally {
      setLoading(false);
    }
  }, [student?.id, activeAttempt]);

  useEffect(() => {
    fetchPracticeHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id]);

  const handleGeneratePractice = async () => {
    if (!student) return;
    setErrorMsg('');
    setGenerating(true);
    try {
      const res = await fetch('/api/student-portal/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          studentEmail: student.email,
          examType: selectedExam,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const created: PracticeAttemptRecord = json.data.attempt;
        setActiveAttempt(created);
        setAnswers({});
        setRemainingToday(json.data.remainingToday);
        setTodayCount((prev) => prev + 1);
        setAttempts((prev) => [created, ...prev]);
      } else {
        setErrorMsg(json.error || 'Could not generate practice set');
      }
    } catch (e) {
      console.error('Error generating practice set:', e);
      setErrorMsg('Network error while generating practice set.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitPractice = async () => {
    if (!activeAttempt) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/student-portal/practice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: activeAttempt._id,
          userAnswers: answers,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const updated: PracticeAttemptRecord = json.data;
        setActiveAttempt(updated);
        setAttempts((prev) =>
          prev.map((a) => (a._id === updated._id ? updated : a))
        );
        fetchPracticeHistory();
      }
    } catch (e) {
      console.error('Error submitting practice:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const openPastAttempt = (attempt: PracticeAttemptRecord) => {
    setActiveAttempt(attempt);
    setAnswers(attempt.userAnswers || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const questions = activeAttempt?.questions || [];
  const isCompleted = activeAttempt?.status === 'completed';
  const answeredCount = Object.keys(answers).length;
  const dailyGoalPercent = Math.min(100, Math.round((todayCount / 2) * 100));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Practice Sets & Progress
            </h1>
            <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px]">
              {remainingToday} / 2 Left Today
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Generate up to 2 AI practice sets daily, track accuracy, and review past attempts
          </p>
        </div>

        <Button
          onClick={handleGeneratePractice}
          disabled={generating || remainingToday <= 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl self-start sm:self-auto"
        >
          {generating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Generating 20 MCQs...
            </>
          ) : remainingToday <= 0 ? (
            'Daily Limit Reached (2/2)'
          ) : (
            <>
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Generate Practice Set ({remainingToday} left)
            </>
          )}
        </Button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Progress & Goals KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
          <CardContent className="p-4">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              Daily Practice Goal
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                {todayCount} / 2 Sets
              </span>
              <span className="text-[11px] font-bold text-slate-400">{dailyGoalPercent}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-indigo-600 transition-all"
                style={{ width: `${dailyGoalPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
          <CardContent className="p-4">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              Average Accuracy
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {stats.avgAccuracy}%
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
          <CardContent className="p-4">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              Best Practice Score
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {stats.bestScore} / 20
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
          <CardContent className="p-4">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              Completed Sets
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {stats.completedAttempts}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Exam Switcher + Google Translate */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {examTargets.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {examTargets.map((ex) => (
              <button
                key={ex._id}
                type="button"
                onClick={() => setSelectedExam(ex.examName)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                  selectedExam === ex.examName
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                }`}
              >
                🎯 {ex.examName}
              </button>
            ))}
          </div>
        )}
      </div>

      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
        <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Languages className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-xs font-bold text-slate-900 dark:text-white mr-1">
              Translate:
            </span>
            {TRANSLATE_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleQuickTranslate(lang.code)}
                className={`notranslate px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                  activeLang === lang.code
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <div id="google_translate_practice" className="notranslate text-xs shrink-0" />
        </CardContent>
      </Card>

      {/* Active Practice Set */}
      {activeAttempt && (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  {activeAttempt.examType} Practice Set ({questions.length} MCQs)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  {isCompleted
                    ? `Completed on ${formatDate(activeAttempt.completedAt || activeAttempt.createdAt)}`
                    : `Answered ${answeredCount} of ${questions.length} questions`}
                </CardDescription>
              </div>

              {isCompleted ? (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Score: {activeAttempt.score} / {activeAttempt.totalQuestions} ({activeAttempt.accuracyPercent}%)
                </div>
              ) : (
                <Button
                  size="sm"
                  disabled={answeredCount === 0 || submitting}
                  onClick={handleSubmitPractice}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Submit Practice ({answeredCount}/{questions.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-5 space-y-5">
            {questions.map((q, qIdx) => {
              const selectedOpt = answers[q.id];
              return (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400">
                      Question {qIdx + 1} of {questions.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                        {q.topic}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                        {q.difficulty}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {q.question}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedOpt === optIdx;
                      const isCorrect = optIdx === q.correctIndex;
                      let style =
                        'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-600';

                      if (isCompleted) {
                        if (isCorrect) {
                          style =
                            'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                        } else if (isSelected && !isCorrect) {
                          style = 'bg-rose-50 dark:bg-rose-950/70 border-rose-400 text-rose-800 dark:text-rose-200';
                        }
                      } else if (isSelected) {
                        style =
                          'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-semibold';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() =>
                            !isCompleted &&
                            setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                          }
                          className={`p-3 rounded-xl border text-xs text-left transition-all ${style}`}
                        >
                          <span className="font-bold mr-2 text-slate-400">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {isCompleted && (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 block">
                        Correct Answer: {String.fromCharCode(65 + q.correctIndex)}
                      </span>
                      <p className="text-slate-600 dark:text-slate-300">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {!isCompleted && questions.length > 0 && (
              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleSubmitPractice}
                  disabled={answeredCount === 0 || submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 rounded-xl"
                >
                  {submitting ? 'Submitting...' : `Submit & Save Progress (${answeredCount}/${questions.length})`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Last Practice History */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Last Practice History
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Track your past practice sets and click Review to inspect answers
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <p className="text-xs text-slate-500 text-center py-6">Loading practice history...</p>
          ) : attempts.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {attempts.map((att) => (
                <div
                  key={att._id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {att.examType}
                      </span>
                      <Badge
                        className={
                          att.status === 'completed'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px]'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px]'
                        }
                      >
                        {att.status === 'completed'
                          ? `${att.score}/${att.totalQuestions} (${att.accuracyPercent}%)`
                          : 'In Progress'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatDate(att.createdAt)} • {att.totalQuestions} Questions
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openPastAttempt(att)}
                    className="h-8 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 self-start sm:self-auto"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
                    {att.status === 'completed' ? 'Review' : 'Continue'}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <TrendingUp className="h-9 w-9 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                No practice sets taken yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click &ldquo;Generate Practice Set&rdquo; above to start your first 20-question drill!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

