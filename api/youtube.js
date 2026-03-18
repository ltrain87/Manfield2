export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { goal = 'self improvement', type = 'video', offset = '0', safe = '', count = '1' } = req.query;
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return res.status(200).json({ videos: [], error: 'YOUTUBE_API_KEY not set in Vercel environment variables.' });

  const safeSearch = safe === 'strict' ? 'strict' : 'moderate';
  const idx = parseInt(offset) % 8;
  const batchCount = Math.min(parseInt(count) || 1, 5); // up to 5 parallel queries

  // Rich query set — 8 variations so rotating offset always finds fresh content
  const queries = type === 'short'
    ? [
        `${goal} tips`,
        `${goal} for beginners`,
        `how to ${goal}`,
        `${goal} tutorial`,
        `${goal} explained`,
        `${goal} guide`,
        `learn ${goal}`,
        `${goal} advice`,
      ]
    : [
        `${goal} complete guide`,
        `${goal} full tutorial`,
        `${goal} how to start`,
        `best ${goal} course`,
        `${goal} masterclass`,
        `${goal} deep dive`,
        `${goal} for beginners 2024`,
        `${goal} roadmap`,
      ];

  // Run multiple queries in parallel for volume
  const queryBatch = [];
  for (let i = 0; i < batchCount; i++) {
    queryBatch.push(queries[(idx + i) % queries.length]);
  }

  try {
    const maxPerQuery = type === 'short' ? 15 : 10;
    const results = await Promise.allSettled(
      queryBatch.map(q =>
        fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=${maxPerQuery}&order=relevance&safeSearch=${safeSearch}&videoEmbeddable=true&key=${apiKey}`)
          .then(r => r.json())
      )
    );

    const seen = new Set();
    const videos = [];

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const data = result.value;
      if (data.error) continue;
      if (!data.items) continue;

      for (const item of data.items) {
        if (!item.id?.videoId || seen.has(item.id.videoId)) continue;
        seen.add(item.id.videoId);
        videos.push({
          id: item.id.videoId,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
          description: item.snippet.description || '',
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          published: item.snippet.publishedAt,
        });
      }
    }

    res.status(200).json({ videos });
  } catch (err) {
    res.status(500).json({ error: err.message, videos: [] });
  }
}
