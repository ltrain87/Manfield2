import { createClient } from '@supabase/supabase-js';

const sb = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  const supabase = sb();

  if (req.method === 'GET') {
    const { username, userId } = req.query;
    const query = supabase.from('profiles').select('id,username,display_name,avatar_color,bio,tier,streak_count,knowledge_score,total_saves,created_at');
    if (username) query.eq('username', username);
    else if (userId) query.eq('id', userId);
    else {
      // Get own profile
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return res.status(401).json({ error: 'Auth required' });
      query.eq('id', user.id);
    }
    const { data, error } = await query.single();
    if (error) return res.status(404).json({ error: 'Profile not found' });

    // Get goals count
    const { count: goalsCount } = await supabase.from('goals').select('id', { count: 'exact', head: true }).eq('user_id', data.id);
    const { count: followersCount } = await supabase.from('friendships').select('id', { count: 'exact', head: true }).eq('following_id', data.id).eq('status', 'accepted');
    const { count: followingCount } = await supabase.from('friendships').select('id', { count: 'exact', head: true }).eq('follower_id', data.id);

    return res.status(200).json({ ...data, goalsCount: goalsCount||0, followersCount: followersCount||0, followingCount: followingCount||0 });
  }

  if (req.method === 'POST') {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return res.status(401).json({ error: 'Auth required' });
    const { display_name, username, bio, avatar_color } = req.body;
    const updates = {};
    if (display_name) updates.display_name = display_name;
    if (username) {
      const clean = username.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
      const { data: existing } = await supabase.from('profiles').select('id').eq('username', clean).neq('id', user.id).single();
      if (existing) return res.status(400).json({ error: 'Username taken' });
      updates.username = clean;
    }
    if (bio !== undefined) updates.bio = bio;
    if (avatar_color) updates.avatar_color = avatar_color;
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
