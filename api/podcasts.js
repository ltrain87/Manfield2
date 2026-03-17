export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { goal = 'software engineer', signals = '' } = req.query;
  const g = goal.toLowerCase();
  const topSignals = signals ? signals.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];

  // Full podcast library mapped to topic keywords
  const topicMap = [
    {
      keys: ['software','engineer','coder','developer','programmer','coding','javascript','python','react','tech'],
      podcasts: [
        { title: 'Lex Fridman Podcast', host: 'Lex Fridman', desc: 'Deep conversations with top engineers, scientists and AI researchers', topic: 'Tech & AI', spotifyUrl: 'https://open.spotify.com/show/2MAi0BvDc6GTFvKFPXnkCL' },
        { title: 'Software Engineering Daily', host: 'Jeff Meyerson', desc: 'Technical interviews about the software topics engineers need to know', topic: 'Engineering', spotifyUrl: 'https://open.spotify.com/show/6UnmFckwX19aIlnu4qmTdB' },
        { title: 'The Changelog', host: 'Adam Stacoviak', desc: 'Conversations with the hackers, leaders and innovators of software', topic: 'Dev Culture', spotifyUrl: 'https://open.spotify.com/show/5bBki72YeKSLUqyD94qsuJ' },
        { title: 'Syntax FM', host: 'Wes Bos & Scott Tolinski', desc: 'A tasty treats podcast for web developers covering JavaScript, CSS, Node and more', topic: 'Web Dev', spotifyUrl: 'https://open.spotify.com/show/4kYCRYJ3yK5DQbP5tbfZby' },
      ]
    },
    {
      keys: ['entrepreneur','startup','business','founder','company','venture','build'],
      podcasts: [
        { title: 'How I Built This', host: 'Guy Raz', desc: 'The stories behind the world\'s most iconic companies', topic: 'Founders', spotifyUrl: 'https://open.spotify.com/show/6E709HRH7XaiZrMfgtNCun' },
        { title: 'My First Million', host: 'Sam Parr & Shaan Puri', desc: 'Brainstorming business ideas and uncovering opportunities hiding in plain sight', topic: 'Ideas', spotifyUrl: 'https://open.spotify.com/show/55s0tNyHQsqhLhPiHdENRE' },
        { title: 'Masters of Scale', host: 'Reid Hoffman', desc: 'LinkedIn\'s co-founder interviews iconic founders on how they scaled', topic: 'Scaling', spotifyUrl: 'https://open.spotify.com/show/1bJRgaFZHuzifad4IAApFR' },
        { title: 'The Tim Ferriss Show', host: 'Tim Ferriss', desc: 'World-class performers share their tools, tactics and routines', topic: 'Performance', spotifyUrl: 'https://open.spotify.com/show/5qSUyCrk9KR69lEiXbjwXM' },
      ]
    },
    {
      keys: ['investor','invest','finance','trading','stock','fund','portfolio','wealth','money','crypto'],
      podcasts: [
        { title: 'We Study Billionaires', host: 'The Investor\'s Podcast', desc: 'Study the financial markets and the world\'s greatest investors', topic: 'Investing', spotifyUrl: 'https://open.spotify.com/show/0wZFmHJ93GGwT1VO3PMwdD' },
        { title: 'The All-In Podcast', host: 'Chamath, Jason, Sacks & Friedberg', desc: 'Industry veterans debate business, tech, politics and capital allocation', topic: 'VC & Tech', spotifyUrl: 'https://open.spotify.com/show/2IqXAVFR4e0Bmyjsdc8QzF' },
        { title: 'Invest Like the Best', host: 'Patrick O\'Shaughnessy', desc: 'Conversations with the world\'s best investors and business builders', topic: 'Markets', spotifyUrl: 'https://open.spotify.com/show/22fi0RqfoBACCuQDv97wFO' },
        { title: 'Planet Money', host: 'NPR', desc: 'The economy explained through stories that actually make sense', topic: 'Economics', spotifyUrl: 'https://open.spotify.com/show/4FYpq3lSeQMAhqNI81O0Cn' },
      ]
    },
    {
      keys: ['designer','design','ux','ui','graphic','brand','creative','figma','visual'],
      podcasts: [
        { title: 'Design Matters', host: 'Debbie Millman', desc: 'The world\'s longest-running design podcast — conversations with legendary designers', topic: 'Design Culture', spotifyUrl: 'https://open.spotify.com/show/0PovXGNSR2G9lHqzC3fZoH' },
        { title: 'The Futur', host: 'Chris Do', desc: 'Business of design, pricing creative work, and building a design career', topic: 'Business', spotifyUrl: 'https://open.spotify.com/show/4TkRkHh3FqOBbgwdpXDUeG' },
        { title: 'UI Breakfast', host: 'Jane Portman', desc: 'UI/UX design and product strategy for designers and entrepreneurs', topic: 'UI/UX', spotifyUrl: 'https://open.spotify.com/show/5WMHXRoJGFJeB3hzqFOiql' },
        { title: 'How I Built This', host: 'Guy Raz', desc: 'Stories behind iconic brands — essential for understanding design that works', topic: 'Brand', spotifyUrl: 'https://open.spotify.com/show/6E709HRH7XaiZrMfgtNCun' },
      ]
    },
    {
      keys: ['fitness','gym','workout','bodybuilding','health','nutrition','training','coach','exercise'],
      podcasts: [
        { title: 'Huberman Lab', host: 'Andrew Huberman', desc: 'Science-based tools for sleep, exercise, nutrition and mental performance', topic: 'Science', spotifyUrl: 'https://open.spotify.com/show/79CkJF3UJTHFV8Dse3Oy0P' },
        { title: 'Mind Pump', host: 'Sal, Adam & Justin', desc: 'Authentic and unfiltered conversations about fitness, health and building muscle', topic: 'Training', spotifyUrl: 'https://open.spotify.com/show/1XHSABGCHktbFRHDwFJnNp' },
        { title: 'The Model Health Show', host: 'Shawn Stevenson', desc: 'America\'s #1 health podcast — nutrition, fitness, sleep and mindset', topic: 'Health', spotifyUrl: 'https://open.spotify.com/show/6v9bM0UlrPDGm5xsxZBaqk' },
        { title: 'The Rich Roll Podcast', host: 'Rich Roll', desc: 'Conversations about endurance, nutrition, mental fitness and human potential', topic: 'Endurance', spotifyUrl: 'https://open.spotify.com/show/2de3kmJzaB5TULLvFlvGlZ' },
      ]
    },
    {
      keys: ['content','creator','youtube','tiktok','instagram','influencer','media','viral','audience'],
      podcasts: [
        { title: 'Creator Science', host: 'Jay Clouse', desc: 'Experiments and insights for creators building their creative business', topic: 'Creator Biz', spotifyUrl: 'https://open.spotify.com/show/7eFPIH0OilIMPuwi7MYbrl' },
        { title: 'The Colin and Samir Show', host: 'Colin & Samir', desc: 'The business of being a creator — strategy, money, and what it really takes', topic: 'Strategy', spotifyUrl: 'https://open.spotify.com/show/5517TKJxLfIJgrAXOdEfEB' },
        { title: 'GaryVee Audio Experience', host: 'Gary Vaynerchuk', desc: 'Marketing, social media and building an audience from scratch', topic: 'Marketing', spotifyUrl: 'https://open.spotify.com/show/6lXyUPlvsMyT1dRFCwvi6Q' },
        { title: 'The Tim Ferriss Show', host: 'Tim Ferriss', desc: 'World-class creators share their workflows and creative process', topic: 'Process', spotifyUrl: 'https://open.spotify.com/show/5qSUyCrk9KR69lEiXbjwXM' },
      ]
    },
    {
      keys: ['mindset','motivation','self','discipline','habit','productivity','focus','growth','mental'],
      podcasts: [
        { title: 'Huberman Lab', host: 'Andrew Huberman', desc: 'Science-backed tools for mental performance, focus and discipline', topic: 'Mind', spotifyUrl: 'https://open.spotify.com/show/79CkJF3UJTHFV8Dse3Oy0P' },
        { title: 'The Tim Ferriss Show', host: 'Tim Ferriss', desc: 'World-class performers share the habits and routines behind their success', topic: 'Habits', spotifyUrl: 'https://open.spotify.com/show/5qSUyCrk9KR69lEiXbjwXM' },
        { title: 'Diary of a CEO', host: 'Steven Bartlett', desc: 'Raw and honest conversations about success, failure and building something great', topic: 'Growth', spotifyUrl: 'https://open.spotify.com/show/7iQXmUT7XGuZSzAMjoNWlX' },
        { title: 'On Purpose', host: 'Jay Shetty', desc: 'Ancient wisdom meets modern science on habits, mindset and purpose', topic: 'Purpose', spotifyUrl: 'https://open.spotify.com/show/5EqqB52m2bsr4k1Ii7sStc' },
      ]
    },
    {
      keys: ['data','science','machine learning','artificial intelligence','ai','analytics','deep learning','model'],
      podcasts: [
        { title: 'Lex Fridman Podcast', host: 'Lex Fridman', desc: 'Deep conversations with top AI researchers and scientists', topic: 'AI & Science', spotifyUrl: 'https://open.spotify.com/show/2MAi0BvDc6GTFvKFPXnkCL' },
        { title: 'Data Skeptic', host: 'Kyle Polich', desc: 'Data science, machine learning and AI explained for practitioners', topic: 'Data Science', spotifyUrl: 'https://open.spotify.com/show/1BZN7H3ikovSejhwQTzNm4' },
        { title: 'TWIML AI Podcast', host: 'Sam Charrington', desc: 'Machine learning and AI interviews with the researchers building the future', topic: 'ML Research', spotifyUrl: 'https://open.spotify.com/show/2sp5EL7s7EqxttxwwoJ3i7' },
        { title: 'The All-In Podcast', host: 'Chamath, Jason, Sacks & Friedberg', desc: 'Where tech, AI and venture capital intersect — raw and unfiltered', topic: 'Tech & AI', spotifyUrl: 'https://open.spotify.com/show/2IqXAVFR4e0Bmyjsdc8QzF' },
      ]
    },
    {
      keys: ['music','producer','musician','artist','rapper','singer','songwriter','audio','beat','record'],
      podcasts: [
        { title: 'Dissect', host: 'Cole Cuchna', desc: 'Long-form musical analysis of iconic albums — season by season', topic: 'Music Analysis', spotifyUrl: 'https://open.spotify.com/show/1DpnBGoMXoFKJmKOdROwxL' },
        { title: 'Song Exploder', host: 'Hrishikesh Hirway', desc: 'Musicians take apart their songs piece by piece and tell the stories behind them', topic: 'Songwriting', spotifyUrl: 'https://open.spotify.com/show/4PBDpNvVBdwM0uKqQXHNGi' },
        { title: 'The Tim Ferriss Show', host: 'Tim Ferriss', desc: 'Creative process and career advice from world-class musicians and artists', topic: 'Creative Process', spotifyUrl: 'https://open.spotify.com/show/5qSUyCrk9KR69lEiXbjwXM' },
        { title: 'Mogul: The Life of Chris Lighty', host: 'Gimlet', desc: 'The untold story of one of hip-hop\'s most influential managers', topic: 'Music Business', spotifyUrl: 'https://open.spotify.com/show/2FLTpJQoFxMBEBqjCCMhFB' },
      ]
    },
    {
      keys: ['sales','marketing','advertising','ecommerce','brand','growth','customer','revenue'],
      podcasts: [
        { title: 'Marketing School', host: 'Neil Patel & Eric Siu', desc: 'Daily 10-minute marketing lessons from two of the world\'s top marketers', topic: 'Marketing', spotifyUrl: 'https://open.spotify.com/show/3dMnQeR8k7HQjXXQUXcPdi' },
        { title: 'My First Million', host: 'Sam Parr & Shaan Puri', desc: 'Business ideas, growth strategies and monetization from operators who\'ve done it', topic: 'Growth', spotifyUrl: 'https://open.spotify.com/show/55s0tNyHQsqhLhPiHdENRE' },
        { title: 'GaryVee Audio Experience', host: 'Gary Vaynerchuk', desc: 'Marketing, social media, brand building and going all in on your business', topic: 'Brand', spotifyUrl: 'https://open.spotify.com/show/6lXyUPlvsMyT1dRFCwvi6Q' },
        { title: 'The Diary of a CEO', host: 'Steven Bartlett', desc: 'Business growth, brand building and what it takes to win in the market', topic: 'Business', spotifyUrl: 'https://open.spotify.com/show/7iQXmUT7XGuZSzAMjoNWlX' },
      ]
    },
  ];

  // Default fallback
  const defaultPodcasts = [
    { title: 'Huberman Lab', host: 'Andrew Huberman', desc: 'Science-based tools for everyday life and peak performance', topic: 'Performance', spotifyUrl: 'https://open.spotify.com/show/79CkJF3UJTHFV8Dse3Oy0P' },
    { title: 'The Tim Ferriss Show', host: 'Tim Ferriss', desc: 'World-class performers share their tools, tactics and routines', topic: 'Productivity', spotifyUrl: 'https://open.spotify.com/show/5qSUyCrk9KR69lEiXbjwXM' },
    { title: 'Lex Fridman Podcast', host: 'Lex Fridman', desc: 'Conversations about science, technology, history and intelligence', topic: 'Ideas', spotifyUrl: 'https://open.spotify.com/show/2MAi0BvDc6GTFvKFPXnkCL' },
    { title: 'Diary of a CEO', host: 'Steven Bartlett', desc: 'Raw conversations about success, failure and what it really takes', topic: 'Growth', spotifyUrl: 'https://open.spotify.com/show/7iQXmUT7XGuZSzAMjoNWlX' },
  ];

  // Score each topic set
  const scored = topicMap.map(topic => {
    let score = 0;
    for (const key of topic.keys) {
      if (g.includes(key)) score += 3;
    }
    for (const sig of topSignals) {
      for (const key of topic.keys) {
        if (sig.includes(key) || key.includes(sig)) score += 1;
      }
    }
    return { ...topic, score };
  }).sort((a, b) => b.score - a.score);

  const primary = scored[0]?.score > 0 ? scored[0] : null;
  const secondary = scored[1]?.score > 1 ? scored[1] : null;

  let podcasts;
  if (!primary) {
    podcasts = defaultPodcasts;
  } else if (secondary && secondary.score >= 2) {
    // Blend: 3 from primary + 1 from secondary
    podcasts = [...primary.podcasts.slice(0, 3), secondary.podcasts[0]];
  } else {
    podcasts = primary.podcasts;
  }

  res.status(200).json({ podcasts });
}
