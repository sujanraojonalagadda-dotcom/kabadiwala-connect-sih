"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/use-language";
import type { Language } from "@/lib/i18n/translations";

type Profile = {
  fullName: string | null;
  language: Language | null;
};

export default function CollectorProfilePage() {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile>({
    fullName: "",
    language: "English",
  });
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");

        if (!response.ok) {
          setMessage(t("authenticationRequired"));
          return;
        }

        const data = await response.json();

        if (data.ok) {
          if (data.user?.phone) {
            setPhone(data.user.phone);
          }

          if (!data.profile) {
            setLoading(false);
            return;
          }

          const savedLanguage =
            data.profile.language === "Hindi" ||
            data.profile.language === "Marathi" ||
            data.profile.language === "English"
              ? data.profile.language
              : "English";

          setProfile({
            fullName: data.profile.fullName ?? "",
            language: savedLanguage,
          });

          setLanguage(savedLanguage);
        }
      } catch {
        setMessage(t("authenticationRequired"));
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [setLanguage, t]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      localStorage.removeItem("kabadiwala_user");
      localStorage.removeItem("kabadiwala_language");
      router.replace("/login");
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          language: profile.language,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setMessage(data.error ?? t("authenticationRequired"));
        return;
      }

      setLanguage(profile.language ?? "English");
      setMessage(t("profileSaved"));
    } catch {
      setMessage(t("authenticationRequired"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">{t("loadingProfile")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6">
          <p className="text-sm font-medium text-green-700">{t("appName")}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {t("profile")}
          </h1>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <div>
              <label
                htmlFor="mobile"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                {t("mobileNumber")}
              </label>
              <input
                id="mobile"
                type="tel"
                disabled
                value={phone}
                placeholder={t("mobileNumber")}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                {t("fullName")}
              </label>
              <input
                id="fullName"
                type="text"
                value={profile.fullName ?? ""}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                placeholder={t("enterName")}
                maxLength={100}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label
                htmlFor="language"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                {t("preferredLanguage")}
              </label>
              <select
                id="language"
                value={profile.language ?? language}
                onChange={(event) => {
                  const nextLanguage = event.target.value as Language;

                  setProfile((current) => ({
                    ...current,
                    language: nextLanguage,
                  }));

                  setLanguage(nextLanguage);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-green-600"
              >
                <option value="English">{t("english")}</option>
                <option value="Hindi">{t("hindi")}</option>
                <option value="Marathi">{t("marathi")}</option>
              </select>
            </div>

            {message && (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {message}
              </p>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? t("saving") : t("saveProfile")}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 font-semibold text-red-700 transition hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
