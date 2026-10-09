'use client';

import React from 'react';
import { LanguageProvider } from '../context/LanguageContext';
import { StoreSettingsProvider } from '../context/StoreSettingsContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreSettingsProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </StoreSettingsProvider>
  );
}
