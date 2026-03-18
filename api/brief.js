import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { goal = '', signals = '' } = req.query;

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Get user if authenticated
  let userId = null;
  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) userId = user.id;
  }

  // Check if we already generated today's brief
  if (userId) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await supabase.from('daily_briefs')
      .select('content').eq('user_id', userId).eq('brief_date', today).single();
    if (existing) return res.status(200).json({ brief: existing.content, cached: true });
  }

  if (!anthropicKey) return res.status(200).json({ brief: null, error: 'ANTHROPIC_API_KEY not set' });

  const topSignals = signals ? signals.split(',').slice(0, 8).join(', ') : '';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: `You create sharp, personalized daily knowledge briefs. Write like a brilliant friend texting them their morning brief — not a corporate newsletter. Be specific, insightful, and direct. No fluff.`,
        messages: [{
          role: 'user',
          content: `Generate a personalized daily brief for someone whose goal is: "${goal || 'self improvement'}".
Their recent interests: ${topSignals || 'just getting started'}.
Today's date: ${new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}.

Format exactly like this (5 items, each a single line, no bullets or numbers, use these exact emoji labels):
☀️ [Motivating insight or mindset point for today — specific to their goal]
📚 [One specific thing they should know or learn about their goal today]
💡 [A contrarian or non-obvious insight relevant to their field]
🔥 [What's trending or happening right now in their space]
🎯 [One specific action they can take today to move toward their goal]

Keep each line under 80 characters. Be sharp and specific, not generic.`
        }]
      })
    });

    const d = await r.json();
    const brief = d.content?.[0]?.text?.trim();
    if (!brief) return res.status(200).json({ brief: null });

    // Cache in DB
    if (userId) {
      await supabase.from('daily_briefs').upsert({
        user_id: userId,
        content: brief,
        brief_date: new Date().toISOString().slice(0, 10),
      });
    }

    res.status(200).json({ brief });
  } catch (err) {
    res.status(200).json({ brief: null, error: err.message });
  }
}
