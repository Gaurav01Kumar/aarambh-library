'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Sparkles, ArrowLeft } from 'lucide-react';

export default function StudentPeersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
          Study Peer Match
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Connect with fellow library aspirants preparing for the same exam
        </p>
      </div>

      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs rounded-3xl">
        <CardContent className="py-16 px-6 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Users className="h-8 w-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Coming Soon
          </span>

          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Peer Study Groups & Matching
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            We are building verified study-buddy matching based on your target exam, shift timing, and library branch. Stay tuned!
          </p>

          <Link href="/student-portal" className="inline-block pt-2">
            <Button variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
