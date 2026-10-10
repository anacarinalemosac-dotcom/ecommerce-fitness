import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16' as any,
      typescript: true,
    })
  : null;

export const isStripeConfigured = Boolean(stripeSecretKey && stripeSecretKey.startsWith('sk_'));
