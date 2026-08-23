// Stripe configuration
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

export const stripe = new Stripe(stripeSecretKey, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stripe SDK types may not include all API versions
  apiVersion: '2024-12-18.acacia' as any,
  typescript: true,
});

export const STRIPE_PLANS = {
  basic: {
    name: 'Plan Básico',
    price: 29.99,
    currency: 'eur',
    interval: 'month',
    features: ['50 pacientes', '1 usuario', 'Soporte email'],
  },
  pro: {
    name: 'Plan Profesional',
    price: 79.99,
    currency: 'eur',
    interval: 'month',
    features: ['200 pacientes', '3 usuarios', 'Soporte prioritario', 'API access'],
  },
  premium: {
    name: 'Plan Premium',
    price: 149.99,
    currency: 'eur',
    interval: 'month',
    features: ['Pacientes ilimitados', 'Usuarios ilimitados', 'Soporte 24/7', 'API access', 'White label'],
  },
};

export const TRIAL_DAYS = 14;
