"use client";

import { FormEvent, useEffect, useState } from "react";

type User = {
  id: string;
  phone: string;
  role: string;
};

type Profile = {
  id: string;
  userId: string;
  fullName: string | null;
  language: string | null;
};

export default function CollectorProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("kabadiwala_user");

    if (!storedUser) {
      setError("Please log in before editing your profile.");
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as User;
      setUser(parsedUser);

      if (parsedUser.role !== "COLLECTOR") {
        setError("This profile page is currently for collector accounts.");
        setLoading(false);
        return;
      }

      fetch(`/api/profile?userId=${encodeURIComponent(parsedUser.id)}`)
        .then(async (response) => {
          const data = await response.json();

          if (!response.ok || !data.ok) {
            throw new Error(data.error || "Unable to load profile.");
          }

          const existingProfile = data.profile as Profile | null;

          setFullName(existingProfile?.fullName ?? "");
          setLanguage(existingProfile?.language ?? "");
        })
        .catch((err) => {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load profile.",
          );
        })
        .finally(() => {
          setLoading(false);
        });
    } catch {
      setError("Your local session could not be read.");
      setLoading(false);
    }
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setError("Please log in before saving your profile.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          fullName,
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Unable to save profile.");
      }

      setMessage("Profile saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <div className="mx-auto max-w-2xl">
          <p className="text-slate-500">Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <p className="text-lg font-medium text-emerald-700">
          Kabadiwala Connect
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight">
          My Profile
        </h1>

        <p className="mt-3 text-lg text-slate-600">
          Keep your collector information up to date.
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
            {message}
          </div>
        )}

        {user && (
          <form
            onSubmit={saveProfile}
            className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div>
              <label
                htmlFor="phone"
                className="text-sm font-medium text-slate-700"
              >
                Mobile number
              </label>

              <input
                id="phone"
                value={user.phone}
                disabled
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600"
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor="fullName"
                className="text-sm font-medium text-slate-700"
              >
                Full name
              </label>

              <input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                maxLength={100}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-600"
                placeholder="Enter your name"
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor="language"
                className="text-sm font-medium text-slate-700"
              >
                Preferred language
              </label>

              <select
                id="language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-600"
              >
                <option value="">Select language</option>
                <option value="Hindi">Hindi</option>
                <option value="Marathi">Marathi</option>
                <option value="English">English</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-6 w-full rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
