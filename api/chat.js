import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in Vercel environment variables.' });

  const { message, goal, history = [], signals = '' } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  // Load AI memory from Supabase if user is authenticated
  let persistedHistory = [];
  const token = req.headers.authorization?.replace('Bearer ', '');
  let userId = null;
  if (token && process.env.SUPABASE_URL) {
    try {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        const { data: convos } = await supabase
          .from('conversations')
          .select('role,content')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);
        if (convos?.length) persistedHistory = convos.reverse();
      }
    } catch(e) {}
  }

  // Merge: persisted memory + current session history (deduplicated)
  const fullHistory = [...persistedHistory, ...history.slice(-6)].slice(-12);

  // ── ANSWER ──
  let reply = '';
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: `You are Manfield AI — the smartest friend someone could have. You live inside a personal content feed app.

User's goals: ${goal || 'self improvement'}
Their recent interests: ${signals || 'just getting started'}

YOU CAN ANSWER ANYTHING:
- Any factual question: science, history, math, geography, current events, culture, philosophy
- Career and skills advice specific to their goals
- Personal decisions and life advice  
- Creative requests: write poems, jokes, stories, copy, scripts
- Explain complex topics simply or with depth
- Real opinions and debates
- Recommendations for anything: clothes, products, places, books, media, food
- "Show me X" or "Find me X" — respond and update their feed
- Questions about their previous conversations (you have memory)

YOUR VOICE:
- Direct, warm, confident. Like a brilliant friend — not a corporate assistant.
- Short answers for simple questions. Deep for questions that deserve it.
- Give real opinions. Don't hedge excessively.
- Never refuse reasonable requests.
- When updating the feed, say "Pulling that into your feed now" briefly.

FORMAT (plain text only):
- Short paragraphs with line breaks
- **bold** for key terms
- • for bullet lists`,
        messages: [...fullHistory, { role: 'user', content: message }]
      })
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(500).json({ error: `Anthropic API ${r.status}: ${txt.slice(0,200)}` });
    }
    const d = await r.json();
    if (d.error) return res.status(500).json({ error: `${d.error.type}: ${d.error.message}` });
    reply = d.content?.[0]?.text?.trim();
    if (!reply) return res.status(500).json({ error: 'Empty response from AI' });

  } catch (err) {
    return res.status(500).json({ error: `Network error: ${err.message}` });
  }

  // Save to Supabase memory
  if (userId && process.env.SUPABASE_URL) {
    try {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      await supabase.from('conversations').insert([
        { user_id: userId, role: 'user', content: message },
        { user_id: userId, role: 'assistant', content: reply },
      ]);
      // Keep only last 50 messages per user
      const { data: old } = await supabase.from('conversations')
        .select('id').eq('user_id', userId).order('created_at', { ascending: false }).range(50, 200);
      if (old?.length) {
        await supabase.from('conversations').delete().in('id', old.map(r => r.id));
      }
    } catch(e) {}
  }

  // ── EXTRACT FEED METADATA ──
  let meta = { updateFeed: true, searches: [message.slice(0,50)], newGoal: null, contentTypes: ['youtube','reddit','articles'], mood: 'explore' };

  try {
    const er = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: `Extract content metadata for a media feed. Return ONLY valid JSON.

- updateFeed: false only for pure chit-chat. True for everything else.
- searches: 3-5 specific search queries for great media on this topic. Varied angles.
- newGoal: only if user explicitly says they want to become something career-wise. Null otherwise.
- contentTypes: 2-3 best types: youtube, reddit, articles, movies, podcasts, tiktok, instagram
- mood: "learn" | "watch" | "explore" | "style" | "discuss"

Return: {"updateFeed":bool,"searches":string[],"newGoal":string|null,"contentTypes":string[],"mood":string}`,
        messages: [{ role: 'user', content: message }]
      })
    });

    if (er.ok) {
      const ed = await er.json();
      const raw = ed.content?.[0]?.text?.trim() || '{}';
      const parsed = JSON.parse(raw.replace(/```json|```/g,'').trim());
      meta = {
        updateFeed: parsed.updateFeed !== false,
        searches: Array.isArray(parsed.searches) && parsed.searches.length ? parsed.searches : [message.slice(0,50)],
        newGoal: parsed.newGoal || null,
        contentTypes: Array.isArray(parsed.contentTypes) ? parsed.contentTypes : ['youtube','reddit','articles'],
        mood: parsed.mood || 'explore',
      };
    }
  } catch(e) {}

  res.status(200).json({
    reply,
    updateFeed: meta.updateFeed,
    newGoal: meta.newGoal,
    searchTopic: meta.searches[0],
    searches: meta.searches,
    contentTypes: meta.contentTypes,
    mood: meta.mood,
  });
}
