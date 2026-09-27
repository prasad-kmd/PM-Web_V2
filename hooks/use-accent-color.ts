"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  ACCENT_CHANGE_EVENT,
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT_ID,
  getAccentColor,
  getAccentCSSVariables,
} from "@/lib/accent-colors";

function readAccentId() {
  try {
    return getAccentColor(window.localStorage.getItem(ACCENT_STORAGE_KEY)).id;
  } catch {
    return DEFAULT_ACCENT_ID;
  }
}

function subscribeAccent(onChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== ACCENT_STORAGE_KEY) return;
    applyAccent(readAccentId());
    onChange();
  };

  window.addEventListener(ACCENT_CHANGE_EVENT, onChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(ACCENT_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function applyAccent(id: string) {
  const color = getAccentColor(id);
  const root = document.documentElement;
  for (const [property, value] of Object.entries(getAccentCSSVariables(color))) {
    root.style.setProperty(property, value);
  }
}

export function useAccentColor() {
  const accentId = useSyncExternalStore(
    subscribeAccent,
    readAccentId,
    () => DEFAULT_ACCENT_ID,
  );
  const accentColor = getAccentColor(accentId);

  useEffect(() => {
    applyAccent(accentId);
  }, [accentId]);

  function updateAccentColor(id: string) {
    const nextAccent = getAccentColor(id);
    applyAccent(nextAccent.id);
    try {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, nextAccent.id);
    } catch {
      /* Accent remains active for this session when storage is unavailable. */
    }
    window.dispatchEvent(new CustomEvent(ACCENT_CHANGE_EVENT));
  }

  return { accentColor, updateAccentColor };
}
