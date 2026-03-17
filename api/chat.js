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
    // Claude answers as a genuinely smart assistant with no format constraints
    const answerSystem = `You are Manfield AI — an exceptionally knowledgeable assistant embedded in a personal knowledge feed app called Manfield.

The user's current goal is: "${goal || 'self improvement'}".

You can answer ANYTHING with full depth and intelligence:
- General knowledge, history, science, math, philosophy
- Coding, design, business, investing, fitness, nutrition
- Current events and news analysis
- Personal advice and decision-making
- Creative writing, brainstorming, ideas
- Explaining complex topics simply
- Debates, opinions, hypotheticals

YOUR PERSONALITY:
- Smart, direct, and genuinely helpful — like the most knowledgeable person you know
- You don't hedge unnecessarily or add excessive disclaimers
- You give real opinions when asked
- You're concise when the question is simple, thorough when it deserves depth
- You acknowledge when you don't know something rather than making it up
- You're aware you're inside a media app — so when relevant you can mention "I'm pulling content on this into your feed"

IMPORTANT: Give your best, most complete answer. Don't truncate or oversimplify. If someone asks you to explain quantum physics, explain it properly. If they ask for advice, give real advice. If they ask about politics, give a balanced and informed take.`;

    const messages = [
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    const answerRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1000,
        system: answerSystem,
        messages
      })
    });

    const answerData = await answerRes.json();
    if (answerData.error) return res.status(500).json({ error: answerData.error.message });

    const reply = answerData.content[0].text.trim();

    // ── STEP 2: Silently extract feed topic ──
    // Separate lightweight call to determine what media to show
    // This never affects the quality of the answer above
    const extractRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 120,
        system: `You extract structured metadata from a user message for a content feed app. 
Respond ONLY with valid JSON, nothing else, no markdown.

Rules:
- updateFeed: true if the message mentions any topic, interest, or subject worth showing media about. false only for pure greetings ("hi", "thanks", "ok", "yes", "no").
- searchTopic: the most specific, searchable version of the topic. "politics" → "US politics news analysis". "cooking" → "cooking techniques recipes". "I'm bored" → null.
- newGoal: if the user explicitly says they want to become something or change their goal, extract it. Otherwise null.

Respond with exactly: {"updateFeed": bool, "searchTopic": string|null, "newGoal": string|null}`,
        messages: [{ role: 'user', content: message }]
      })
    });

    const extractData = await extractRes.json();
    let meta = { updateFeed: false, searchTopic: null, newGoal: null };

    try {
      const raw = extractData.content?.[0]?.text?.trim() || '{}';
      const clean = raw.replace(/```json|```/g, '').trim();
      meta = JSON.parse(clean);
    } catch (e) {
      // If extraction fails, still return the great answer
      meta = { updateFeed: true, searchTopic: message.slice(0, 60), newGoal: null };
    }

    res.status(200).json({
      reply,
      updateFeed: meta.updateFeed || false,
      newGoal: meta.newGoal || null,
      searchTopic: meta.searchTopic || null,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
