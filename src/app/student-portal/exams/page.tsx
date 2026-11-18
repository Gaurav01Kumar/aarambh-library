'use client';

import React from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink } from 'lucide-react';

export default function StudentExamsPage() {
  const { examCalendar } = useStudentPortal();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
          Exam Calendar & Alerts
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Upcoming competitive exam dates, admit card status, and official portals
        </p>
      </div>

      {examCalendar.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {examCalendar.map((exam) => {
            const daysLeft = calculateDaysLeft(exam.examDate);
            return (
              <Card
                key={exam.id}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px]">
                      {exam.category}
                    </Badge>
                    <Badge
                      className={
                        daysLeft <= 30
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold'
                      }
                    >
                      {daysLeft > 0 ? `${daysLeft} Days Left` : 'Today / Passed'}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    {exam.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    {exam.conductingBody}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Exam Date</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatDate(exam.examDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Admit Card</span>
                      <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                        {exam.admitCardStatus}
                      </span>
                    </div>
                  </div>
                  <a
                    href={exam.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
                      Official Portal
                    </Button>
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <Calendar className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No upcoming exams listed</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
