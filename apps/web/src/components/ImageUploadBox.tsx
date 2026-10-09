'use client';

import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, CheckCircle2, RefreshCw, X, Link as LinkIcon, Loader2 } from 'lucide-react';

interface ImageUploadBoxProps {
  label: string;
  helperText?: string;
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: string;
  required?: boolean;
}

export function ImageUploadBox({
  label,
  helperText,
  value,
  onChange,
  aspectRatio = 'aspect-[4/5]',
  required = false,
}: ImageUploadBoxProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WEBP).');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    // 1. Leitura imediata com FileReader para prévia instantânea (0ms)
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        // Prévia instantânea imediata
        onChange(dataUrl);

        // 2. Salva fisicamente em public/uploads via /api/upload
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataUrl,
              filename: file.name,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              onChange(data.url);
            }
          }
        } catch (err) {
          console.warn('Upload salvo em base64 localmente:', err);
        } finally {
          setIsUploading(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-gold" />
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </label>

        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[9px] font-bold uppercase tracking-wider text-deep-black/60 hover:text-gold flex items-center gap-1 underline transition"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? 'Ocultar Link' : 'Colar Link/URL'}</span>
        </button>
      </div>

      {helperText && (
        <p className="text-[9px] text-deep-black/50 uppercase font-medium">{helperText}</p>
      )}

      {/* Input de arquivo invisível ativado pelo botão */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Caixa de Upload / Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed p-4 transition-all relative ${
          dragActive
            ? 'border-gold bg-gold/5'
            : value
            ? 'border-deep-black/30 bg-white'
            : 'border-deep-black/20 bg-deep-black/5 hover:border-gold'
        }`}
      >
        {value ? (
          /* Prévia da Foto com Botão de Trocar */
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className={`w-24 sm:w-28 ${aspectRatio} overflow-hidden border-2 border-deep-black bg-deep-black/10 shrink-0 relative shadow-sm`}>
              <img src={value} alt="Foto selecionada" className="w-full h-full object-cover" />
              {isUploading && (
                <div className="absolute inset-0 bg-deep-black/70 flex items-center justify-center text-gold">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left w-full">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-black uppercase tracking-wider text-deep-black">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>{isUploading ? 'Salvando foto no servidor...' : 'Foto Carregada com Sucesso'}</span>
              </div>

              <p className="text-[9px] font-mono text-deep-black/60 truncate max-w-xs">
                {value.startsWith('data:') ? 'Imagem carregada do computador (Local)' : value}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-gold" />
                  <span>Trocar Foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-3 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remover</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Estado Vazio: Botão de Selecionar Arquivo */
          <div className="text-center py-4 space-y-3">
            <div className="inline-flex p-3 bg-white border border-deep-black/20 text-gold shadow-sm">
              <Upload className="w-6 h-6 text-gold" />
            </div>

            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-widest transition inline-flex items-center gap-2 shadow-md"
              >
                <Upload className="w-4 h-4 text-gold group-hover:text-deep-black" />
                <span>ESCOLHER FOTO DO COMPUTADOR / CELULAR</span>
              </button>
              <p className="text-[10px] text-deep-black/50 uppercase font-bold mt-2">
                Ou arraste e solte o arquivo da foto aqui (JPG, PNG, WEBP)
              </p>
            </div>
          </div>
        )}

        {/* Input opcional de URL caso a Ana prefira colar link externo */}
        {showUrlInput && (
          <div className="mt-3 pt-3 border-t border-deep-black/10 space-y-1">
            <span className="text-[9px] font-black uppercase text-deep-black/70 block">
              Ou cole um link direto de foto externa (URL):
            </span>
            <input
              type="url"
              placeholder="https://images.unsplash.com/... ou https://..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full p-2.5 border border-deep-black font-mono text-xs focus:outline-none focus:border-gold"
            />
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-[10px] text-red-600 font-bold uppercase">{uploadError}</p>
      )}
    </div>
  );
}
