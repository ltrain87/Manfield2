export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { goal = 'software engineer', signals = '' } = req.query;
  const g = goal.toLowerCase();
  const topSignals = signals ? signals.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];

  // Full topic library — each topic has TikTok searches and Instagram hashtags
  const topicLibrary = [
    {
      keys: ['software','engineer','coder','developer','programmer','coding','javascript','python','react','tech','code'],
      tiktok: [
        { topic: 'Career', title: 'Day in the Life: SWE', desc: 'Real engineers showing what the job looks like at top companies', query: 'software engineer day in life google amazon' },
        { topic: 'Learning', title: 'Learn to Code', desc: 'The fastest paths from zero to writing real code', query: 'learn to code fast beginner 2024' },
        { topic: 'Salary', title: 'SWE Salaries', desc: 'Real engineers breaking down comp, leveling and negotiation', query: 'software engineer salary negotiation tech' },
        { topic: 'Interview', title: 'Interview Prep', desc: 'Walkthroughs of real FAANG technical interview questions', query: 'coding interview prep leetcode faang' },
      ],
      instagram: [
        { topic: 'Community', title: '#SoftwareEngineer', desc: 'Engineers worldwide sharing their work and journey', tag: 'softwareengineer' },
        { topic: 'Challenge', title: '#100DaysOfCode', desc: 'Thousands documenting their daily coding journey', tag: '100daysofcode' },
        { topic: 'Lifestyle', title: '#TechLife', desc: 'What life looks like working in tech day to day', tag: 'techlife' },
        { topic: 'Tips', title: '#CodingTips', desc: 'Practical coding advice from working developers', tag: 'codingtips' },
      ]
    },
    {
      keys: ['entrepreneur','startup','business','founder','company','venture','build','hustle'],
      tiktok: [
        { topic: 'Mindset', title: 'Founder Stories', desc: 'Real founders sharing the raw truth of building a company', query: 'entrepreneur founder startup story hustle' },
        { topic: 'Revenue', title: 'First $10K', desc: 'Practical steps from zero to first real revenue online', query: 'how to make first 10k online business' },
        { topic: 'Growth', title: 'Scaling Up', desc: 'What actually changes when you go from idea to customers', query: 'scaling small business growth hacks' },
        { topic: 'Ideas', title: 'Business Ideas 2024', desc: 'Low-cost business models that are working right now', query: 'business ideas 2024 low cost high profit' },
      ],
      instagram: [
        { topic: 'Hustle', title: '#Entrepreneur', desc: 'The entrepreneur community sharing wins and lessons', tag: 'entrepreneur' },
        { topic: 'Build', title: '#StartupLife', desc: 'Behind the scenes of building companies from scratch', tag: 'startuplife' },
        { topic: 'Money', title: '#PassiveIncome', desc: 'Real strategies for building income outside a 9-5', tag: 'passiveincome' },
        { topic: 'Brand', title: '#PersonalBrand', desc: 'How to build an audience around your expertise', tag: 'personalbrand' },
      ]
    },
    {
      keys: ['investor','invest','finance','trading','stock','fund','portfolio','wealth','money','crypto','options'],
      tiktok: [
        { topic: 'Basics', title: 'Investing 101', desc: 'The fundamentals every investor needs before anything else', query: 'investing for beginners stock market 2024' },
        { topic: 'Strategy', title: 'Portfolio Building', desc: 'How to actually build and manage a long-term portfolio', query: 'investment portfolio strategy long term wealth' },
        { topic: 'Real Estate', title: 'Real Estate Investing', desc: 'How people are building wealth through property in 2024', query: 'real estate investing beginner 2024 passive income' },
        { topic: 'Wealth', title: 'Wealth Mindset', desc: 'How the wealthiest people actually think about money', query: 'wealth mindset rich habits money psychology' },
      ],
      instagram: [
        { topic: 'Markets', title: '#StockMarket', desc: 'Real-time market commentary and investment ideas', tag: 'stockmarket' },
        { topic: 'Wealth', title: '#WealthBuilding', desc: 'Strategies from people building real long-term wealth', tag: 'wealthbuilding' },
        { topic: 'RE', title: '#RealEstateInvesting', desc: 'Deals, strategies and lessons from property investors', tag: 'realestateinvesting' },
        { topic: 'Freedom', title: '#FinancialFreedom', desc: 'People who reached financial independence sharing how', tag: 'financialfreedom' },
      ]
    },
    {
      keys: ['designer','design','ux','ui','graphic','brand','creative','figma','visual','art','illustrat'],
      tiktok: [
        { topic: 'Portfolio', title: 'Get Hired as a Designer', desc: 'What actually gets you hired as a designer in 2024', query: 'designer portfolio tips get hired ui ux 2024' },
        { topic: 'Tools', title: 'Figma Tips', desc: 'Pro shortcuts and workflows that save hours every week', query: 'figma tips tricks ui design workflow 2024' },
        { topic: 'Career', title: 'Break Into UX', desc: 'Breaking into UX design from any background', query: 'ux design career switch no experience' },
        { topic: 'Process', title: 'Design Process', desc: 'How top designers go from brief to final deliverable', query: 'graphic design process client branding workflow' },
      ],
      instagram: [
        { topic: 'Work', title: '#UIDesign', desc: 'The best UI design work being made right now', tag: 'uidesign' },
        { topic: 'Type', title: '#Typography', desc: 'The art and craft of type from the world\'s best designers', tag: 'typography' },
        { topic: 'Brand', title: '#BrandIdentity', desc: 'Stunning branding projects from around the world', tag: 'brandidentity' },
        { topic: 'Motion', title: '#MotionDesign', desc: 'Animation and motion work pushing the craft forward', tag: 'motiondesign' },
      ]
    },
    {
      keys: ['fitness','gym','workout','bodybuilding','health','nutrition','training','coach','exercise','muscle','diet'],
      tiktok: [
        { topic: 'Training', title: 'Workout Science', desc: 'Evidence-based training advice that actually works', query: 'workout science gym training tips 2024' },
        { topic: 'Nutrition', title: 'Nutrition Facts', desc: 'What to actually eat to reach your fitness goals', query: 'nutrition diet fitness meal prep 2024' },
        { topic: 'Business', title: 'PT Business', desc: 'How to build a client base as a personal trainer', query: 'personal trainer business online coaching clients' },
        { topic: 'Mindset', title: 'Gym Motivation', desc: 'The mental side of building a consistent fitness habit', query: 'gym motivation discipline fitness mindset' },
      ],
      instagram: [
        { topic: 'Training', title: '#FitnessMotivation', desc: 'Workouts, transformations and training inspiration', tag: 'fitnessmotivation' },
        { topic: 'Nutrition', title: '#MealPrep', desc: 'Weekly meal prep ideas for hitting your macros', tag: 'mealprep' },
        { topic: 'Community', title: '#FitCoach', desc: 'Coaches sharing their methods, clients and results', tag: 'fitcoach' },
        { topic: 'Body', title: '#BodyBuilding', desc: 'The art and science of building an elite physique', tag: 'bodybuilding' },
      ]
    },
    {
      keys: ['content','creator','youtube','tiktok','instagram','influencer','media','viral','audience','grow','channel'],
      tiktok: [
        { topic: 'Growth', title: 'Grow on TikTok', desc: 'Creators breaking down exactly how they blew up', query: 'how to grow tiktok account fast 2024 strategy' },
        { topic: 'YouTube', title: 'YouTube Strategy', desc: 'What the algorithm actually rewards in 2024', query: 'youtube growth strategy algorithm 2024' },
        { topic: 'Money', title: 'Monetization', desc: 'Every way creators are making money from their content', query: 'content creator monetization income streams 2024' },
        { topic: 'Setup', title: 'Creator Setup', desc: 'The gear and tools that make your content look pro', query: 'content creator setup budget camera microphone' },
      ],
      instagram: [
        { topic: 'Create', title: '#ContentCreator', desc: 'The creator community sharing work, tips and behind the scenes', tag: 'contentcreator' },
        { topic: 'Growth', title: '#InstagramGrowth', desc: 'Strategies for growing a real engaged audience', tag: 'instagramgrowth' },
        { topic: 'Brand', title: '#BrandDeals', desc: 'How creators land and negotiate brand partnerships', tag: 'branddeals' },
        { topic: 'Video', title: '#VideoMarketing', desc: 'The best short-form video content being made right now', tag: 'videomarketing' },
      ]
    },
    {
      keys: ['mindset','motivation','self','discipline','habit','productivity','focus','growth','mental','psychology'],
      tiktok: [
        { topic: 'Discipline', title: 'Build Discipline', desc: 'How to build the discipline that actually sticks long term', query: 'how to build discipline motivation habits 2024' },
        { topic: 'Habits', title: 'Habit Building', desc: 'The science and practice of building habits that last', query: 'habit building atomic habits routine 2024' },
        { topic: 'Morning', title: 'Morning Routines', desc: 'Morning routines of high performers that actually work', query: 'morning routine high performer productivity 2024' },
        { topic: 'Mind', title: 'Mental Performance', desc: 'Tools for focus, clarity and peak mental performance', query: 'mental performance focus productivity tools' },
      ],
      instagram: [
        { topic: 'Mindset', title: '#GrowthMindset', desc: 'Daily motivation and mindset content from top creators', tag: 'growthmindset' },
        { topic: 'Habits', title: '#DailyRoutine', desc: 'People sharing their high-performance daily routines', tag: 'dailyroutine' },
        { topic: 'Focus', title: '#Productivity', desc: 'Tools, systems and tips for getting more done', tag: 'productivity' },
        { topic: 'Self', title: '#SelfImprovement', desc: 'The self-improvement community sharing progress and lessons', tag: 'selfimprovement' },
      ]
    },
    {
      keys: ['data','science','machine learning','ai','artificial intelligence','analytics','deep learning','model','neural'],
      tiktok: [
        { topic: 'AI', title: 'AI Explained', desc: 'How AI and machine learning actually work, clearly explained', query: 'artificial intelligence explained machine learning 2024' },
        { topic: 'Career', title: 'Data Science Career', desc: 'What it really takes to break into data science', query: 'data science career path beginner 2024' },
        { topic: 'Tools', title: 'AI Tools', desc: 'The best AI tools saving people hours every week', query: 'best ai tools productivity 2024' },
        { topic: 'Future', title: 'Future of AI', desc: 'Where AI is actually heading and what it means for you', query: 'future of ai jobs technology 2024' },
      ],
      instagram: [
        { topic: 'AI', title: '#ArtificialIntelligence', desc: 'The AI community sharing research, tools and ideas', tag: 'artificialintelligence' },
        { topic: 'Data', title: '#DataScience', desc: 'Data scientists sharing projects, tips and career advice', tag: 'datascience' },
        { topic: 'ML', title: '#MachineLearning', desc: 'ML engineers and researchers sharing their work', tag: 'machinelearning' },
        { topic: 'Tools', title: '#AITools', desc: 'The best AI tools being discovered and reviewed', tag: 'aitools' },
      ]
    },
    {
      keys: ['music','producer','musician','artist','rapper','singer','songwriter','audio','beat','record','label'],
      tiktok: [
        { topic: 'Production', title: 'Beat Making', desc: 'Producers showing their workflow and how they make hits', query: 'how to make beats music production 2024' },
        { topic: 'Career', title: 'Music Career', desc: 'Artists sharing what it really takes to break through', query: 'music career advice independent artist 2024' },
        { topic: 'Business', title: 'Music Business', desc: 'How to own your masters, distribute and get paid', query: 'music business streaming royalties distribution' },
        { topic: 'Theory', title: 'Music Theory', desc: 'Music theory explained in ways that are actually useful', query: 'music theory explained easy 2024' },
      ],
      instagram: [
        { topic: 'Create', title: '#MusicProducer', desc: 'Producers sharing their process, gear and inspiration', tag: 'musicproducer' },
        { topic: 'Art', title: '#IndependentArtist', desc: 'Independent artists building their careers on their own terms', tag: 'independentartist' },
        { topic: 'Studio', title: '#StudioLife', desc: 'Behind the scenes of recording studios and sessions', tag: 'studiolife' },
        { topic: 'Business', title: '#MusicBusiness', desc: 'The business side of music — rights, deals and money', tag: 'musicbusiness' },
      ]
    },
    {
      keys: ['sales','marketing','advertising','ecommerce','brand','growth','customer','revenue','shopify','dropship'],
      tiktok: [
        { topic: 'Ecom', title: 'Ecommerce Secrets', desc: 'What\'s actually working in ecommerce and dropshipping right now', query: 'ecommerce shopify dropshipping secrets 2024' },
        { topic: 'Marketing', title: 'Digital Marketing', desc: 'Paid ads, SEO and organic growth strategies that convert', query: 'digital marketing strategy ads seo 2024' },
        { topic: 'Sales', title: 'Sales Tactics', desc: 'Closing techniques and scripts from top salespeople', query: 'sales tactics closing techniques scripts 2024' },
        { topic: 'Brand', title: 'Brand Building', desc: 'How to build a brand that people actually remember', query: 'brand building strategy social media 2024' },
      ],
      instagram: [
        { topic: 'Ecom', title: '#Ecommerce', desc: 'Sellers sharing wins, strategies and behind the scenes', tag: 'ecommerce' },
        { topic: 'Marketing', title: '#DigitalMarketing', desc: 'Marketers sharing campaigns, strategies and results', tag: 'digitalmarketing' },
        { topic: 'Brand', title: '#BrandStrategy', desc: 'Brand building, positioning and identity from the best', tag: 'brandstrategy' },
        { topic: 'Growth', title: '#GrowthHacking', desc: 'Growth strategies for startups and small businesses', tag: 'growthhacking' },
      ]
    },
  ];

  // Score every topic
  const scored = topicLibrary.map(topic => {
    let score = 0;
    for (const key of topic.keys) {
      if (g.includes(key)) score += 3; // goal match weighted 3x
    }
    for (const sig of topSignals) {
      for (const key of topic.keys) {
        if (sig.includes(key) || key.includes(sig)) score += 1;
      }
    }
    return { ...topic, score };
  }).sort((a, b) => b.score - a.score);

  const primary = scored[0]?.score > 0 ? scored[0] : null;
  const secondary = scored[1]?.score >= 2 ? scored[1] : null;

  let tiktokCards, igCards;

  if (!primary) {
    // Fallback — generic self-improvement
    const clean = goal.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    tiktokCards = [
      { topic: 'Journey', title: `${goal} Journey`, desc: `Real people documenting their path to becoming a ${goal}`, query: `${clean} journey beginner tips 2024` },
      { topic: 'Tips', title: `${goal} Tips`, desc: 'The most practical advice from people already doing it', query: `${clean} tips advice how to start` },
      { topic: 'Career', title: `${goal} Career`, desc: 'What the career path looks like day to day', query: `${clean} career day in life salary` },
      { topic: 'Learn', title: 'Learn the Skills', desc: 'The fastest ways to build the skills you need', query: `how to become ${clean} fast skills` },
    ];
    igCards = [
      { topic: 'Community', title: `#${clean.replace(/ /g,'')}`, desc: `The ${goal} community sharing work and ideas`, tag: clean.replace(/ /g,'').toLowerCase() },
      { topic: 'Life', title: `#${clean.replace(/ /g,'')}Life`, desc: 'What life looks like doing what you love', tag: `${clean.replace(/ /g,'').toLowerCase()}life` },
      { topic: 'Tips', title: `#${clean.replace(/ /g,'')}Tips`, desc: 'Practical advice from people already in the field', tag: `${clean.replace(/ /g,'').toLowerCase()}tips` },
      { topic: 'Goals', title: '#SelfImprovement', desc: 'The self-improvement community sharing wins and progress', tag: 'selfimprovement' },
    ];
  } else if (secondary) {
    // Blend: 3 from primary + 1 from secondary, for both TikTok and IG
    tiktokCards = [...primary.tiktok.slice(0, 3), secondary.tiktok[0]];
    igCards = [...primary.instagram.slice(0, 3), secondary.instagram[0]];
  } else {
    tiktokCards = primary.tiktok;
    igCards = primary.instagram;
  }

  const tiktok = tiktokCards.map(t => ({
    ...t,
    url: `https://www.tiktok.com/search?q=${encodeURIComponent(t.query)}`,
    platform: 'tiktok'
  }));

  const instagram = igCards.map(t => ({
    ...t,
    url: `https://www.instagram.com/explore/tags/${encodeURIComponent(t.tag)}/`,
    platform: 'instagram'
  }));

  res.status(200).json({ tiktok, instagram });
}
