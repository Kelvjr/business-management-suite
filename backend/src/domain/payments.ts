import { paymentState, roundMoney } from "./money.js";

export function paymentIncrease(currentPaid: number, requestedPaid: number, total: number) {
  if (requestedPaid < currentPaid) throw new Error("Recorded payments cannot be reduced");
  paymentState(total, requestedPaid);
  return roundMoney(requestedPaid - currentPaid);
}

export function invoicePaymentStatus(paid: number, total: number) {
  return paymentState(total, paid).status;
}
