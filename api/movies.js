export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { goal = 'software engineer', signals = '' } = req.query;
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'TMDB API key not configured' });

  const g = goal.toLowerCase();
  // Parse top signal topics passed from the frontend algorithm
  const topSignals = signals ? signals.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];

  // Full topic → movie map. Covers both goals AND common AI signal words
  const topicMap = [
    // Goal-based
    { keys: ['software','engineer','coder','developer','programmer','coding','javascript','python','react'],
      queries: ['silicon valley hbo','the social network','mr robot','hackers 1995','startup drama'], label: 'Tech' },
    { keys: ['entrepreneur','startup','business','founder','company','venture'],
      queries: ['the social network','wolf of wall street','the founder','billion dollar code','startup.com'], label: 'Business' },
    { keys: ['designer','design','ux','ui','graphic','brand','creative','figma'],
      queries: ['objectified documentary','abstract netflix','helvetica documentary','the first monday in may','rams documentary'], label: 'Design' },
    { keys: ['investor','invest','finance','trading','stock','hedge','fund','portfolio','wealth','money'],
      queries: ['the big short','margin call','wall street 1987','too big to fail','billions showtime'], label: 'Finance' },
    { keys: ['fitness','gym','workout','bodybuilding','health','nutrition','training','coach'],
      queries: ['pumping iron','rocky 1976','creed 2015','bigger stronger faster','icarus netflix'], label: 'Fitness' },
    { keys: ['content','creator','youtube','influencer','media','tiktok','instagram','viral'],
      queries: ['the social dilemma','ingrid goes west','eighth grade','click 2006','don\'t look up'], label: 'Creator' },
    { keys: ['data','science','machine learning','artificial intelligence','ai','analytics','deep learning'],
      queries: ['ex machina','her 2013','imitation game','alphago documentary','coded bias'], label: 'AI & Data' },
    { keys: ['music','producer','musician','artist','rapper','singer','songwriter','audio','beat'],
      queries: ['whiplash','la la land','soul pixar','sound of metal','rocketman'], label: 'Music' },
    { keys: ['writer','writing','author','journalist','book','novel','screenplay','blog'],
      queries: ['misery','adaptation','all the presidents men','spotlight','the post'], label: 'Writing' },
    { keys: ['sales','marketing','advertising','ecommerce','brand','growth','customer'],
      queries: ['jerry maguire','boiler room','the intern','moneyball','glengarry glen ross'], label: 'Sales' },
    { keys: ['law','lawyer','legal','attorney','court','justice'],
      queries: ['suits hbo','the lincoln lawyer','philadelphia','just mercy','making a murderer'], label: 'Law' },
    { keys: ['doctor','medicine','healthcare','nurse','medical','surgery'],
      queries: ['patch adams','the good doctor','grey\'s anatomy','wit 2001','the knick'], label: 'Medicine' },
    { keys: ['leadership','management','ceo','executive','team','strategy'],
      queries: ['the iron lady','moneyball','the founder','succession hbo','air 2023'], label: 'Leadership' },
    { keys: ['mindset','motivation','self improvement','discipline','habit','productivity'],
      queries: ['the pursuit of happyness','rocky','invictus','free solo','jiro dreams of sushi'], label: 'Mindset' },
    { keys: ['interview','job','hire','resume','career'],
      queries: ['the internship','office space','devil wears prada','up in the air','the proposal'], label: 'Career' },
  ];

  // Score each topic by how many signal words match
  let bestMatch = null;
  let bestScore = 0;

  for (const topic of topicMap) {
    let score = 0;
    // Check goal string
    for (const key of topic.keys) {
      if (g.includes(key)) score += 3; // goal match weighted higher
    }
    // Check algorithm signals
    for (const sig of topSignals) {
      for (const key of topic.keys) {
        if (sig.includes(key) || key.includes(sig)) score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = topic;
    }
  }

  // If signals point to a DIFFERENT topic than goal, blend both
  let searchQueries = bestMatch
    ? bestMatch.queries
    : ['pursuit of happyness','moneyball','the social network','the founder','jiro dreams of sushi'];

  // If signals strongly suggest a secondary topic, append 1-2 of those movies too
  if (topSignals.length > 0) {
    for (const topic of topicMap) {
      if (topic === bestMatch) continue;
      let sigScore = 0;
      for (const sig of topSignals) {
        for (const key of topic.keys) {
          if (sig.includes(key) || key.includes(sig)) sigScore++;
        }
      }
      if (sigScore >= 2) {
        // Blend in 1 movie from this secondary topic
        searchQueries = [...searchQueries.slice(0, 4), topic.queries[0]];
        break;
      }
    }
  }

  try {
    const results = await Promise.allSettled(
      searchQueries.slice(0, 5).map(q =>
        fetch(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&api_key=${apiKey}&language=en-US&page=1`)
          .then(r => r.json())
      )
    );

    const items = [];
    const seen = new Set();

    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      const result = r.value?.results?.[0];
      if (!result || seen.has(result.id)) continue;
      seen.add(result.id);

      const isMovie = result.media_type === 'movie' || result.title;
      const title = result.title || result.name;
      if (!title) continue;

      items.push({
        id: result.id,
        title,
        year: (result.release_date || result.first_air_date || '').slice(0, 4),
        rating: result.vote_average ? result.vote_average.toFixed(1) : 'N/A',
        overview: result.overview || '',
        poster: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : null,
        backdrop: result.backdrop_path ? `https://image.tmdb.org/t/p/w780${result.backdrop_path}` : null,
        type: isMovie ? 'Movie' : 'TV Show',
        imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(title)}`,
      });
    }

    res.status(200).json({ items, label: bestMatch?.label || 'For You' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
