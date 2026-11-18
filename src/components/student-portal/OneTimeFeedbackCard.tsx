'use client';

import React, { useState, useEffect } from 'react';
import { useStudentPortal } from '@/context/StudentPortalContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MessageSquareHeart, CheckCircle2, Loader2 } from 'lucide-react';

export function OneTimeFeedbackCard() {
  const { student } = useStudentPortal();
  const [checked, setChecked] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(true);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const [rating, setRating] = useState<number>(5);
  const [category, setCategory] = useState<string>('Overall Experience');
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!student?.id) return;
    fetch(`/api/student-portal/feedback?studentId=${student.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setHasSubmitted(Boolean(json.data?.hasSubmitted));
        }
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [student?.id]);

  if (!checked || !student) return null;
  if (hasSubmitted && !justSubmitted) return null;

  if (justSubmitted) {
    return (
      <Card className="bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 rounded-2xl">
        <CardContent className="p-4 flex items-center gap-3 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 font-semibold">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Thank you for your feedback! It helps us make Aarambh Library better for you.</span>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/student-portal/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          studentEmail: student.email,
          studentName: student.name,
          rating,
          category,
          message: message.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setHasSubmitted(true);
        setJustSubmitted(true);
      }
    } catch (err) {
      console.error('Feedback submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-900 border-indigo-200/80 dark:border-indigo-900/60 shadow-2xs rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquareHeart className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Share One-Time App Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                  title={`${star} Stars`}
                >
                  <Star
                    className={`h-5 w-5 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {rating}/5
              </span>
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="Overall Experience">Overall Experience</option>
              <option value="Study Roadmap & AI">Study Roadmap & AI</option>
              <option value="Practice & Current Affairs">Practice & Current Affairs</option>
              <option value="UI & Performance">UI & Performance</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you love or what we can improve..."
              required
              className="flex-1 h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !message.trim()}
              className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

