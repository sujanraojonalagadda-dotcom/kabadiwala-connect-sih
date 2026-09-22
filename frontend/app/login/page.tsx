"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "COLLECTOR" | "RECYCLER";

export default function LoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [businessName, setBusinessName] = useState("");

  const [step, setStep] = useState<
    "phone" | "otp" | "role"
  >("phone");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSendOtp() {
    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setError("");
    setStep("otp");
  }

  async function handleVerifyOtp() {
    if (otp !== "123456") {
      setError("Invalid development OTP. Use 123456.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Login failed.");
      }

      /*
       * Existing account:
       * The backend already knows the user's role.
       */
      if (data.existing && data.user) {
        localStorage.setItem(
          "kabadiwala_user",
          JSON.stringify(data.user),
        );

        if (data.user.role === "COLLECTOR") {
          router.push("/collector");
        } else if (data.user.role === "RECYCLER") {
          router.push("/recycler/requests");
        } else if (data.user.role === "ADMIN") {
          router.push("/admin/verifications");
        } else {
          throw new Error("Unsupported account role.");
        }

        return;
      }

      /*
       * New account:
       * The backend has NOT created the user yet.
       * Show role selection first.
       */
      if (data.requiresRoleSelection) {
        setStep("role");
        return;
      }

      throw new Error("Unable to determine account status.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to complete login.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAccount() {
    if (!role) {
      setError("Choose whether you are a collector or recycler.");
      return;
    }

    if (role === "RECYCLER" && !businessName.trim()) {
      setError("Enter your business name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          role,
          businessName:
            role === "RECYCLER"
              ? businessName.trim()
              : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok || !data.user) {
        throw new Error(
          data.error || "Unable to create your account.",
        );
      }

      localStorage.setItem(
        "kabadiwala_user",
        JSON.stringify(data.user),
      );

      if (data.user.role === "COLLECTOR") {
        router.push("/collector");
      } else if (data.user.role === "RECYCLER") {
        router.push("/recycler/requests");
      } else {
        throw new Error("Unsupported account role.");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create your account.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleBackToPhone() {
    setStep("phone");
    setOtp("");
    setRole("");
    setBusinessName("");
    setError("");
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto flex min-h-[90vh] max-w-md items-center">
        <section className="w-full rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-bold uppercase tracking-wider text-green-700">
            Kabadiwala Connect
          </p>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            {step === "phone" && "Welcome"}
            {step === "otp" && "Verify your number"}
            {step === "role" && "Choose your role"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            {step === "phone" &&
              "Enter your mobile number to continue."}

            {step === "otp" &&
              `Enter the OTP sent to ${phone}.`}

            {step === "role" &&
              "Tell us how you will use Kabadiwala Connect."}
          </p>

          {step === "phone" && (
            <div className="mt-8">
              <label className="text-sm font-semibold text-gray-800">
                Mobile number
              </label>

              <div className="mt-2 flex">
                <span className="flex items-center rounded-l-2xl border border-r-0 border-gray-300 bg-gray-100 px-4 font-semibold text-gray-700">
                  +91
                </span>

                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value.replace(/\D/g, ""),
                    )
                  }
                  placeholder="9876543210"
                  className="w-full rounded-r-2xl border border-gray-300 bg-white px-4 py-4 text-lg outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <button
                type="button"
                onClick={handleSendOtp}
                className="mt-6 w-full rounded-2xl bg-green-700 px-6 py-4 font-bold text-white hover:bg-green-800"
              >
                Continue
              </button>
            </div>
          )}

          {step === "otp" && (
            <div className="mt-8">
              <label className="text-sm font-semibold text-gray-800">
                Development OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(event) =>
                  setOtp(
                    event.target.value.replace(/\D/g, ""),
                  )
                }
                placeholder="123456"
                className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading}
                className="mt-6 w-full rounded-2xl bg-green-700 px-6 py-4 font-bold text-white hover:bg-green-800 disabled:bg-gray-300"
              >
                {loading
                  ? "Checking..."
                  : "Verify & Continue"}
              </button>

              <button
                type="button"
                onClick={handleBackToPhone}
                className="mt-3 w-full py-3 text-sm font-semibold text-gray-600"
              >
                Change mobile number
              </button>
            </div>
          )}

          {step === "role" && (
            <div className="mt-8 space-y-4">
              <button
                type="button"
                onClick={() => {
                  setRole("COLLECTOR");
                  setBusinessName("");
                  setError("");
                }}
                className={`w-full rounded-2xl border-2 p-5 text-left transition ${
                  role === "COLLECTOR"
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <p className="text-lg font-bold text-gray-900">
                  ♻️ Collector
                </p>

                <p className="mt-1 text-sm leading-5 text-gray-600">
                  Collect recyclable materials and sell them
                  to verified recyclers.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole("RECYCLER");
                  setError("");
                }}
                className={`w-full rounded-2xl border-2 p-5 text-left transition ${
                  role === "RECYCLER"
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <p className="text-lg font-bold text-gray-900">
                  🏭 Recycler
                </p>

                <p className="mt-1 text-sm leading-5 text-gray-600">
                  Buy recyclable materials from collectors
                  through the formal recycling chain.
                </p>
              </button>

              {role === "RECYCLER" && (
                <div>
                  <label className="text-sm font-semibold text-gray-800">
                    Business name
                  </label>

                  <input
                    type="text"
                    value={businessName}
                    onChange={(event) =>
                      setBusinessName(event.target.value)
                    }
                    placeholder="GreenCycle Recycling Center"
                    className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-4 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />

                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    Recycler accounts require verification
                    before they can receive requests.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleCreateAccount}
                disabled={loading || !role}
                className="w-full rounded-2xl bg-green-700 px-6 py-4 font-bold text-white hover:bg-green-800 disabled:bg-gray-300"
              >
                {loading
                  ? "Creating account..."
                  : "Continue"}
              </button>

              <button
                type="button"
                onClick={handleBackToPhone}
                className="w-full py-3 text-sm font-semibold text-gray-600"
              >
                Start over
              </button>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
            Development login: OTP{" "}
            <strong>123456</strong>. Real SMS
            authentication will be connected before production.
          </div>
        </section>
      </div>
    </main>
  );
}