"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, FileText, LayoutDashboard } from "lucide-react";

function SubscriptionSuccessContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const invoiceId = searchParams.get("invoice_id");

  const goToDashboard = () => {
    router.push(`/hotel/${slug}/dashboard`);
  };

  const viewInvoice = () => {
    if (!invoiceId) return;

    router.push(`/hotel/${slug}/invoice?invoice_id=${invoiceId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-green-100 p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Subscription Successful
        </h1>

        <p className="text-gray-600 leading-relaxed mb-3">
          Your subscription has been activated successfully.
        </p>

        {invoiceId && (
          <p className="text-sm text-gray-500 mb-8">
            Invoice ID: <span className="font-medium">{invoiceId}</span>
          </p>
        )}

        {!invoiceId && (
          <p className="text-sm text-red-500 mb-8">
            Invoice ID was not found in the URL.
          </p>
        )}

        <div className="space-y-3">
          <button
            onClick={viewInvoice}
            disabled={!invoiceId}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition"
          >
            <FileText className="w-5 h-5" />
            View Invoice
          </button>

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

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}