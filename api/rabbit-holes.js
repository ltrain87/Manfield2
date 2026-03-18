export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { goal = 'software engineer', signals = '' } = req.query;
  const g = goal.toLowerCase();
  const topSignals = signals
    ? signals.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    : [];

  // ── SIGNAL DEPTH SCORING ──
  // Count how many strong signals we have to decide how specific to get
  const signalCount = topSignals.length;
  const signalDepth = signalCount === 0 ? 'none'
    : signalCount <= 3 ? 'low'
    : signalCount <= 8 ? 'medium'
    : 'high';

  // ── SIGNAL → SPECIFIC HASHTAG MAP ──
  // When signals are strong enough, replace broad hashtags with these specific ones
  const signalHashtagMap = {
    // Tech specifics
    'react': { tt: 'reactjs', ig: 'reactjs' },
    'javascript': { tt: 'javascript', ig: 'javascript' },
    'python': { tt: 'pythonprogramming', ig: 'pythonprogramming' },
    'typescript': { tt: 'typescript', ig: 'typescript' },
    'node': { tt: 'nodejs', ig: 'nodejs' },
    'nextjs': { tt: 'nextjs', ig: 'nextjs' },
    'vue': { tt: 'vuejs', ig: 'vuejs' },
    'flutter': { tt: 'flutterdev', ig: 'flutterdeveloper' },
    'swift': { tt: 'swiftprogramming', ig: 'swiftprogramming' },
    'kotlin': { tt: 'kotlindeveloper', ig: 'kotlin' },
    'aws': { tt: 'awscloud', ig: 'awscloud' },
    'docker': { tt: 'docker', ig: 'devops' },
    'devops': { tt: 'devops', ig: 'devops' },
    'system design': { tt: 'systemdesign', ig: 'systemdesign' },
    'leetcode': { tt: 'leetcode', ig: 'leetcode' },
    'interview': { tt: 'techinterview', ig: 'softwareinterviewprep' },
    'machine learning': { tt: 'machinelearning', ig: 'machinelearning' },
    'deep learning': { tt: 'deeplearning', ig: 'deeplearning' },
    'neural': { tt: 'neuralnetwork', ig: 'neuralnetwork' },
    'chatgpt': { tt: 'chatgpt', ig: 'chatgpt' },
    'openai': { tt: 'openai', ig: 'openai' },
    'startup': { tt: 'startupfounder', ig: 'startuplife' },
    'saas': { tt: 'saas', ig: 'saas' },
    'fundraising': { tt: 'venturecapital', ig: 'venturecapital' },
    'crypto': { tt: 'cryptocurrency', ig: 'cryptocurrency' },
    'bitcoin': { tt: 'bitcoin', ig: 'bitcoin' },
    'options': { tt: 'optionstrading', ig: 'optionstrading' },
    'real estate': { tt: 'realestateinvesting', ig: 'realestateinvesting' },
    'dividend': { tt: 'dividendinvesting', ig: 'dividendinvesting' },
    'figma': { tt: 'figma', ig: 'figmadesign' },
    'branding': { tt: 'brandidentity', ig: 'brandidentity' },
    'logo': { tt: 'logodesign', ig: 'logodesign' },
    'typography': { tt: 'typography', ig: 'typography' },
    'nutrition': { tt: 'nutritioncoach', ig: 'nutritionadvice' },
    'meal prep': { tt: 'mealprep', ig: 'mealprep' },
    'bodybuilding': { tt: 'bodybuilding', ig: 'bodybuilding' },
    'calisthenics': { tt: 'calisthenics', ig: 'calisthenics' },
    'powerlifting': { tt: 'powerlifting', ig: 'powerlifting' },
    'youtube': { tt: 'youtubergrowth', ig: 'youtubetips' },
    'tiktok': { tt: 'tiktoktips', ig: 'tiktokcreator' },
    'monetization': { tt: 'creatoreconomy', ig: 'monetization' },
    'newsletter': { tt: 'newsletter', ig: 'emailmarketing' },
    'seo': { tt: 'seotips', ig: 'searchengineoptimization' },
    'dropshipping': { tt: 'dropshipping', ig: 'dropshipping' },
    'shopify': { tt: 'shopify', ig: 'shopifyseller' },
    'hvac': { tt: 'hvac', ig: 'hvac' },
    'plumbing': { tt: 'plumber', ig: 'plumbing' },
    'electrician': { tt: 'electrician', ig: 'electrician' },
    'welding': { tt: 'welding', ig: 'welding' },
    'nursing': { tt: 'nursetok', ig: 'nurselife' },
    'medschool': { tt: 'medschool', ig: 'medstudent' },
    'therapy': { tt: 'therapist', ig: 'therapist' },
    'music production': { tt: 'musicproducer', ig: 'musicproducer' },
    'mixing': { tt: 'audioengineer', ig: 'mixing' },
    'recording': { tt: 'recordingstudio', ig: 'studiolife' },
    'hip hop': { tt: 'hiphop', ig: 'hiphop' },
    'writing': { tt: 'writingtips', ig: 'writingcommunity' },
    'copywriting': { tt: 'copywriting', ig: 'copywriting' },
    'screenplay': { tt: 'screenwriting', ig: 'screenwriting' },
    'discipline': { tt: 'discipline', ig: 'discipline' },
    'stoicism': { tt: 'stoic', ig: 'stoicism' },
    'meditation': { tt: 'meditation', ig: 'meditation' },
    'morning routine': { tt: 'morningroutine', ig: 'morningroutine' },
    'mindset': { tt: 'mindset', ig: 'mindset' },
  };

  // ── BROAD TOPIC LIBRARY (used when depth = none/low) ──
  const topicLibrary = [
    {
      keys: ['software','engineer','coding','developer','programmer','code','javascript','python','react','web'],
      tiktok: [
        { topic: 'Career', title: 'SWE Day in the Life', desc: 'Real engineers at top companies showing their actual workday', hashtag: 'softwareengineer' },
        { topic: 'Learning', title: 'Learn to Code', desc: 'The fastest paths from zero to writing real code', hashtag: 'learntocode' },
        { topic: 'Interview', title: 'Coding Interviews', desc: 'Real FAANG interview walkthroughs and tips', hashtag: 'codinginterview' },
        { topic: 'Tips', title: 'Dev Tips & Tricks', desc: 'Pro developer shortcuts and tools that save hours', hashtag: 'developerlife' },
      ],
      instagram: [
        { topic: 'Community', title: '#SoftwareEngineer', desc: 'Engineers worldwide sharing their work and journey', tag: 'softwareengineer' },
        { topic: 'Challenge', title: '#100DaysOfCode', desc: 'Thousands documenting their daily coding journey', tag: '100daysofcode' },
        { topic: 'Tips', title: '#CodingTips', desc: 'Practical coding advice from working developers', tag: 'codingtips' },
        { topic: 'Life', title: '#TechLife', desc: 'What life looks like working in tech', tag: 'techlife' },
      ]
    },
    {
      keys: ['entrepreneur','startup','business','founder','company','venture','hustle','build'],
      tiktok: [
        { topic: 'Founders', title: 'Founder Stories', desc: 'Real founders sharing the raw truth of building a company', hashtag: 'entrepreneurship' },
        { topic: 'Revenue', title: 'First $10K Online', desc: 'Practical steps from zero to first real revenue', hashtag: 'makemoneyonline' },
        { topic: 'Growth', title: 'Business Growth', desc: 'What actually works when scaling from idea to customers', hashtag: 'businesstips' },
        { topic: 'Ideas', title: 'Business Ideas 2024', desc: 'Low-cost business models working right now', hashtag: 'sidehustle' },
      ],
      instagram: [
        { topic: 'Hustle', title: '#Entrepreneur', desc: 'The entrepreneur community sharing wins and lessons', tag: 'entrepreneur' },
        { topic: 'Build', title: '#StartupLife', desc: 'Behind the scenes of building companies from scratch', tag: 'startuplife' },
        { topic: 'Money', title: '#PassiveIncome', desc: 'Real strategies for building income streams', tag: 'passiveincome' },
        { topic: 'Brand', title: '#PersonalBrand', desc: 'Build an audience around your expertise', tag: 'personalbrand' },
      ]
    },
    {
      keys: ['investor','invest','finance','trading','stock','fund','portfolio','wealth','money','crypto'],
      tiktok: [
        { topic: 'Basics', title: 'Investing 101', desc: 'The fundamentals every investor needs', hashtag: 'investingtips' },
        { topic: 'Strategy', title: 'Portfolio Building', desc: 'How to build and manage a long-term portfolio', hashtag: 'stockmarket' },
        { topic: 'Real Estate', title: 'Real Estate Investing', desc: 'Building wealth through property in 2024', hashtag: 'realestateinvesting' },
        { topic: 'Wealth', title: 'Wealth Mindset', desc: 'How wealthy people actually think about money', hashtag: 'wealthmindset' },
      ],
      instagram: [
        { topic: 'Markets', title: '#StockMarket', desc: 'Real-time market commentary and investment ideas', tag: 'stockmarket' },
        { topic: 'Wealth', title: '#WealthBuilding', desc: 'Strategies from people building real long-term wealth', tag: 'wealthbuilding' },
        { topic: 'RE', title: '#RealEstateInvesting', desc: 'Deals, strategies and lessons from property investors', tag: 'realestateinvesting' },
        { topic: 'Freedom', title: '#FinancialFreedom', desc: 'People who reached financial independence', tag: 'financialfreedom' },
      ]
    },
    {
      keys: ['design','designer','ux','ui','graphic','brand','creative','figma','visual','art'],
      tiktok: [
        { topic: 'Portfolio', title: 'Get Hired as Designer', desc: 'What actually gets you hired as a designer in 2024', hashtag: 'uxdesign' },
        { topic: 'Tools', title: 'Figma Tips', desc: 'Pro shortcuts and workflows that save hours every week', hashtag: 'figmatips' },
        { topic: 'Career', title: 'Break Into UX', desc: 'Breaking into UX design from any background', hashtag: 'uxdesigner' },
        { topic: 'Work', title: 'Design Process', desc: 'How top designers go from brief to final deliverable', hashtag: 'graphicdesign' },
      ],
      instagram: [
        { topic: 'Work', title: '#UIDesign', desc: 'The best UI design work being made right now', tag: 'uidesign' },
        { topic: 'Type', title: '#Typography', desc: 'The art and craft of type from the best designers', tag: 'typography' },
        { topic: 'Brand', title: '#BrandIdentity', desc: 'Stunning branding projects from around the world', tag: 'brandidentity' },
        { topic: 'Motion', title: '#MotionDesign', desc: 'Animation and motion work pushing the craft forward', tag: 'motiondesign' },
      ]
    },
    {
      keys: ['fitness','gym','workout','bodybuilding','health','nutrition','training','coach','exercise','muscle'],
      tiktok: [
        { topic: 'Training', title: 'Workout Science', desc: 'Evidence-based training advice that actually works', hashtag: 'gymtok' },
        { topic: 'Nutrition', title: 'Nutrition Facts', desc: 'What to actually eat to reach your fitness goals', hashtag: 'nutritioncoach' },
        { topic: 'Business', title: 'PT Business', desc: 'How to build a client base as a personal trainer', hashtag: 'personaltrainer' },
        { topic: 'Motivation', title: 'Gym Motivation', desc: 'The mental side of building a consistent fitness habit', hashtag: 'fitnessmotivation' },
      ],
      instagram: [
        { topic: 'Training', title: '#FitnessMotivation', desc: 'Workouts, transformations and training inspiration', tag: 'fitnessmotivation' },
        { topic: 'Nutrition', title: '#MealPrep', desc: 'Weekly meal prep ideas for hitting your macros', tag: 'mealprep' },
        { topic: 'Coach', title: '#FitCoach', desc: 'Coaches sharing their methods, clients and results', tag: 'fitcoach' },
        { topic: 'Body', title: '#Bodybuilding', desc: 'The art and science of building an elite physique', tag: 'bodybuilding' },
      ]
    },
    {
      keys: ['content','creator','youtube','tiktok','influencer','media','viral','audience','grow','channel'],
      tiktok: [
        { topic: 'Growth', title: 'Grow on TikTok', desc: 'Creators breaking down exactly how they blew up', hashtag: 'creatortips' },
        { topic: 'YouTube', title: 'YouTube Strategy', desc: 'What the algorithm actually rewards in 2024', hashtag: 'youtubergrowth' },
        { topic: 'Money', title: 'Creator Income', desc: 'Every way creators are making money from content', hashtag: 'contentcreator' },
        { topic: 'Setup', title: 'Creator Setup', desc: 'The gear and tools that make your content look pro', hashtag: 'contentcreation' },
      ],
      instagram: [
        { topic: 'Create', title: '#ContentCreator', desc: 'The creator community sharing work, tips and behind the scenes', tag: 'contentcreator' },
        { topic: 'Growth', title: '#InstagramGrowth', desc: 'Strategies for growing a real engaged audience', tag: 'instagramgrowth' },
        { topic: 'Brand', title: '#BrandDeals', desc: 'How creators land and negotiate brand partnerships', tag: 'branddeals' },
        { topic: 'Video', title: '#VideoMarketing', desc: 'The best short-form video content being made right now', tag: 'videomarketing' },
      ]
    },
    {
      keys: ['mindset','motivation','discipline','habit','productivity','focus','growth','self','psychology'],
      tiktok: [
        { topic: 'Discipline', title: 'Build Discipline', desc: 'How to build the discipline that actually sticks', hashtag: 'discipline' },
        { topic: 'Habits', title: 'Habit Building', desc: 'The science and practice of habits that last', hashtag: 'habitbuilding' },
        { topic: 'Morning', title: 'Morning Routines', desc: 'Morning routines of high performers that work', hashtag: 'morningroutine' },
        { topic: 'Mind', title: 'Mental Performance', desc: 'Tools for focus, clarity and peak mental performance', hashtag: 'mindset' },
      ],
      instagram: [
        { topic: 'Mindset', title: '#GrowthMindset', desc: 'Daily motivation and mindset content', tag: 'growthmindset' },
        { topic: 'Habits', title: '#DailyRoutine', desc: 'People sharing their high-performance daily routines', tag: 'dailyroutine' },
        { topic: 'Focus', title: '#Productivity', desc: 'Tools, systems and tips for getting more done', tag: 'productivity' },
        { topic: 'Self', title: '#SelfImprovement', desc: 'The self-improvement community sharing progress', tag: 'selfimprovement' },
      ]
    },
    {
      keys: ['data','science','machine learning','ai','artificial intelligence','analytics','deep learning'],
      tiktok: [
        { topic: 'AI', title: 'AI Explained', desc: 'How AI and machine learning actually work, clearly', hashtag: 'artificialintelligence' },
        { topic: 'Career', title: 'Data Science Career', desc: 'What it really takes to break into data science', hashtag: 'datascience' },
        { topic: 'Tools', title: 'AI Tools', desc: 'The best AI tools saving people hours every week', hashtag: 'aitools' },
        { topic: 'Future', title: 'Future of AI', desc: 'Where AI is actually heading and what it means', hashtag: 'machinelearning' },
      ],
      instagram: [
        { topic: 'AI', title: '#ArtificialIntelligence', desc: 'The AI community sharing research, tools and ideas', tag: 'artificialintelligence' },
        { topic: 'Data', title: '#DataScience', desc: 'Data scientists sharing projects, tips and career advice', tag: 'datascience' },
        { topic: 'ML', title: '#MachineLearning', desc: 'ML engineers and researchers sharing their work', tag: 'machinelearning' },
        { topic: 'Tools', title: '#AITools', desc: 'The best AI tools being discovered and reviewed', tag: 'aitools' },
      ]
    },
    {
      keys: ['music','producer','musician','artist','rapper','singer','songwriter','audio','beat','record'],
      tiktok: [
        { topic: 'Production', title: 'Beat Making', desc: 'Producers showing their workflow and how they make hits', hashtag: 'musicproducer' },
        { topic: 'Career', title: 'Music Career', desc: 'Artists sharing what it really takes to break through', hashtag: 'independentartist' },
        { topic: 'Business', title: 'Music Business', desc: 'How to own your masters, distribute and get paid', hashtag: 'musicbusiness' },
        { topic: 'Theory', title: 'Music Theory', desc: 'Music theory explained in ways that are actually useful', hashtag: 'musictheory' },
      ],
      instagram: [
        { topic: 'Create', title: '#MusicProducer', desc: 'Producers sharing their process, gear and inspiration', tag: 'musicproducer' },
        { topic: 'Art', title: '#IndependentArtist', desc: 'Independent artists building their careers', tag: 'independentartist' },
        { topic: 'Studio', title: '#StudioLife', desc: 'Behind the scenes of recording studios and sessions', tag: 'studiolife' },
        { topic: 'Business', title: '#MusicBusiness', desc: 'Rights, deals and money in the music industry', tag: 'musicbusiness' },
      ]
    },
    {
      keys: ['hvac','plumber','electrician','contractor','trades','mechanic','technician','construction','carpenter','welder'],
      tiktok: [
        { topic: 'Career', title: 'Trades Career', desc: 'Real tradespeople showing what the job actually pays', hashtag: 'tradeslife' },
        { topic: 'Tips', title: 'Trade Tips', desc: 'Pro tips from experienced tradespeople in the field', hashtag: 'bluecollar' },
        { topic: 'HVAC', title: 'HVAC Life', desc: 'HVAC technicians sharing jobs, tips and real pay', hashtag: 'hvac' },
        { topic: 'Business', title: 'Go Independent', desc: 'How tradespeople are starting their own businesses', hashtag: 'contractorlife' },
      ],
      instagram: [
        { topic: 'Trades', title: '#TradesLife', desc: 'The skilled trades community sharing work and career advice', tag: 'tradeslife' },
        { topic: 'HVAC', title: '#HVAC', desc: 'HVAC technicians sharing installs, repairs and career tips', tag: 'hvac' },
        { topic: 'Blue Collar', title: '#BlueCollar', desc: 'Celebrating skilled trades and the people who do the work', tag: 'bluecollar' },
        { topic: 'Business', title: '#ContractorLife', desc: 'Contractors running their own businesses', tag: 'contractorlife' },
      ]
    },
    {
      keys: ['nurse','doctor','medical','healthcare','physician','therapy','therapist','dental','pharmacy'],
      tiktok: [
        { topic: 'Career', title: 'Healthcare Career', desc: 'Real healthcare workers showing their daily life and pay', hashtag: 'nursetok' },
        { topic: 'School', title: 'Medical School', desc: 'Students and grads sharing the medical education journey', hashtag: 'medschool' },
        { topic: 'Tips', title: 'Clinical Tips', desc: 'Practical clinical knowledge from working professionals', hashtag: 'medicalstudent' },
        { topic: 'Wellness', title: 'Healthcare Reality', desc: 'Honest talk about what a healthcare career actually looks like', hashtag: 'healthcareworker' },
      ],
      instagram: [
        { topic: 'Nursing', title: '#NurseLife', desc: 'Nurses sharing real stories, tips and career advice', tag: 'nurselife' },
        { topic: 'Medical', title: '#MedStudent', desc: 'Medical students documenting their journey to becoming doctors', tag: 'medstudent' },
        { topic: 'Healthcare', title: '#HealthcareWorker', desc: 'The healthcare community sharing experiences', tag: 'healthcareworker' },
        { topic: 'Wellness', title: '#DoctorLife', desc: 'Physicians sharing insights on medicine and their careers', tag: 'doctorlife' },
      ]
    },
    {
      keys: ['sales','marketing','advertising','ecommerce','brand','growth','customer','revenue','shopify'],
      tiktok: [
        { topic: 'Ecom', title: 'Ecommerce Secrets', desc: "What's actually working in ecommerce right now", hashtag: 'ecommerce' },
        { topic: 'Marketing', title: 'Digital Marketing', desc: 'Paid ads, SEO and organic growth strategies that convert', hashtag: 'digitalmarketing' },
        { topic: 'Sales', title: 'Sales Tactics', desc: 'Closing techniques from top salespeople', hashtag: 'salestips' },
        { topic: 'Brand', title: 'Brand Building', desc: 'How to build a brand that people actually remember', hashtag: 'branding' },
      ],
      instagram: [
        { topic: 'Ecom', title: '#Ecommerce', desc: 'Sellers sharing wins, strategies and behind the scenes', tag: 'ecommerce' },
        { topic: 'Marketing', title: '#DigitalMarketing', desc: 'Marketers sharing campaigns, strategies and results', tag: 'digitalmarketing' },
        { topic: 'Brand', title: '#BrandStrategy', desc: 'Brand building, positioning and identity from the best', tag: 'brandstrategy' },
        { topic: 'Growth', title: '#GrowthHacking', desc: 'Growth strategies for startups and small businesses', tag: 'growthhacking' },
      ]
    },
  ];

  // ── SCORE TOPICS ──
  const scored = topicLibrary.map(topic => {
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
  const secondary = scored[1]?.score >= 2 ? scored[1] : null;

  let tiktokCards, igCards;

  if (!primary) {
    const cleanGoal = g.replace(/[^a-z0-9]/g, '').slice(0, 30) || 'selfimprovement';
    tiktokCards = [
      { topic: 'Career', title: `${goal} Journey`, desc: `Real people on their path to becoming a ${goal}`, hashtag: cleanGoal },
      { topic: 'Tips', title: `${goal} Tips`, desc: 'The most practical advice from people already doing it', hashtag: `${cleanGoal}tips` },
      { topic: 'Life', title: `${goal} Life`, desc: 'What daily life looks like in this field', hashtag: `${cleanGoal}life` },
      { topic: 'Growth', title: 'Self Improvement', desc: 'The self-improvement community sharing progress', hashtag: 'selfimprovement' },
    ];
    igCards = [
      { topic: 'Community', title: `#${cleanGoal}`, desc: `The ${goal} community sharing work and ideas`, tag: cleanGoal },
      { topic: 'Tips', title: `#${cleanGoal}tips`, desc: 'Practical advice from people in the field', tag: `${cleanGoal}tips` },
      { topic: 'Life', title: `#${cleanGoal}life`, desc: 'What life looks like doing what you love', tag: `${cleanGoal}life` },
      { topic: 'Growth', title: '#SelfImprovement', desc: 'The self-improvement community sharing wins', tag: 'selfimprovement' },
    ];
  } else {
    // Start with broad topic cards
    const baseTT = secondary
      ? [...primary.tiktok.slice(0, 3), secondary.tiktok[0]]
      : [...primary.tiktok];
    const baseIG = secondary
      ? [...primary.instagram.slice(0, 3), secondary.instagram[0]]
      : [...primary.instagram];

    tiktokCards = [...baseTT];
    igCards = [...baseIG];

    // ── PROGRESSIVE SPECIFICITY ──
    // As signals accumulate, replace broad cards with signal-specific ones
    if (signalDepth !== 'none') {
      // Find signal keywords that map to specific hashtags
      const matchedSignalTags = [];
      for (const sig of topSignals) {
        for (const [keyword, tags] of Object.entries(signalHashtagMap)) {
          if (sig.includes(keyword) || keyword.includes(sig)) {
            matchedSignalTags.push({ keyword, ...tags, sig });
            break;
          }
        }
      }

      // Deduplicate by hashtag
      const seenTT = new Set(tiktokCards.map(c => c.hashtag));
      const seenIG = new Set(igCards.map(c => c.tag));
      const uniqueMatches = matchedSignalTags.filter(m =>
        !seenTT.has(m.tt) && !seenIG.has(m.ig)
      );

      if (uniqueMatches.length > 0 && signalDepth === 'low') {
        // Replace last card with top signal-specific card
        const match = uniqueMatches[0];
        tiktokCards[3] = {
          topic: match.keyword,
          title: `#${match.tt}`,
          desc: `Specific content on ${match.keyword} from your recent interests`,
          hashtag: match.tt
        };
        igCards[3] = {
          topic: match.keyword,
          title: `#${match.ig}`,
          desc: `Deep dive into ${match.keyword} content`,
          tag: match.ig
        };
      } else if (uniqueMatches.length >= 1 && signalDepth === 'medium') {
        // Replace last 2 cards with signal-specific
        for (let i = 0; i < Math.min(2, uniqueMatches.length); i++) {
          const match = uniqueMatches[i];
          tiktokCards[2 + i] = {
            topic: match.keyword,
            title: `#${match.tt}`,
            desc: `Focused ${match.keyword} content based on what you've been exploring`,
            hashtag: match.tt
          };
          igCards[2 + i] = {
            topic: match.keyword,
            title: `#${match.ig}`,
            desc: `Deep dive into ${match.keyword}`,
            tag: match.ig
          };
        }
      } else if (uniqueMatches.length >= 2 && signalDepth === 'high') {
        // Replace last 3 cards — feed is now highly personalised
        for (let i = 0; i < Math.min(3, uniqueMatches.length); i++) {
          const match = uniqueMatches[i];
          tiktokCards[1 + i] = {
            topic: match.keyword,
            title: `#${match.tt}`,
            desc: `Tailored to your interest in ${match.keyword}`,
            hashtag: match.tt
          };
          igCards[1 + i] = {
            topic: match.keyword,
            title: `#${match.ig}`,
            desc: `Deep ${match.keyword} content curated for you`,
            tag: match.ig
          };
        }
      }
    }
  }

  // Build final URLs
  const tiktok = tiktokCards.map(t => ({
    ...t,
    url: `https://www.tiktok.com/tag/${encodeURIComponent(t.hashtag)}`,
    platform: 'tiktok'
  }));

  const instagram = igCards.map(t => ({
    ...t,
    url: `https://www.instagram.com/explore/tags/${encodeURIComponent(t.tag)}/`,
    platform: 'instagram'
  }));

  res.status(200).json({ tiktok, instagram });
}
