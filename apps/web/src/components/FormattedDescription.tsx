'use client';

import React from 'react';

function formatInline(inlineText: string): React.ReactNode {
  if (!inlineText) return null;
  // Identifica marcações de negrito (**texto** ou __texto__)
  const parts = inlineText.split(/(\*\*.*?\*\*|__.*?__)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-bold text-deep-black">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('__') && part.endsWith('__') && part.length >= 4) {
      return (
        <strong key={idx} className="font-bold text-deep-black">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

interface FormattedDescriptionProps {
  text?: string;
  className?: string;
}

export function FormattedDescription({ text, className = '' }: FormattedDescriptionProps) {
  if (!text || typeof text !== 'string') return null;

  const rawLines = text.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = (keyPrefix: number) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${keyPrefix}`} className="space-y-1.5 my-2.5 pl-1">
          {currentList.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-xs sm:text-sm text-deep-black/90 leading-relaxed font-normal"
            >
              <span className="text-gold font-black mt-0.5 shrink-0 select-none">•</span>
              <span className="whitespace-pre-wrap">{formatInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Linha vazia: preserva parágrafo / espaçamento vertical
    if (!trimmed) {
      flushList(i);
      elements.push(<div key={`sp-${i}`} className="h-2.5" />);
      continue;
    }

    // Título H1 (# Título)
    if (trimmed.startsWith('# ')) {
      flushList(i);
      elements.push(
        <h2
          key={`h1-${i}`}
          className="text-base sm:text-lg font-black uppercase tracking-wider text-deep-black mt-4 mb-2"
        >
          {formatInline(trimmed.replace(/^#\s+/, ''))}
        </h2>
      );
      continue;
    }

    // Título H2 (## Título)
    if (trimmed.startsWith('## ')) {
      flushList(i);
      elements.push(
        <h3
          key={`h2-${i}`}
          className="text-sm sm:text-base font-black uppercase tracking-wider text-deep-black mt-3.5 mb-1.5"
        >
          {formatInline(trimmed.replace(/^##\s+/, ''))}
        </h3>
      );
      continue;
    }

    // Subtítulo H3 (### Subtítulo)
    if (trimmed.startsWith('### ')) {
      flushList(i);
      elements.push(
        <h4
          key={`h3-${i}`}
          className="text-xs sm:text-sm font-black uppercase tracking-wider text-deep-black border-l-2 border-gold pl-2.5 my-2.5"
        >
          {formatInline(trimmed.replace(/^###\s+/, ''))}
        </h4>
      );
      continue;
    }

    // Item de Lista com Marcador (- , * , • )
    if (/^[-*•]\s+/.test(trimmed)) {
      currentList.push(trimmed.replace(/^[-*•]\s+/, ''));
      continue;
    }

    // Parágrafo de texto normal: respeita quebras e múltiplos espaços
    flushList(i);
    elements.push(
      <p
        key={`p-${i}`}
        className="text-xs sm:text-sm text-deep-black/85 leading-relaxed whitespace-pre-wrap font-normal my-1"
      >
        {formatInline(line)}
      </p>
    );
  }

  flushList(rawLines.length);

  return (
    <div className={`space-y-0.5 font-normal text-deep-black/85 ${className}`}>
      {elements}
    </div>
  );
}

export default FormattedDescription;
