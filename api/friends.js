import { createClient } from '@supabase/supabase-js';

const sb = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function getUser(token) {
  if (!token) return null;
  const { data: { user } } = await sb().auth.getUser(token);
  return user;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = await getUser(token);
  if (!user) return res.status(401).json({ error: 'Auth required' });
  const userId = user.id;
  const supabase = sb();

  if (req.method === 'GET') {
    const { action } = req.query;

    if (action === 'list') {
      // Get people I follow
      const { data: following } = await supabase
        .from('friendships')
        .select('following_id, status, profiles!friendships_following_id_fkey(id,username,display_name,avatar_color,streak_count,knowledge_score,tier)')
        .eq('follower_id', userId);

      // Get people following me
      const { data: followers } = await supabase
        .from('friendships')
        .select('follower_id, status, profiles!friendships_follower_id_fkey(id,username,display_name,avatar_color,streak_count,knowledge_score,tier)')
        .eq('following_id', userId);

      return res.status(200).json({ following: following||[], followers: followers||[] });
    }

    if (action === 'search') {
      const q = req.query.q?.trim();
      if (!q) return res.status(200).json({ users: [] });
      const { data: users } = await supabase
        .from('profiles')
        .select('id,username,display_name,avatar_color,streak_count,knowledge_score,tier')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .neq('id', userId)
        .limit(20);
      return res.status(200).json({ users: users||[] });
    }

    if (action === 'activity') {
      // Activity feed from people I follow
      const { data: following } = await supabase
        .from('friendships')
        .select('following_id')
        .eq('follower_id', userId)
        .eq('status', 'accepted');

      const followingIds = (following||[]).map(f => f.following_id);
      if (!followingIds.length) return res.status(200).json({ activities: [] });

      const { data: activities } = await supabase
        .from('activities')
        .select('*, profiles!activities_user_id_fkey(username,display_name,avatar_color,knowledge_score)')
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(50);

      return res.status(200).json({ activities: activities||[] });
    }

    if (action === 'leaderboard') {
      // Weekly leaderboard — me + people I follow, ranked by streak then knowledge score
      const { data: following } = await supabase
        .from('friendships')
        .select('following_id')
        .eq('follower_id', userId);

      const ids = [userId, ...(following||[]).map(f => f.following_id)];
      const { data: users } = await supabase
        .from('profiles')
        .select('id,username,display_name,avatar_color,streak_count,knowledge_score,tier,total_saves')
        .in('id', ids)
        .order('knowledge_score', { ascending: false });

      return res.status(200).json({ users: users||[], myId: userId });
    }
  }

  if (req.method === 'POST') {
    const { action, targetId } = req.body;

    if (action === 'follow') {
      if (targetId === userId) return res.status(400).json({ error: "Can't follow yourself" });
      const { error } = await supabase.from('friendships').upsert({
        follower_id: userId,
        following_id: targetId,
        status: 'accepted', // auto-accept for now (follow model, not friend request)
      });
      if (!error) {
        // Notify via activity
        await supabase.from('activities').insert({
          user_id: userId,
          type: 'follow',
          data: { target_id: targetId },
        });
      }
      return res.status(200).json({ ok: !error, error: error?.message });
    }

    if (action === 'unfollow') {
      await supabase.from('friendships')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetId);
      return res.status(200).json({ ok: true });
    }
  }

  res.status(400).json({ error: 'Unknown action' });
}
