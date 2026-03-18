export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { goal = 'self improvement', signals = '' } = req.query;
  const g = goal.toLowerCase();
  const topSignals = signals ? signals.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];

  // ── Subreddit knowledge base — covers careers AND any topic ──
  const subredditMap = [
    { keys: ['software','engineer','coding','developer','programmer','javascript','python','react','typescript','web dev'], subs: ['cscareerquestions','learnprogramming','webdev','programming','javascript','Python','reactjs','node'] },
    { keys: ['entrepreneur','startup','business','founder','hustle','side project'], subs: ['entrepreneur','startups','smallbusiness','SideProject','sweatystartup','juststart'] },
    { keys: ['design','designer','ui','ux','figma','brand','graphic','typography'], subs: ['design','graphic_design','UI_Design','web_design','branding','userexperience'] },
    { keys: ['invest','stock','finance','trading','money','crypto','wealth','portfolio'], subs: ['investing','personalfinance','stocks','financialindependence','wallstreetbets','CryptoCurrency'] },
    { keys: ['fitness','gym','workout','health','bodybuilding','nutrition','muscle','weight'], subs: ['fitness','bodybuilding','loseit','gainit','nutrition','running','xxfitness'] },
    { keys: ['content','creator','youtube','tiktok','influencer','audience','grow'], subs: ['NewTubers','juststart','content_marketing','socialmedia','youtubers','Twitch'] },
    { keys: ['data','science','machine learning','ai','analytics','deep learning','llm'], subs: ['datascience','MachineLearning','artificial','learnmachinelearning','ChatGPT','OpenAI'] },
    { keys: ['music','producer','musician','artist','rapper','audio','beat','record'], subs: ['WeAreTheMusicMakers','edmproduction','hiphopheads','weddingbands','musicproduction','trapproduction'] },
    { keys: ['fashion','style','clothes','outfit','dress','wear','jeans','sneakers','streetwear'], subs: ['malefashionadvice','femalefashionadvice','streetwear','sneakers','frugalmalefashion','FashionReps'] },
    { keys: ['food','cook','recipe','meal','eat','kitchen','bake','chef'], subs: ['food','recipes','Cooking','MealPrepSunday','AskCulinary','Baking'] },
    { keys: ['travel','trip','explore','country','city','adventure','backpack'], subs: ['travel','solotravel','digitalnomad','backpacking','shoestring','travel_advice'] },
    { keys: ['game','gaming','esport','stream','minecraft','fps','rpg'], subs: ['gaming','pcgaming','Competitiveoverwatch','leagueoflegends','truegaming','gamedev'] },
    { keys: ['car','auto','vehicle','drive','mechanic','truck','motorcycle','racing'], subs: ['cars','Cartalk','Justrolledintotheshop','mechanics','motorcycles','racing'] },
    { keys: ['photo','photography','camera','portrait','landscape','shoot','lens'], subs: ['photography','photocritique','analog','AskPhotography','portraits','astrophotography'] },
    { keys: ['movie','film','cinema','actor','director','series','tv show','anime'], subs: ['movies','TrueFilm','television','anime','criterion','Filmmakers'] },
    { keys: ['mental','anxiety','depression','therapy','mindfulness','wellbeing','psychology'], subs: ['mentalhealth','anxiety','depression','therapy','Mindfulness','psychology'] },
    { keys: ['art','illustrat','draw','paint','sketch','comic','animation'], subs: ['Art','learnart','ArtFundamentals','illustration','comics','animation'] },
    { keys: ['write','author','writing','novelist','blog','copy','content'], subs: ['writing','worldbuilding','screenwriting','blogging','copywriting','freelanceWriters'] },
    { keys: ['real estate','property','housing','rent','mortgage','invest'], subs: ['realestate','FirstTimeHomeBuyer','landlord','realestateinvesting','REBubble'] },
    { keys: ['sport','basketball','football','soccer','nba','nfl','athlete','train'], subs: ['nba','nfl','soccer','sports','AdvancedFitness','athletictraining'] },
    { keys: ['hvac','plumber','electrician','contractor','trades','mechanic','construction'], subs: ['HVAC','Plumbing','electricians','Construction','Welding','DIY'] },
    { keys: ['nurse','doctor','medical','healthcare','pharmacy','therapy'], subs: ['nursing','medicine','medicalschool','healthcareworkers','pharmacy'] },
    { keys: ['mindset','motivation','habit','discipline','productivity','self','growth'], subs: ['selfimprovement','productivity','getdisciplined','DecidingToBeBetter','NoFap','stoicism'] },
  ];

  // Score topics
  const scored = subredditMap.map(topic => {
    let score = 0;
    for (const k of topic.keys) { if (g.includes(k)) score += 3; }
    for (const sig of topSignals) {
      for (const k of topic.keys) { if (sig.includes(k) || k.includes(sig)) score += 1; }
    }
    return { ...topic, score };
  }).sort((a, b) => b.score - a.score);

  // Build subreddit list — primary + secondary + general
  let subs;
  if (scored[0]?.score > 0) {
    subs = [...scored[0].subs.slice(0, 3)];
    if (scored[1]?.score >= 2) subs.push(...scored[1].subs.slice(0, 2));
    if (subs.length < 5) subs.push('selfimprovement', 'productivity');
    subs = subs.slice(0, 6);
  } else {
    // Catch-all: use Reddit search API for the goal/topic directly
    try {
      const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(g)}&sort=hot&limit=25&type=link`;
      const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': 'Manfield/1.0' } });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const posts = (searchData?.data?.children || [])
          .map(c => c.data)
          .filter(p => p && !p.stickied && p.title && p.score > 5)
          .map(p => ({
            id: p.id, title: p.title, subreddit: p.subreddit,
            score: p.score || 0, comments: p.num_comments || 0,
            url: `https://reddit.com${p.permalink}`, selftext: (p.selftext||'').slice(0,120),
          }));
        return res.status(200).json({ posts: posts.slice(0, 25) });
      }
    } catch(e) {}
    subs = ['selfimprovement','productivity','getdisciplined','motivation','AskReddit'];
  }

  // Fetch multiple subreddits in parallel with more posts each
  try {
    const results = await Promise.allSettled(
      subs.map(sub =>
        fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=10`, {
          headers: { 'User-Agent': 'Manfield/1.0 (knowledge feed app)' }
        }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      )
    );

    const posts = [];
    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const children = result.value?.data?.children || [];
      for (const child of children) {
        const p = child.data;
        if (!p || p.stickied || !p.title) continue;
        posts.push({
          id: p.id, title: p.title, subreddit: p.subreddit,
          score: p.score || 0, comments: p.num_comments || 0,
          url: `https://reddit.com${p.permalink}`, selftext: (p.selftext||'').slice(0,120),
        });
      }
    }

    const unique = [...new Map(posts.map(p => [p.id, p])).values()]
      .sort((a, b) => b.score - a.score);

    res.status(200).json({ posts: unique.slice(0, 30) });
  } catch (err) {
    res.status(500).json({ error: err.message, posts: [] });
  }
}
