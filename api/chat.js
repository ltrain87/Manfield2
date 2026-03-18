export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Anthropic API key not configured' });

  const { message, goal, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  try {
    // ── STEP 1: Full unrestricted AI answer ──
    const answerRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: `You are Manfield AI — an exceptionally knowledgeable assistant inside a personal knowledge feed app.

The user's current goal is: "${goal || 'self improvement'}".

Answer ANYTHING with full depth and intelligence. You are like the smartest, most helpful friend someone could have. Cover any topic: general knowledge, history, science, math, philosophy, coding, design, business, investing, fitness, nutrition, current events, personal advice, creative writing, debates, opinions, hypotheticals — everything.

Your personality:
- Direct, confident, genuinely helpful. Never hedge unnecessarily.
- Give real opinions when asked. Don't be wishy-washy.
- Concise for simple questions, thorough when depth is needed.
- Honest when you don't know something.
- You know you're inside a media app, so occasionally mention "I'm pulling content on this into your feed" when relevant.

Never refuse reasonable questions. Never say you can't help with something unless it's genuinely harmful.`,
        messages: [
          ...history.slice(-10),
          { role: 'user', content: message }
        ]
      })
    });

    const answerData = await answerRes.json();
    if (answerData.error) return res.status(500).json({ error: answerData.error.message });
    const reply = answerData.content?.[0]?.text?.trim() || 'Something went wrong. Please try again.';

    // ── STEP 2: Silently extract feed topic + goal change ──
    const extractRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system: `Extract metadata from a user message for a content feed app. Respond ONLY with valid JSON, no markdown, no explanation.

Rules:
- updateFeed: true if the message mentions ANY topic worth showing media about. false ONLY for pure greetings like "hi", "thanks", "yes", "no", "ok".
- searchTopic: most specific searchable version of the topic mentioned. Examples: "politics" → "US politics analysis", "cooking" → "cooking recipes techniques", "HVAC" → "HVAC technician career", "I want to learn Python" → "Python programming tutorial". Return null only if truly no topic.
- newGoal: ONLY set this if user explicitly says they want to BECOME something or CHANGE their goal. Examples that trigger it: "I want to be an HVAC technician", "change my goal to nurse", "I want to become a chef". Do NOT set for general curiosity questions. Extract the career/goal exactly as stated.

Return exactly: {"updateFeed": bool, "searchTopic": string|null, "newGoal": string|null}`,
        messages: [{ role: 'user', content: message }]
      })
    });

    let meta = { updateFeed: true, searchTopic: message.slice(0, 60), newGoal: null };
    try {
      const raw = extractRes.ok ? (await extractRes.json()).content?.[0]?.text?.trim() : '{}';
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      meta = {
        updateFeed: parsed.updateFeed !== false,
        searchTopic: parsed.searchTopic || message.slice(0, 60),
        newGoal: parsed.newGoal || null
      };
    } catch (e) { /* use defaults */ }

    res.status(200).json({ reply, updateFeed: meta.updateFeed, newGoal: meta.newGoal, searchTopic: meta.searchTopic });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
