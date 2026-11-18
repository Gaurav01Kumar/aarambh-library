'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStudentPortal } from '@/context/StudentPortalContext';
import { MarkdownRenderer } from '@/components/student-portal/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import {
  MessageCircle,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  Square,
  Sparkles,
  Trash2,
  Loader2,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface ChatMsg {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  language?: string;
  createdAt?: string;
}

const CHAT_LANGUAGES = [
  { label: 'English', speechCode: 'en-IN' },
  { label: 'Hindi', speechCode: 'hi-IN' },
  { label: 'Hinglish', speechCode: 'en-IN' },
  { label: 'Marathi', speechCode: 'mr-IN' },
  { label: 'Bengali', speechCode: 'bn-IN' },
  { label: 'Tamil', speechCode: 'ta-IN' },
  { label: 'Telugu', speechCode: 'te-IN' },
  { label: 'Gujarati', speechCode: 'gu-IN' },
];

function stripMarkdownForSpeech(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#>*_~\-\[\]]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function StudyMateChat() {
  const { student } = useStudentPortal();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('English');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [remainingToday, setRemainingToday] = useState<number>(5);
  const [quotaError, setQuotaError] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const fetchHistory = useCallback(async () => {
    if (!student?.id) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/student-portal/chat?studentId=${student.id}`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.data || []);
        if (typeof json.quota?.remainingToday === 'number') {
          setRemainingToday(json.quota.remainingToday);
        }
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    } finally {
      setLoadingHistory(false);
    }
  }, [student?.id]);

  useEffect(() => {
    if (isOpen && student?.id) {
      fetchHistory();
    }
  }, [isOpen, student?.id, fetchHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      try {
        recognitionRef.current?.stop();
      } catch {}
    };
  }, []);

  if (!student) return null;

  const selectedLangObj =
    CHAT_LANGUAGES.find((l) => l.label === language) || CHAT_LANGUAGES[0];

  const handleToggleMic = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please type your message.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLangObj.speechCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSpeakReply = (msg: ChatMsg) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Audio playback is not supported in this browser.');
      return;
    }

    if (speakingMsgId === msg._id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = stripMarkdownForSpeech(msg.content);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const msgLangObj =
      CHAT_LANGUAGES.find((l) => l.label === (msg.language || language)) ||
      selectedLangObj;
    utterance.lang = msgLangObj.speechCode;
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msg._id);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || sending || remainingToday <= 0) return;

    setQuotaError('');
    setInput('');
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { _id: tempId, role: 'user', content: text, language },
    ]);

    try {
      const res = await fetch('/api/student-portal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          studentEmail: student.email,
          studentName: student.name,
          targetExam: student.targetExam || student.examTargets?.[0]?.examName || '',
          message: text,
          language,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) => [
          ...prev.filter((m) => m._id !== tempId),
          json.data.userMessage,
          json.data.assistantMessage,
        ]);
        if (typeof json.data.remainingToday === 'number') {
          setRemainingToday(json.data.remainingToday);
        }
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
        setQuotaError(json.error || 'Could not send message.');
        if (res.status === 429) {
          setRemainingToday(0);
        }
      }
    } catch (err) {
      console.error('Study Mate send error:', err);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Clear your Study Mate chat history?')) return;
    try {
      await fetch(`/api/student-portal/chat?studentId=${student.id}`, {
        method: 'DELETE',
      });
      setMessages([]);
    } catch {}
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 transition-transform hover:scale-105 active:scale-95"
          title="Open AI Study Mate"
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span className="text-xs font-bold">Study Mate AI</span>
          <MessageCircle className="h-4 w-4" />
        </button>
      )}

      {/* Floating Chat Window (Compact or Full Screen) */}
      {isOpen && (
        <div
          className={`fixed z-[80] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all ${
            isFullScreen
              ? 'inset-2 sm:inset-5 rounded-2xl sm:rounded-3xl'
              : 'bottom-20 md:bottom-6 right-3 left-3 sm:left-auto sm:right-6 sm:w-[420px] h-[72vh] max-h-[580px] rounded-3xl'
          }`}
        >
          {/* Chat Header */}
          <div className="px-4 py-3 bg-indigo-600 text-white flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-xl bg-white/15">
                <Sparkles className="h-4 w-4 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold leading-tight truncate">Study Mate AI</p>
                  <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-bold whitespace-nowrap">
                    {remainingToday}/5 left
                  </span>
                </div>
                <p className="text-[10px] text-indigo-100 truncate">
                  Ask doubts • Speak or Type • Saved in DB
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label="Reply Language"
                className="bg-indigo-700 text-white text-[11px] font-semibold rounded-lg px-2 py-1 border border-indigo-400/40 focus:outline-none"
              >
                {CHAT_LANGUAGES.map((l) => (
                  <option key={l.label} value={l.label}>
                    {l.label}
                  </option>
                ))}
              </select>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="p-1.5 rounded-lg hover:bg-white/15 text-indigo-100"
                  title="Clear Chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 rounded-lg hover:bg-white/15"
                title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
              >
                {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFullScreen(false);
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg hover:bg-white/15"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50 dark:bg-slate-950/60">
            {loadingHistory ? (
              <div className="py-10 text-center text-xs text-slate-500">
                Loading your Study Mate conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-2">
                <Sparkles className="h-8 w-8 text-indigo-500 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  Hi {student.name?.split(' ')[0]}! I&apos;m your Study Mate.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ask me any concept, PYQ doubt, or revision trick in {language}. You can type or tap the mic to speak, and listen to my replies!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isSpeaking = speakingMsgId === msg._id;
                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      ) : (
                        <div className="space-y-2">
                          <MarkdownRenderer content={msg.content} />
                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => handleSpeakReply(msg)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${
                                isSpeaking
                                  ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                              }`}
                            >
                              {isSpeaking ? (
                                <>
                                  <Square className="h-2.5 w-2.5 fill-current" />
                                  Stop Audio
                                </>
                              ) : (
                                <>
                                  <Volume2 className="h-3 w-3" />
                                  Listen
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {sending && (
              <div className="flex items-start">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-500 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                  Thinking in {language}...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {quotaError && (
            <div className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 border-t border-rose-200 dark:border-rose-800 text-[11px] font-medium text-rose-700 dark:text-rose-300">
              {quotaError}
            </div>
          )}

          {/* Input Bar with Mic & Send */}
          <form
            onSubmit={handleSend}
            className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
          >
            <button
              type="button"
              disabled={remainingToday <= 0}
              onClick={handleToggleMic}
              className={`p-2.5 rounded-xl border transition-colors shrink-0 disabled:opacity-40 ${
                isListening
                  ? 'bg-rose-600 border-rose-600 text-white animate-pulse'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600'
              }`}
              title={isListening ? 'Stop Listening' : 'Speak to Type'}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <input
              type="text"
              value={input}
              disabled={remainingToday <= 0}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                remainingToday <= 0
                  ? 'Daily limit (5/5 questions) reached for today'
                  : isListening
                  ? 'Listening...'
                  : `Ask in ${language} (${remainingToday} left today)...`
              }
              className="flex-1 h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            />

            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || sending || remainingToday <= 0}
              className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

