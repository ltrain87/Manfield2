export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { goal = 'software engineer', signals = '' } = req.query;
  const g = goal.toLowerCase();
  const topSignals = signals ? signals.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];

  const subredditMap = [
    { keys: ['software', 'engineer', 'coding', 'developer', 'programmer','javascript','python','react'], subs: ['cscareerquestions', 'learnprogramming', 'webdev', 'programming'] },
    { keys: ['entrepreneur', 'startup', 'business', 'founder'], subs: ['entrepreneur', 'startups', 'smallbusiness', 'SideProject'] },
    { keys: ['design', 'designer', 'ui', 'ux', 'figma', 'brand'], subs: ['design', 'graphic_design', 'UI_Design', 'web_design'] },
    { keys: ['invest', 'stock', 'finance', 'trading', 'money', 'crypto', 'wealth'], subs: ['investing', 'personalfinance', 'stocks', 'financialindependence'] },
    { keys: ['fitness', 'gym', 'workout', 'health', 'bodybuilding', 'nutrition'], subs: ['fitness', 'bodybuilding', 'xxfitness', 'loseit'] },
    { keys: ['content', 'creator', 'youtube', 'tiktok', 'influencer', 'audience'], subs: ['NewTubers', 'juststart', 'content_marketing', 'socialmedia'] },
    { keys: ['data', 'science', 'machine learning', 'ai', 'analytics', 'deep learning'], subs: ['datascience', 'MachineLearning', 'learnmachinelearning', 'artificial'] },
    { keys: ['music', 'producer', 'musician', 'audio', 'beat', 'rapper'], subs: ['WeAreTheMusicMakers', 'edmproduction', 'musictheory', 'hiphopheads'] },
    { keys: ['art', 'illustrat', 'draw', 'paint', 'creative'], subs: ['learnart', 'ArtFundamentals', 'digitalpainting', 'conceptart'] },
    { keys: ['write', 'author', 'writing', 'novelist', 'journalist'], subs: ['writing', 'worldbuilding', 'fantasywriters', 'screenwriting'] },
    { keys: ['mindset', 'motivation', 'habit', 'discipline', 'productivity'], subs: ['selfimprovement', 'productivity', 'getdisciplined', 'DecidingToBeBetter'] },
    { keys: ['sales', 'marketing', 'ecommerce', 'shopify', 'advertising'], subs: ['marketing', 'ecommerce', 'sales', 'bigseo'] },
  ];

  // Score each topic with signals (same algo as other APIs)
  const scored = subredditMap.map(topic => {
    let score = 0;
    for (const k of topic.keys) { if (g.includes(k)) score += 3; }
    for (const sig of topSignals) {
      for (const k of topic.keys) { if (sig.includes(k) || k.includes(sig)) score += 1; }
    }
    return { ...topic, score };
  }).sort((a, b) => b.score - a.score);

  // Primary + optional secondary blend
  let subs = ['selfimprovement', 'productivity', 'getdisciplined'];
  if (scored[0]?.score > 0) {
    subs = scored[0].subs.slice(0, 2);
    if (scored[1]?.score >= 2) {
      subs = [...subs, scored[1].subs[0]]; // blend in 1 from secondary
    } else {
      subs = [...subs, scored[0].subs[2] || 'selfimprovement'];
    }
  }

  try {
    const results = await Promise.allSettled(
      subs.slice(0, 3).map(sub =>
        fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=4`, {
          headers: { 'User-Agent': 'Manfield/1.0 (knowledge feed app)' }
        })
        .then(r => {
          if (!r.ok) throw new Error(`Reddit ${r.status}`);
          return r.json();
        })
      )
    );

    const posts = [];
    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const children = result.value?.data?.children;
      if (!children) continue;
      for (const child of children) {
        const p = child.data;
        if (!p || p.stickied || !p.title) continue;
        posts.push({
          id: p.id,
          title: p.title,
          subreddit: p.subreddit,
          score: p.score || 0,
          comments: p.num_comments || 0,
          url: `https://reddit.com${p.permalink}`,
          selftext: p.selftext ? p.selftext.slice(0, 120) : '',
        });
      }
    }

    // Sort by score, dedupe
    const unique = [...new Map(posts.map(p => [p.id, p])).values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    res.status(200).json({ posts: unique });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
