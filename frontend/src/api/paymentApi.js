import apiClient from "./apiClient";

const createCheckoutSession = (planId) => {
  return apiClient.post("/payment/create-checkout-session", { planId });
};

const verifyPayment = (sessionId, planId) => {
  return apiClient.post("/payment/verify-payment", { sessionId, planId });
};

export const paymentApi = {
  createCheckoutSession,
  verifyPayment,
};