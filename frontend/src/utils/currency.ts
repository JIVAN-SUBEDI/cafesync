// utils/currencySymbol.ts

export const getCurrencySymbol = (currency?: string) => {
  switch ((currency || "").toLowerCase()) {
    case "npr":
      return "रु";
    case "inr":
      return "₹";
    case "usd":
      return "$";
    case "eur":
      return "€";
    case "gbp":
      return "£";
    case "aed":
      return "د.إ";
    default:
      return "$";
  }
};