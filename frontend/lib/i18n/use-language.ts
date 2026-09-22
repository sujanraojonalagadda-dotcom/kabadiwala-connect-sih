"use client";

import { useEffect, useState } from "react";

import {
  getTranslations,
  type Language,
  type TranslationKey,
} from "./translations";

const DEFAULT_LANGUAGE: Language = "English";
const LANGUAGE_STORAGE_KEY = "kabadiwala_language";

function isLanguage(value: unknown): value is Language {
  return value === "English" || value === "Hindi" || value === "Marathi";
}

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_LANGUAGE;
    }

    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(storedLanguage)) {
      setLanguage(storedLanguage);
    }

    const storedUser = localStorage.getItem("kabadiwala_user");

    if (!storedUser) {
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as {
        id?: string;
      };

      if (!parsedUser.id) {
        return;
      }

      fetch("/api/profile")
        .then(async (response) => {
          if (!response.ok) {
            return null;
          }

          const data = await response.json();

          if (!data.ok || !data.profile) {
            return null;
          }

          return data.profile.language;
        })
        .then((value) => {
          if (isLanguage(value)) {
            setLanguage(value);
            localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
          }
        })
        .catch(() => {
          // Keep English as the safe fallback.
        });
    } catch {
      // Keep English as the safe fallback.
    }
  }, []);

  const dictionary = getTranslations(language);

  async function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);

    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: nextLanguage,
        }),
      });
    } catch {
      // Keep the local language change even if persistence is temporarily unavailable.
    }
  }

  function t(key: TranslationKey) {
    return dictionary[key];
  }

  return {
    language,
    setLanguage,
    changeLanguage,
    t,
  };
}
