import PaymentStatusCard from "@/components/ui/PaymentStatusCard";

type FailedPageProps = {
  searchParams?: Promise<{
    reason?: string;
  }>;
};

export default async function RegistrationFailedPage({
  searchParams,
}: FailedPageProps) {
  const params = await searchParams;
  const reason = params?.reason;

  const reasonMap: Record<string, string> = {
    payment_failed: "The payment could not be completed.",
    payment_not_completed: "The payment was not completed.",
    verification_failed: "Payment verification failed.",
    amount_mismatch: "The payment amount did not match.",
    Refunded: "The payment was refunded.",
    Expired: "The payment session expired.",
    "User canceled": "The payment was canceled by the user.",
    Pending: "The payment is still pending.",
    Initiated: "The payment was initiated but not completed yet.",
  };

  const readableReason =
    reason && reasonMap[reason]
      ? reasonMap[reason]
      : "Something went wrong with your payment.";

  const message = `${readableReason}\n\nYou will be redirected to the home page shortly.`;

  return (
    <PaymentStatusCard
      type="failed"
      title="Payment Failed"
      message={message}
      redirectTo="/"
      redirectLabel="Go to Home Now"
      countdownStart={5}
    />
  );
}