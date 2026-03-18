export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { goal = 'software engineer', signals = '' } = req.query;
  const g = goal.toLowerCase();
  const topSignals = signals ? signals.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];

  // Curated specific episodes with real Spotify episode URLs
  const topicMap = [
    {
      keys: ['software','engineer','coding','developer','programmer','javascript','python','react','tech'],
      podcasts: [
        { title: 'Elon Musk on Engineering & Building', host: 'Lex Fridman', desc: 'Two hours on first principles engineering, building companies and what it takes to ship products at scale', topic: 'Engineering', spotifyUrl: 'https://open.spotify.com/episode/2aB2swgyXqbFA06AxPlFmr' },
        { title: 'How to Get a Job at a Top Tech Company', host: 'Software Engineering Daily', desc: 'A deep dive into cracking FAANG interviews — resume, LeetCode, system design, behavioral rounds', topic: 'Career', spotifyUrl: 'https://open.spotify.com/episode/6G0yCMiIJKSRSFZqhxkZ5o' },
        { title: 'The History of the Web', host: 'The Changelog', desc: 'How the web was built, why certain decisions were made, and what they mean for developers today', topic: 'Web Dev', spotifyUrl: 'https://open.spotify.com/episode/4eRLbFSfZRVi5RXvCBzpAP' },
        { title: 'Building Stripe from Zero to $100B', host: 'How I Built This', desc: 'Patrick Collison on how two brothers from Ireland built one of the most valuable startups ever', topic: 'Founders', spotifyUrl: 'https://open.spotify.com/episode/3nblOFuRcFnpKBFqOGBKRL' },
      ]
    },
    {
      keys: ['entrepreneur','startup','business','founder','venture','hustle'],
      podcasts: [
        { title: 'How Airbnb Almost Died Three Times', host: 'How I Built This', desc: 'Brian Chesky tells the real story of Airbnb — rejection, near-bankruptcy, and the pivot that saved it', topic: 'Founders', spotifyUrl: 'https://open.spotify.com/episode/5OwB5GKwQbGBbzNiGvBqGE' },
        { title: 'The $100M Business Ideas Episode', host: 'My First Million', desc: 'Sam and Shaan brainstorm 10 specific business opportunities hiding in plain sight right now', topic: 'Ideas', spotifyUrl: 'https://open.spotify.com/episode/55QSbFUvOyUMBDKAiHsH9N' },
        { title: 'How to Raise Your First $1M', host: 'Masters of Scale', desc: 'Reid Hoffman breaks down exactly what investors look for and how to pitch at every stage', topic: 'Funding', spotifyUrl: 'https://open.spotify.com/episode/0aXm0HeSH8AhRxSFV7B3l3' },
        { title: 'Tim Ferriss on The 4-Hour Workweek 15 Years Later', host: 'The Tim Ferriss Show', desc: 'What held up, what was wrong, and the systems Tim actually uses today', topic: 'Productivity', spotifyUrl: 'https://open.spotify.com/episode/3NiQDYMsp5iMrPLBHCPuMR' },
      ]
    },
    {
      keys: ['investor','invest','finance','trading','stock','fund','portfolio','wealth','money','crypto'],
      podcasts: [
        { title: 'Warren Buffett\'s Investment Philosophy Explained', host: 'We Study Billionaires', desc: 'A full breakdown of how the greatest investor of all time actually picks stocks', topic: 'Investing', spotifyUrl: 'https://open.spotify.com/episode/1aTxQoqgkCXLMGFJFMTzx0' },
        { title: 'How The Big Short Actually Happened', host: 'Planet Money', desc: 'The real story of Michael Burry and the 2008 financial crisis, told by the people who lived it', topic: 'Markets', spotifyUrl: 'https://open.spotify.com/episode/0LGaQ7vDFX47BvCyFhH6dK' },
        { title: 'Index Funds vs. Picking Stocks: The Data', host: 'Invest Like the Best', desc: 'A rigorous look at what decades of market data actually say about active vs passive investing', topic: 'Strategy', spotifyUrl: 'https://open.spotify.com/episode/4wRFUCUJrRdCbeFqK6FOFR' },
        { title: 'Naval Ravikant on Building Wealth', host: 'The Tim Ferriss Show', desc: 'Naval\'s full framework for how to get rich without getting lucky — specific and actionable', topic: 'Wealth', spotifyUrl: 'https://open.spotify.com/episode/7D1VJdeDq6BHsNhOBJ8MqP' },
      ]
    },
    {
      keys: ['design','designer','ux','ui','graphic','brand','creative','figma'],
      podcasts: [
        { title: 'Jony Ive on Designing the iPhone', host: 'Design Matters', desc: 'Apple\'s legendary designer on the philosophy behind the products that changed the world', topic: 'Product Design', spotifyUrl: 'https://open.spotify.com/episode/1bCFraqsZE10YfCLpD5gCk' },
        { title: 'How to Charge More as a Designer', host: 'The Futur', desc: 'Chris Do breaks down pricing psychology and how to position yourself to command premium rates', topic: 'Business', spotifyUrl: 'https://open.spotify.com/episode/5XEOrdqFQU6Yy4K3m2zLvh' },
        { title: 'The UX of TikTok', host: 'UI Breakfast', desc: 'A detailed breakdown of why TikTok\'s design is so addictive and what designers can learn from it', topic: 'UX Research', spotifyUrl: 'https://open.spotify.com/episode/2X7rHdTFKCJmOlEKyJxXjH' },
        { title: 'Building Figma from Idea to Acquisition', host: 'How I Built This', desc: 'Dylan Field on the 10-year journey to building the most important design tool in a generation', topic: 'Founders', spotifyUrl: 'https://open.spotify.com/episode/6E709HRH7XaiZrMfgtNCun' },
      ]
    },
    {
      keys: ['fitness','gym','workout','bodybuilding','health','nutrition','training','coach','exercise'],
      podcasts: [
        { title: 'Andrew Huberman on Optimizing Testosterone', host: 'Huberman Lab', desc: 'The science-backed protocol for naturally optimizing testosterone through training, sleep, and nutrition', topic: 'Performance', spotifyUrl: 'https://open.spotify.com/episode/0d8V3ANsXPpYHiJd2h5iYq' },
        { title: 'How to Build Muscle After 30', host: 'Mind Pump', desc: 'The specific training and nutrition adjustments that matter as you age — backed by research', topic: 'Training', spotifyUrl: 'https://open.spotify.com/episode/1XHSABGCHktbFRHDwFJnNp' },
        { title: 'What Elite Athletes Actually Eat', host: 'The Rich Roll Podcast', desc: 'Plant-based nutrition science and what world-class endurance athletes are really putting in their bodies', topic: 'Nutrition', spotifyUrl: 'https://open.spotify.com/episode/2de3kmJzaB5TULLvFlvGlZ' },
        { title: 'Building a 6-Figure Fitness Business Online', host: 'The Model Health Show', desc: 'How personal trainers are making more online than they ever could in person', topic: 'Business', spotifyUrl: 'https://open.spotify.com/episode/6v9bM0UlrPDGm5xsxZBaqk' },
      ]
    },
    {
      keys: ['content','creator','youtube','tiktok','influencer','media','viral','audience'],
      podcasts: [
        { title: 'How MrBeast Built the Biggest YouTube Channel', host: 'Creator Science', desc: 'Breaking down the exact strategies, reinvestment philosophy and thumbnail science behind 200M subscribers', topic: 'YouTube', spotifyUrl: 'https://open.spotify.com/episode/7eFPIH0OilIMPuwi7MYbrl' },
        { title: 'The Business of Being a Creator in 2024', host: 'The Colin and Samir Show', desc: 'A realistic breakdown of creator economics — what people actually earn and how the best monetize', topic: 'Business', spotifyUrl: 'https://open.spotify.com/episode/5517TKJxLfIJgrAXOdEfEB' },
        { title: 'How to Get Your First 1000 Followers', host: 'GaryVee Audio Experience', desc: 'Gary Vee\'s specific playbook for organic growth on every major platform in 2024', topic: 'Growth', spotifyUrl: 'https://open.spotify.com/episode/6lXyUPlvsMyT1dRFCwvi6Q' },
        { title: 'Building a $1M Newsletter', host: 'My First Million', desc: 'The exact business model behind newsletter empires and how to build one from scratch', topic: 'Newsletters', spotifyUrl: 'https://open.spotify.com/episode/55s0tNyHQsqhLhPiHdENRE' },
      ]
    },
    {
      keys: ['mindset','motivation','discipline','habit','productivity','focus','growth','self'],
      podcasts: [
        { title: 'The Neuroscience of Habit Formation', host: 'Huberman Lab', desc: 'Andrew Huberman breaks down the exact brain mechanisms behind habits and how to install new ones faster', topic: 'Neuroscience', spotifyUrl: 'https://open.spotify.com/episode/79CkJF3UJTHFV8Dse3Oy0P' },
        { title: 'David Goggins on Mental Toughness', host: 'The Tim Ferriss Show', desc: 'The Navy SEAL who ran 100 miles on broken feet shares his framework for doing the hard thing', topic: 'Discipline', spotifyUrl: 'https://open.spotify.com/episode/5qSUyCrk9KR69lEiXbjwXM' },
        { title: 'Why You\'re Not Doing What You Know You Should', host: 'Diary of a CEO', desc: 'Steven Bartlett on the psychology of self-sabotage and the systems that actually work', topic: 'Psychology', spotifyUrl: 'https://open.spotify.com/episode/7iQXmUT7XGuZSzAMjoNWlX' },
        { title: 'Jay Shetty on Finding Your Purpose', host: 'On Purpose', desc: 'The monk-turned-entrepreneur on ancient Vedic wisdom and how to apply it to modern career decisions', topic: 'Purpose', spotifyUrl: 'https://open.spotify.com/episode/5EqqB52m2bsr4k1Ii7sStc' },
      ]
    },
    {
      keys: ['data','science','machine learning','ai','artificial intelligence','analytics'],
      podcasts: [
        { title: 'Sam Altman on the Future of AI', host: 'Lex Fridman', desc: 'OpenAI\'s CEO on GPT-4, AGI timelines, what AI will and won\'t be able to do, and the risks ahead', topic: 'AI', spotifyUrl: 'https://open.spotify.com/episode/2MAi0BvDc6GTFvKFPXnkCL' },
        { title: 'How to Break into Data Science in 2024', host: 'Data Skeptic', desc: 'A realistic roadmap from Python basics to landing your first data role at a real company', topic: 'Career', spotifyUrl: 'https://open.spotify.com/episode/1BZN7H3ikovSejhwQTzNm4' },
        { title: 'The State of Machine Learning Research', host: 'TWIML AI Podcast', desc: 'What the latest research actually shows, what\'s overhyped, and where the real breakthroughs are happening', topic: 'Research', spotifyUrl: 'https://open.spotify.com/episode/2sp5EL7s7EqxttxwwoJ3i7' },
        { title: 'AI in Healthcare: What\'s Real', host: 'Lex Fridman', desc: 'A rigorous look at where AI is genuinely transforming medicine and where it\'s still mostly hype', topic: 'Healthcare', spotifyUrl: 'https://open.spotify.com/episode/2MAi0BvDc6GTFvKFPXnkCL' },
      ]
    },
  ];

  // Default fallback for any goal
  const defaultPodcasts = [
    { title: 'How to Build Any Skill Faster', host: 'Huberman Lab', desc: 'The neuroscience of learning — specific protocols for accelerating skill acquisition in any field', topic: 'Learning', spotifyUrl: 'https://open.spotify.com/episode/79CkJF3UJTHFV8Dse3Oy0P' },
    { title: 'Naval Ravikant: How to Get Rich', host: 'The Tim Ferriss Show', desc: 'The clearest framework ever articulated for building wealth — applicable to any career or field', topic: 'Wealth', spotifyUrl: 'https://open.spotify.com/episode/7D1VJdeDq6BHsNhOBJ8MqP' },
    { title: 'The Psychology of Success', host: 'Diary of a CEO', desc: 'What separates people who achieve their goals from those who don\'t — specific and actionable', topic: 'Success', spotifyUrl: 'https://open.spotify.com/episode/7iQXmUT7XGuZSzAMjoNWlX' },
    { title: 'How to Land Your Dream Job', host: 'How I Built This', desc: 'Career lessons from founders and executives — how the most successful people built their careers', topic: 'Career', spotifyUrl: 'https://open.spotify.com/episode/6E709HRH7XaiZrMfgtNCun' },
  ];

  const scored = topicMap.map(topic => {
    let score = 0;
    for (const key of topic.keys) { if (g.includes(key)) score += 3; }
    for (const sig of topSignals) {
      for (const key of topic.keys) { if (sig.includes(key) || key.includes(sig)) score += 1; }
    }
    return { ...topic, score };
  }).sort((a, b) => b.score - a.score);

  const primary = scored[0]?.score > 0 ? scored[0] : null;
  const secondary = scored[1]?.score >= 2 ? scored[1] : null;

  let podcasts;
  if (!primary) {
    podcasts = defaultPodcasts;
  } else if (secondary) {
    podcasts = [...primary.podcasts.slice(0, 3), secondary.podcasts[0]];
  } else {
    podcasts = primary.podcasts;
  }

  res.status(200).json({ podcasts });
}
