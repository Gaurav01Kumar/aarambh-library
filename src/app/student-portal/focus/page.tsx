'use client';

import React from 'react';
import {
  useStudentPortal,
  formatTimer,
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
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  Headphones,
  Sliders,
} from 'lucide-react';

const AMBIENT_TRACKS = [
  { id: 'rain', label: 'Soft Rain', desc: 'Gentle rainfall for deep reading' },
  { id: 'waves', label: 'Ocean Waves', desc: 'Warm pink-noise calm waves' },
  { id: 'binaural', label: '432Hz Focus', desc: 'Alpha wave binaural concentration' },
  { id: 'whitenoise', label: 'Library White Noise', desc: 'Masks external distractions' },
] as const;

export default function StudentFocusPage() {
  const {
    pomodoroMode,
    timeLeft,
    isTimerRunning,
    setIsTimerRunning,
    sessionsCompleted,
    handlePomodoroModeChange,
    ambientSound,
    ambientVolume,
    playAmbientSound,
    stopAmbientSound,
    handleVolumeChange,
  } = useStudentPortal();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
          Pomodoro Timer & Focus Audio
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Stay in deep focus with timed study blocks and distraction-blocking ambient sounds
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pomodoro Timer Card */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Study Timer
              </CardTitle>
              <Badge className="bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs">
                {sessionsCompleted} Sessions Done
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              25 min deep focus • 5 min short break • 15 min long break
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6 text-center">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {(
                [
                  { id: 'focus', label: 'Focus (25m)' },
                  { id: 'shortBreak', label: 'Short Break (5m)' },
                  { id: 'longBreak', label: 'Long Break (15m)' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handlePomodoroModeChange(m.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    pomodoroMode === m.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="py-6">
              <div className="text-6xl sm:text-7xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                {formatTimer(timeLeft)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-widest font-semibold">
                {pomodoroMode === 'focus'
                  ? 'Deep Work Mode'
                  : pomodoroMode === 'shortBreak'
                  ? 'Quick Recharge'
                  : 'Long Rest'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-2xl font-bold"
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Focus
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handlePomodoroModeChange(pomodoroMode)}
                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl"
                title="Reset Timer"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ambient Focus Audio Card */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Headphones className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Ambient Focus Sounds
              </CardTitle>
              {ambientSound !== 'none' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={stopAmbientSound}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 h-7"
                >
                  <VolumeX className="h-3.5 w-3.5 mr-1" /> Stop
                </Button>
              )}
            </div>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Synthesized locally in your browser — continues playing as you browse notes
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AMBIENT_TRACKS.map((track) => {
                const isPlaying = ambientSound === track.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() =>
                      isPlaying ? stopAmbientSound() : playAmbientSound(track.id)
                    }
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isPlaying
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400 ring-1 ring-indigo-300 dark:ring-indigo-700'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {track.label}
                      </span>
                      {isPlaying ? (
                        <Volume2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                      ) : (
                        <Play className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{track.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  Audio Volume
                </span>
                <span>{Math.round(ambientVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={ambientVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
