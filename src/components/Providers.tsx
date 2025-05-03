'use client';

import { SessionProfileProvider } from "@/lib/contexts/SessionProfileContext";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProfileProvider>
        {children}
      </SessionProfileProvider>
    </ThemeProvider>
  );
} 