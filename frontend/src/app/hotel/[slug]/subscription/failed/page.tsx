// app/hotel/[slug]/subscription/failed/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { XCircle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function SubscriptionFailedPage() {
  const router = useRouter();
  const params = useParams();

  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const goToDashboard = () => {
    router.push(`/hotel/${slug}/dashboard`);
  };

  const tryAgain = () => {
    router.push(`/hotel/${slug}/subscription`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-red-100 p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-14 h-14 text-red-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Subscription Failed
        </h1>

        <p className="text-gray-600 leading-relaxed mb-8">
          Your payment could not be completed. No subscription has been activated.
          Please try again or return to your dashboard.
        </p>

        <div className="space-y-3">


          <button
            onClick={goToDashboard}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl transition"
          >
            <LayoutDashboard className="w-5 h-5" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}