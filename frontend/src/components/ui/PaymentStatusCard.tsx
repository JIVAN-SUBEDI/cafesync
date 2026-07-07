"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PaymentStatusCardProps = {
  type?: "success" | "failed";
  title: string;
  message: string;
  redirectTo: string;
  redirectLabel: string;
  countdownStart?: number;
};

export default function PaymentStatusCard({
  type = "success",
  title,
  message,
  redirectTo,
  redirectLabel,
  countdownStart = 5,
}: PaymentStatusCardProps) {
  const router = useRouter();
  const [seconds, setSeconds] = useState<number>(countdownStart);

  useEffect(() => {
    if (seconds <= 0) {
      router.push(redirectTo);
      return;
    }

    const timer = setTimeout(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds, router, redirectTo]);

  const isSuccess = type === "success";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xl">
        <div
          className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full text-4xl font-bold text-white ${
            isSuccess ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {isSuccess ? "✓" : "✕"}
        </div>

        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 whitespace-pre-line">
          {message}
        </p>

        <div className="mt-6 rounded-xl bg-slate-100 px-4 py-3">
          <p className="text-sm text-slate-700">
            Redirecting in{" "}
            <span className="font-bold text-slate-900">{seconds}</span> second
            {seconds !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => router.push(redirectTo)}
            className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
              isSuccess
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {redirectLabel}
          </button>

          <button
            onClick={() => router.back()}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}