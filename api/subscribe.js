import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Auth required' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Invalid token' });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(500).json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY to Vercel.' });

  const { action } = req.body;

  if (action === 'create_checkout') {
    try {
      const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single();

      // Create or get Stripe customer
      let customerId = profile?.stripe_customer_id;
      if (!customerId) {
        const custRes = await fetch('https://api.stripe.com/v1/customers', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ email: user.email, 'metadata[user_id]': user.id }),
        });
        const cust = await custRes.json();
        customerId = cust.id;
        await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
      }

      const origin = req.headers.origin || 'https://manfield.vercel.app';
      const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          customer: customerId,
          mode: 'subscription',
          'line_items[0][price]': process.env.STRIPE_PRICE_ID_PRO || '',
          'line_items[0][quantity]': '1',
          success_url: `${origin}/?upgraded=1`,
          cancel_url: `${origin}/`,
          allow_promotion_codes: 'true',
          'subscription_data[metadata][user_id]': user.id,
        }),
      });
      const session = await sessionRes.json();
      if (session.error) return res.status(500).json({ error: session.error.message });
      return res.status(200).json({ url: session.url });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (action === 'portal') {
    const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
    if (!profile?.stripe_customer_id) return res.status(400).json({ error: 'No subscription found' });
    const origin = req.headers.origin || 'https://manfield.vercel.app';
    const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ customer: profile.stripe_customer_id, return_url: origin }),
    });
    const portal = await portalRes.json();
    return res.status(200).json({ url: portal.url });
  }

  res.status(400).json({ error: 'Unknown action' });
}
