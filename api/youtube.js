export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { goal = 'software engineer', type = 'video', offset = '0', safe = '' } = req.query;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'YouTube API key not configured. Add YOUTUBE_API_KEY in Vercel environment variables.' });

  const idx = parseInt(offset) % 4;

  // Clean, specific queries — no year hardcoded, no filler words that waste quota
  const shortQueries = [
    `${goal} tips`,
    `${goal} day in the life`,
    `how to become ${goal}`,
    `${goal} beginner guide`,
  ];

  const longQueries = [
    `${goal} complete guide`,
    `${goal} tutorial for beginners`,
    `${goal} roadmap how to start`,
    `learn ${goal} from scratch`,
  ];

  const query = type === 'short' ? shortQueries[idx] : longQueries[idx];
  const maxResults = type === 'short' ? 8 : 6;
  const safeSearch = safe === 'strict' ? 'strict' : 'moderate';

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&order=relevance&safeSearch=${safeSearch}&videoEmbeddable=true&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      // Return the actual Google API error message so it's debuggable
      return res.status(200).json({ videos: [], error: data.error.message });
    }

    if (!data.items || data.items.length === 0) {
      return res.status(200).json({ videos: [] });
    }

    const videos = data.items
      .filter(item => item.id?.videoId)
      .map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url || '',
        description: item.snippet.description || '',
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        published: item.snippet.publishedAt,
      }));

    res.status(200).json({ videos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
