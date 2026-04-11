"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/theme-store";

export function ThemeInit() {
  useEffect(() => {
    // Re-hidratar el tema desde localStorage
    const stored = localStorage.getItem("theme-storage");
    if (stored) {
      try {
        const { state } = JSON.parse(stored);
        if (state.theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch (e) {
        console.error("Error parsing theme:", e);
      }
    }
  }, []);

  return null;
}
