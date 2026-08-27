'use client';

import React from 'react';
import Link from 'next/link';

export interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  subText?: string;
  isDark?: boolean;
}

export function BrandLogo({
  className = '',
  imageClassName = '',
  textClassName = '',
  showText = true,
  size = 'md',
  href,
  subText,
  isDark = false,
}: BrandLogoProps) {
  const sizeMap = {
    sm: { img: 'w-7 h-7', text: 'text-base' },
    md: { img: 'w-9 h-9', text: 'text-xl' },
    lg: { img: 'w-12 h-12', text: 'text-2xl' },
    xl: { img: 'w-16 h-16', text: 'text-3xl' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const mainTextColor = isDark
    ? 'text-white'
    : 'text-slate-900 dark:text-white';
  const accentTextColor = isDark
    ? 'text-indigo-400'
    : 'text-indigo-600 dark:text-indigo-400';
  const subTextColor = isDark
    ? 'text-slate-400'
    : 'text-slate-500';

  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <img
          src="/aaram logo.png"
          alt="Aarambh Library Logo"
          className={`object-contain rounded-lg shadow-sm ${currentSize.img} ${imageClassName}`}
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-extrabold tracking-tight flex items-center gap-1.5 ${mainTextColor} ${currentSize.text} ${textClassName}`}>
            Aarambh <span className={accentTextColor}>Library</span>
          </span>
          {subText && (
            <span className={`text-[10px] font-medium tracking-wide ${subTextColor}`}>
              {subText}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}

export default BrandLogo;
