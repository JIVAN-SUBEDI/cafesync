import PaymentStatusCard from "@/components/ui/PaymentStatusCard";

type SuccessPageProps = {
  searchParams?: Promise<{
    hotel?: string;
  }>;
};

export default async function RegistrationSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const params = await searchParams;
  const hotel = params?.hotel;

  const message = hotel
    ? `Your payment was successful.\n\nHotel "${hotel}" has been created successfully.\n\nYou will be redirected to the login page shortly.`
    : `Your payment was successful.\n\nYour hotel registration has been completed.\n\nYou will be redirected to the login page shortly.`;

  return (
    <PaymentStatusCard
      type="success"
      title="Payment Successful"
      message={message}
      redirectTo="/login"
      redirectLabel="Go to Login Now"
      countdownStart={5}
    />
  );
}