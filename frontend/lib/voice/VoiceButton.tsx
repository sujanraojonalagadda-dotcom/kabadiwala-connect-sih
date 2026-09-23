"use client";

import { useEffect, useState } from "react";

type VoiceLanguage = "English" | "Hindi" | "Marathi";

const languageMap: Record<VoiceLanguage, string> = {
  English: "en-IN",
  Hindi: "hi-IN",
  Marathi: "mr-IN",
};

type VoiceButtonProps = {
  text: string;
  language: VoiceLanguage;
  label?: string;
};

export default function VoiceButton({
  text,
  language,
  label = "🔊 Listen",
}: VoiceButtonProps) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        "speechSynthesis" in window &&
        typeof SpeechSynthesisUtterance !== "undefined",
    );
  }, []);

  function speak() {
    if (!supported || !text.trim()) return;

    window.speechSynthesis.cancel();

    const locale = languageMap[language];
    const voices = window.speechSynthesis.getVoices();
    const exactVoice = voices.find(
      (voice) => voice.lang.toLowerCase() === locale.toLowerCase(),
    );
    const languageVoice = voices.find(
      (voice) =>
        voice.lang.toLowerCase().split("-")[0] ===
        locale.toLowerCase().split("-")[0],
    );

    if (language === "Marathi" && !exactVoice && !languageVoice) {
      window.alert("Marathi voice is not available on this device.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.voice = exactVoice ?? languageVoice ?? null;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  if (!supported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={speak}
      disabled={speaking}
      aria-label={speaking ? "Speaking" : label}
      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {speaking ? "🔊 Speaking..." : label}
    </button>
  );
}
