'use client';

import React from 'react';

function renderInline(text: string): React.ReactNode[] {
  // Handle **bold**, *italic*, and `code` inline
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-slate-800 dark:text-slate-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  return /^\|?[\s:-]+\|[\s|:-]*$/.test(trimmed) && trimmed.includes('-');
}

export function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let listItems: Array<{ text: string; checked?: boolean }> = [];
  let listType: 'ul' | 'ol' | null = null;
  let tableRows: string[][] = [];

  const flushList = (keyPrefix: number) => {
    if (listItems.length === 0) return;
    if (listType === 'ol') {
      elements.push(
        <ol
          key={`ol-${keyPrefix}`}
          className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
        >
          {listItems.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {renderInline(item.text)}
            </li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul
          key={`ul-${keyPrefix}`}
          className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
        >
          {listItems.map((item, i) =>
            typeof item.checked === 'boolean' ? (
              <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                <span
                  className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    item.checked
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                  }`}
                >
                  {item.checked ? '✓' : ''}
                </span>
                <span>{renderInline(item.text)}</span>
              </li>
            ) : (
              <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>{renderInline(item.text)}</span>
              </li>
            )
          )}
        </ul>
      );
    }
    listItems = [];
    listType = null;
  };

  const flushTable = (keyPrefix: number) => {
    if (tableRows.length === 0) return;
    const header = tableRows[0];
    const body = tableRows.slice(1);
    elements.push(
      <div
        key={`tbl-${keyPrefix}`}
        className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 my-2"
      >
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              {header.map((cell, cIdx) => (
                <th
                  key={cIdx}
                  className="px-3 py-2 font-bold text-slate-900 dark:text-white whitespace-nowrap"
                >
                  {renderInline(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {body.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="px-3 py-2 text-slate-700 dark:text-slate-300 align-top leading-relaxed"
                  >
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList(idx);
      flushTable(idx);
      return;
    }

    // Detect Markdown Table lines
    if (line.includes('|') && (line.startsWith('|') || parseTableRow(line).length >= 2)) {
      flushList(idx);
      if (isTableSeparator(line)) {
        return; // skip separator row |---|---|
      }
      tableRows.push(parseTableRow(line));
      return;
    } else {
      flushTable(idx);
    }

    if (line === '---' || line === '***') {
      flushList(idx);
      elements.push(
        <hr key={`hr-${idx}`} className="border-slate-200 dark:border-slate-800 my-3" />
      );
      return;
    }

    if (line.startsWith('# ')) {
      flushList(idx);
      elements.push(
        <h1
          key={`h1-${idx}`}
          className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight pt-1"
        >
          {renderInline(line.slice(2))}
        </h1>
      );
      return;
    }

    if (line.startsWith('## ')) {
      flushList(idx);
      elements.push(
        <h2
          key={`h2-${idx}`}
          className="text-sm sm:text-base font-bold text-indigo-700 dark:text-indigo-400 pt-2"
        >
          {renderInline(line.slice(3))}
        </h2>
      );
      return;
    }

    if (line.startsWith('### ')) {
      flushList(idx);
      elements.push(
        <h3
          key={`h3-${idx}`}
          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 pt-1"
        >
          {renderInline(line.slice(4))}
        </h3>
      );
      return;
    }

    if (line.startsWith('#### ')) {
      flushList(idx);
      elements.push(
        <h4
          key={`h4-${idx}`}
          className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 pt-1"
        >
          {renderInline(line.slice(5))}
        </h4>
      );
      return;
    }

    if (line.startsWith('> ')) {
      flushList(idx);
      elements.push(
        <blockquote
          key={`bq-${idx}`}
          className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed"
        >
          {renderInline(line.slice(2))}
        </blockquote>
      );
      return;
    }

    const checkMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/);
    if (checkMatch) {
      if (listType === 'ol') flushList(idx);
      listType = 'ul';
      listItems.push({
        checked: checkMatch[1].toLowerCase() === 'x',
        text: checkMatch[2],
      });
      return;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (listType === 'ol') flushList(idx);
      listType = 'ul';
      listItems.push({ text: bulletMatch[1] });
      return;
    }

    const orderedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      if (listType === 'ul') flushList(idx);
      listType = 'ol';
      listItems.push({ text: orderedMatch[2] });
      return;
    }

    flushList(idx);
    elements.push(
      <p key={`p-${idx}`} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {renderInline(line)}
      </p>
    );
  });

  flushList(lines.length);
  flushTable(lines.length);

  return <div className="space-y-2.5">{elements}</div>;
}
