export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
        {/* Brand */}
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            ♻️
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Kabadiwala Connect
          </h1>

          <p className="mt-3 text-gray-600">
            Connect with the recycling ecosystem.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Login
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Enter your mobile number to continue.
          </p>

          <form className="mt-6 space-y-5">
            {/* Mobile Number */}
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Mobile number
              </label>

              <div className="flex">
                <span className="flex items-center rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 px-4 text-gray-700">
                  +91
                </span>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter mobile number"
                  className="w-full rounded-r-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>
            </div>

            {/* Send OTP */}
            <button
              type="submit"
              className="w-full rounded-xl bg-green-700 px-6 py-3.5 font-semibold text-white transition hover:bg-green-800"
            >
              Send OTP
            </button>
          </form>

          {/* Disclaimer */}
          <p className="mt-6 text-center text-xs leading-5 text-gray-500">
            By continuing, you agree to use Kabadiwala Connect responsibly
            and provide accurate information.
          </p>
        </div>

        {/* Language / Help */}
        <div className="mt-6 flex justify-center gap-6 text-sm">
          <button
            type="button"
            className="font-medium text-green-700 hover:text-green-800"
          >
            हिंदी
          </button>

          <button
            type="button"
            className="font-medium text-green-700 hover:text-green-800"
          >
            मराठी
          </button>

          <button
            type="button"
            className="text-gray-600 hover:text-gray-900"
          >
            Help
          </button>
        </div>
      </div>
    </main>
  );
}