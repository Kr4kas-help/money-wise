"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { emptyProfile, type Profile } from "./types";
import { FRESH_START } from "./config";

const KEY = "money-wise:v1";

type Ctx = {
  profile: Profile;
  update: (patch: Partial<Profile>) => void;
  reset: () => void;
  ready: boolean;
};

const ProfileCtx = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [ready, setReady] = useState(false);

  // Читаем сохранённые данные один раз после загрузки страницы.
  useEffect(() => {
    // Демо-режим: стираем прошлые ответы, чтобы заход начинался как первый.
    if (FRESH_START) {
      try {
        window.localStorage.removeItem(KEY);
      } catch {}
      setReady(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // Старые данные хранили одну проблему строкой: переносим в список.
        if (!Array.isArray(saved.problems)) saved.problems = saved.problem ? [saved.problem] : [];
        delete saved.problem;
        setProfile({ ...emptyProfile, ...saved });
      }
    } catch {
      // Данные повреждены или недоступны: начинаем с чистой анкеты.
    }
    setReady(true);
  }, []);

  // Сохраняем при каждом изменении, но только после первичного чтения.
  useEffect(() => {
    if (!ready || FRESH_START) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(profile));
    } catch {
      // Хранилище переполнено или отключено в браузере.
    }
  }, [profile, ready]);

  // Крупный режим для пожилых: один атрибут меняет все размеры через CSS-переменные.
  useEffect(() => {
    document.documentElement.dataset.size = profile.largeText ? "large" : "normal";
  }, [profile.largeText]);

  const update = useCallback((patch: Partial<Profile>) => {
    setProfile((p) => ({ ...p, ...patch }));
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {}
    setProfile(emptyProfile);
  }, []);

  return <ProfileCtx.Provider value={{ profile, update, reset, ready }}>{children}</ProfileCtx.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileCtx);
  if (!ctx) throw new Error("useProfile нужно вызывать внутри ProfileProvider");
  return ctx;
}
