'use client';

import { SessionProfileProvider } from "@/lib/contexts/SessionProfileContext";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProfileProvider>
      {children}
    </SessionProfileProvider>
  );
} 