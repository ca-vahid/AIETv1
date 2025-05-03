"use client";
import { useEffect } from "react";

/**
 * ThemeScript runs once on mount (client) to ensure the correct `html` class is set
 * before React hydration. It mirrors the logic of ThemeProvider but only sets class.
 */
export default function ThemeScript() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("theme");

    // Default to light if no stored preference exists.
    const theme = stored === "light" || stored === "dark" ? stored : "light";

    document.documentElement.classList.add(theme);
  }, []);

  return null;
} 