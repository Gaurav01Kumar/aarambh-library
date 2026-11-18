'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useStudentPortal, NewsBite } from '@/context/StudentPortalContext';
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
  Sparkles,
  Target,
  Loader2,
  Languages,
  Newspaper,
  ArrowRight,
  Calendar,
} from 'lucide-react';

const TRANSLATE_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'or', label: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'ur', label: 'اردو (Urdu)' },
];

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

export default function StudentCurrentAffairsPage() {
  const { student } = useStudentPortal();
  const examTargets = student?.examTargets || [];
  const defaultExam =
    examTargets[0]?.examName || student?.targetExam || 'UPSC Civil Services';

  const [selectedExam, setSelectedExam] = useState<string>(defaultExam);
  const [data, setData] = useState<{
    date: string;
    examType: string;
    editorialHighlight: any;
    newsBites: NewsBite[];
    generatedByAI: boolean;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeLang, setActiveLang] = useState<string>('en');

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        const container = document.getElementById('google_translate_element');
        if (container && container.innerHTML.trim() === '') {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              autoDisplay: false,
            },
            'google_translate_element'
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

  const fetchDailyNews = useCallback(async (examType: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ examType });
      const res = await fetch(`/api/student-portal/current-affairs?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error('Error loading current affairs news:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchDailyNews(selectedExam);
    }
  }, [selectedExam, fetchDailyNews]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Daily Current Affairs & News
            </h1>
            <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px]">
              1 Daily Edition
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Today&apos;s curated editorial analysis and key exam news takeaways
          </p>
        </div>

        <Link href="/student-portal/practice">
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
          >
            Go to Practice Tests <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>

      {/* Google Translate Bar */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Languages className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Translate Daily News (Google Translate)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Read today&apos;s editorial and news bites in Hindi or any regional language
                </p>
              </div>
            </div>
            <div id="google_translate_element" className="notranslate text-xs shrink-0" />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800">
            {TRANSLATE_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleQuickTranslate(lang.code)}
                className={`notranslate px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                  activeLang === lang.code
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exam Type Selector */}
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

      {loading ? (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Loading today&apos;s Current Affairs & News for {selectedExam}...
            </p>
          </CardContent>
        </Card>
      ) : data ? (
        <div className="space-y-6">
          {/* Editorial Highlight Card */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Daily Editorial Analysis
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    <Calendar className="h-3 w-3 mr-1" />
                    {data.date}
                  </Badge>
                  <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs">
                    {data.generatedByAI ? '✨ AI Curated' : 'Daily Brief'} • {data.examType}
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Source: {data.editorialHighlight?.source}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mb-2">
                  {data.editorialHighlight?.headline}
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {data.editorialHighlight?.summary}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 shrink-0" />
                  <span>{data.editorialHighlight?.relevance}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily News Bites Grid */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Key News Takeaways ({data.newsBites.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Important headlines and policy updates relevant for {data.examType}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              {data.newsBites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {data.newsBites.map((bite) => (
                    <div
                      key={bite.id}
                      className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5"
                    >
                      <Badge
                        variant="outline"
                        className="text-[10px] text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60"
                      >
                        {bite.category}
                      </Badge>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {bite.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {bite.takeaway}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                  No news bites available for today.
                </p>
              )}
            </CardContent>
          </Card>

          {/* CTA Banner to Practice Page */}
          <Card className="bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ready to test what you read today?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Head to the Practice page to generate up to 2 AI practice sets daily and track your accuracy & goals.
                </p>
              </div>
              <Link href="/student-portal/practice">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shrink-0">
                  Start Practice Set <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
