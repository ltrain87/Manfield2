export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { goal = 'software engineer', type = 'video', offset = '0', safe = '' } = req.query;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'YouTube API key not configured' });

  // Smarter, more specific query variations so feed feels fresh each load
  const shortQueries = [
    `${goal} tips beginner`,
    `${goal} day in the life`,
    `how to become ${goal}`,
    `${goal} advice`,
    `${goal} journey`,
  ];

  const longQueries = [
    `${goal} full guide 2024`,
    `${goal} complete tutorial`,
    `${goal} roadmap how to start`,
    `${goal} career path`,
  ];

  const idx = parseInt(offset) % 4;
  const query = type === 'short' ? shortQueries[idx] : longQueries[idx];

  try {
    const safeSearch = safe === 'strict' ? '&safeSearch=strict' : '&safeSearch=moderate';
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${type === 'short' ? 8 : 5}&order=relevance${safeSearch}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    if (!data.items || data.items.length === 0) {
      return res.status(200).json({ videos: [] });
    }

    const videos = data.items
      .filter(item => item.id && item.id.videoId)
      .map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.maxres?.url
          || item.snippet.thumbnails?.high?.url
          || item.snippet.thumbnails?.medium?.url
          || item.snippet.thumbnails?.default?.url
          || '',
        description: item.snippet.description,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        published: item.snippet.publishedAt,
      }));

    res.status(200).json({ videos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
