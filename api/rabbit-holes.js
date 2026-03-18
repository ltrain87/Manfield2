export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { goal = 'self improvement', signals = '' } = req.query;
  const g = goal.toLowerCase().trim();
  const topSignals = signals ? signals.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];

  // ── Universal topic → hashtag engine ──
  // Works for any topic, not just preset career goals
  
  // Step 1: Try to match a known topic category
  const knownTopics = [
    { keys: ['software','engineer','coding','developer','programmer','javascript','python','react','typescript'],
      tt: ['softwareengineer','learntocode','codinglife','developerlife','programming','reactjs','pythonprogramming','webdev','techlife','codinginterview','100daysofcode','leetcode'],
      ig: ['softwareengineer','learntocode','coding','developer','programming','techlife','javascript','python','webdeveloper','coder'] },
    
    { keys: ['entrepreneur','startup','business','founder','hustle','side project','saas'],
      tt: ['entrepreneur','startuplife','businesstips','makemoneyonline','sidehustle','entrepreneurship','businessowner','startupfounder','passiveincome','digitalmarketing'],
      ig: ['entrepreneur','startuplife','businessowner','entrepreneurship','motivation','hustle','sidehustle','smallbusiness','success','mindset'] },
    
    { keys: ['invest','stock','finance','trading','money','crypto','wealth','portfolio','bitcoin'],
      tt: ['investing','stockmarket','personalfinance','wealthbuilding','cryptocurrency','daytrading','realestateinvesting','financialfreedom','dividendinvesting','options'],
      ig: ['investing','stockmarket','personalfinance','wealthbuilding','financialfreedom','realestateinvesting','cryptocurrency','passiveincome','money','finance'] },
    
    { keys: ['design','designer','ui','ux','figma','brand','graphic','visual','typography','logo'],
      tt: ['uxdesign','graphicdesign','figma','branding','logodesign','uiux','typography','brandidentity','webdesign','designinspiration'],
      ig: ['graphicdesign','uxdesign','branding','logodesign','typography','brandidentity','webdesign','uidesign','designinspiration','creativedirection'] },
    
    { keys: ['fitness','gym','workout','health','bodybuilding','nutrition','muscle','weight','calisthenics','powerlifting'],
      tt: ['gymtok','fitnessmotivation','workout','bodybuilding','nutrition','calisthenics','personaltrainer','weightloss','musclebuilding','gymlife'],
      ig: ['fitnessmotivation','gym','bodybuilding','workout','nutrition','healthylifestyle','gymlife','calisthenics','fitfam','personaltrainer'] },
    
    { keys: ['fashion','style','outfit','clothes','wear','jeans','sneakers','streetwear','drip','fit','fits'],
      tt: ['fashion','outfitoftheday','streetwear','sneakers','style','ootd','fashiontok','mensfashion','womensfashion','thrifting','vintagefashion','grwm'],
      ig: ['fashion','ootd','streetwear','sneakers','style','outfitoftheday','mensfashion','womensfashion','fashionstyle','fashionblogger','streetstyle','vintagefashion'] },
    
    { keys: ['food','cook','recipe','meal','eat','kitchen','bake','chef','restaurant'],
      tt: ['foodtok','cooking','recipe','mealprep','foodrecipes','baking','homecooking','easyrecipes','cheflife','foodie'],
      ig: ['foodie','instafood','cooking','recipe','foodphotography','homecooking','foodblogger','mealprep','baking','foodstagram'] },
    
    { keys: ['travel','trip','explore','country','city','adventure','backpack','vacation','nomad'],
      tt: ['traveltok','travellife','explore','wanderlust','solotravel','digitalnomad','backpacking','travelcouple','budgettravel','traveladvice'],
      ig: ['travel','wanderlust','adventure','explore','travelgram','solotravel','digitalnomad','backpacking','travellife','travelcouple'] },
    
    { keys: ['game','gaming','esport','stream','minecraft','fps','rpg','console','pc gaming'],
      tt: ['gaming','gamingtok','minecraft','fps','esports','gamingsetup','pcgaming','consolegaming','gamingcommunity','streamer'],
      ig: ['gaming','gamer','esports','gamingsetup','pcgaming','minecraft','consolegaming','gamingcommunity','videogames','gaminglife'] },
    
    { keys: ['car','auto','vehicle','drive','mechanic','truck','motorcycle','racing','detailing','modified'],
      tt: ['carsoftiktok','cardetailing','automotive','carmodified','jdm','musclecar','motorcycles','racing','carculture','carguy'],
      ig: ['cars','automotive','cardetailing','jdm','musclecar','carlovers','motorcycles','racing','carculture','supercar'] },
    
    { keys: ['music','producer','musician','artist','rapper','audio','beat','record','hiphop','edm'],
      tt: ['musicproducer','hiphop','musicproduction','beatmaking','rapper','singer','musicartist','independentartist','edm','musicbusiness'],
      ig: ['musicproducer','hiphop','musician','beatmaking','rapper','singer','musiclife','independentartist','newmusic','musicbusiness'] },
    
    { keys: ['photo','photography','camera','portrait','landscape','shoot','lens','canon','sony'],
      tt: ['photography','photograpghy','cameratips','portraitphotography','landscapephotography','photographytips','photographer','filmcamera','aestheticphotos'],
      ig: ['photography','photographer','portraitphotography','landscapephotography','streetphotography','iphonephotography','naturephotography','photographylovers','aesthetic'] },
    
    { keys: ['movie','film','cinema','actor','director','series','tv','anime','netflix','review'],
      tt: ['movietok','filmtok','anime','netflixandchill','moviereview','filmanalysis','cinematography','animerecommendations','tvshow','horror'],
      ig: ['movies','cinema','film','anime','filmmaking','movienight','serialkiller','tvshow','filmlovers','cinematography'] },
    
    { keys: ['mental health','anxiety','depression','therapy','mindfulness','wellbeing','psychology','stoic'],
      tt: ['mentalhealth','therapy','mindfulness','selfcare','anxiety','depression','psychology','stoicism','emotionalhealth','shadowwork'],
      ig: ['mentalhealth','selfcare','mindfulness','therapy','anxiety','wellness','psychology','healing','stoicism','emotionalintelligence'] },
    
    { keys: ['art','illustrat','draw','paint','sketch','digital art','commission','comic','3d'],
      tt: ['artistsoftiktok','drawing','digitalart','illustration','painting','sketchbook','procreate','artprocess','characterdesign','animation'],
      ig: ['art','illustration','digitalart','drawing','painting','artistsoninstagram','procreate','sketchbook','characterdesign','conceptart'] },
    
    { keys: ['content creator','youtube','tiktok','influencer','audience','grow channel','monetize'],
      tt: ['contentcreator','youtuber','creatortips','growontiktok','contentcreation','videocreator','socialmediatips','youtubergrowth','monetization','branddeal'],
      ig: ['contentcreator','instagramtips','socialmedia','influencer','contentcreation','ugccreator','brandcollaboration','instagram','growyouraccount','ugc'] },
    
    { keys: ['crypto','bitcoin','ethereum','nft','defi','web3','blockchain','altcoin'],
      tt: ['crypto','bitcoin','ethereum','cryptocurrency','nft','defi','web3','blockchain','cryptonews','altcoins'],
      ig: ['crypto','bitcoin','cryptocurrency','ethereum','blockchain','nft','defi','web3','cryptonews','altcoins'] },
    
    { keys: ['sport','basketball','football','soccer','nba','nfl','athlete','baseball','tennis'],
      tt: ['sports','nba','nfl','soccer','football','basketball','athlete','sportsanalysis','highlights','sportstok'],
      ig: ['sports','nba','nfl','soccer','football','basketball','athlete','sportslife','training','sportstalk'] },
    
    { keys: ['hvac','plumber','electrician','trades','mechanic','construction','carpenter','welder'],
      tt: ['tradeslife','hvac','bluecollar','electrician','plumber','construction','welding','carpentry','contractorlife','tradespeople'],
      ig: ['tradeslife','hvac','bluecollar','electrician','plumbing','construction','welding','contractor','tradespeople','skilledtrades'] },
    
    { keys: ['skincare','beauty','makeup','skinroutine','glow','self care','spa','hair'],
      tt: ['skincare','beauty','makeup','skincareroutine','grwm','selfcare','glowup','haircare','beautytips','skincaretok'],
      ig: ['skincare','beauty','makeup','skincareroutine','glowup','selfcare','haircare','beautytips','naturalskincare','beautyinfluencer'] },
    
    { keys: ['mindset','motivation','discipline','habit','productivity','focus','success','self improvement'],
      tt: ['mindset','motivation','discipline','habits','productivity','selfimprovement','morningroutine','successmindset','growthmindset','dailyroutine'],
      ig: ['mindset','motivation','discipline','selfimprovement','productivity','growthmindset','success','habits','morningroutine','personaldevelopment'] },
  ];

  // Score known topics
  const scored = knownTopics.map(topic => {
    let score = 0;
    for (const k of topic.keys) { if (g.includes(k) || k.includes(g)) score += 3; }
    for (const sig of topSignals) {
      for (const k of topic.keys) { if (sig.includes(k) || k.includes(sig)) score += 1; }
    }
    return { ...topic, score };
  }).sort((a, b) => b.score - a.score);

  let ttTags, igTags;

  if (scored[0]?.score > 0) {
    // Known topic — use preset tags + signal-specific additions
    ttTags = [...scored[0].tt];
    igTags = [...scored[0].ig];
    // Blend secondary topic tags if strong signal
    if (scored[1]?.score >= 3) {
      ttTags = [...ttTags.slice(0, 8), ...scored[1].tt.slice(0, 4)];
      igTags = [...igTags.slice(0, 8), ...scored[1].ig.slice(0, 4)];
    }
  } else {
    // Unknown topic — generate tags dynamically from the topic words
    const words = g.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    const combined = words.join('');
    const first = words[0] || g.replace(/\s/g,'').slice(0,15);
    
    ttTags = [
      combined,
      `${combined}tips`,
      `${combined}life`,
      `${combined}tok`,
      `${first}community`,
      `${first}advice`,
      `${combined}tutorial`,
      `${first}journey`,
      `${combined}goals`,
      `${combined}motivation`,
      'lifestyle',
      'selfimprovement',
    ];
    igTags = [
      combined,
      `${combined}life`,
      `${first}community`,
      `${combined}style`,
      `${combined}tips`,
      `${first}inspiration`,
      `${combined}aesthetic`,
      `${first}daily`,
      'lifestyle',
      'selfimprovement',
    ];
  }

  // Build final card objects — generate many cards from the tag list
  const buildTikTokCards = (tags) => tags.slice(0, 12).map((tag, i) => ({
    topic: i < 4 ? 'Trending' : i < 8 ? 'Deep Dive' : 'Community',
    title: `#${tag}`,
    desc: `${goal} content on TikTok — tap to explore`,
    hashtag: tag,
    url: `https://www.tiktok.com/tag/${encodeURIComponent(tag)}`,
    platform: 'tiktok',
  }));

  const buildIGCards = (tags) => tags.slice(0, 12).map((tag, i) => ({
    topic: i < 4 ? 'Explore' : i < 8 ? 'Community' : 'Inspiration',
    title: `#${tag}`,
    desc: `${goal} on Instagram — tap to explore this tag`,
    tag,
    url: `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`,
    platform: 'instagram',
  }));

  res.status(200).json({
    tiktok: buildTikTokCards(ttTags),
    instagram: buildIGCards(igTags),
  });
}
