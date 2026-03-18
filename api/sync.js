import { createClient } from '@supabase/supabase-js';

const getSupabase = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No auth token' });

  const token = authHeader.replace('Bearer ', '');
  const supabase = getSupabase();

  // Verify token and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

  const userId = user.id;

  if (req.method === 'POST') {
    const { type, data } = req.body;

    if (type === 'signals') {
      // Upsert signals — keep last 200
      const signals = (data.signals || []).slice(0, 200).map(s => ({
        user_id: userId,
        keyword: s.kw,
        signal_type: s.type,
        weight: s.weight,
        created_at: new Date(s.ts).toISOString(),
      }));

      // Delete old signals beyond 200
      await supabase.from('signals').delete().eq('user_id', userId).lt('created_at',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

      if (signals.length) {
        await supabase.from('signals').upsert(signals);
      }

      // Update knowledge score
      const score = signals.reduce((acc, s) => acc + s.weight, 0);
      await supabase.from('profiles').update({
        knowledge_score: Math.round(score),
        updated_at: new Date().toISOString()
      }).eq('id', userId);

      return res.status(200).json({ ok: true });
    }

    if (type === 'saved') {
      const items = data.items || [];
      await supabase.from('saved_items').delete().eq('user_id', userId);
      if (items.length) {
        const rows = items.map(item => ({
          user_id: userId,
          item_id: item.id,
          title: item.title,
          source: item.source,
          url: item.url,
          thumb: item.thumb || null,
          icon: item.icon || null,
        }));
        await supabase.from('saved_items').insert(rows);
      }
      await supabase.from('profiles').update({ total_saves: items.length }).eq('id', userId);
      return res.status(200).json({ ok: true });
    }

    if (type === 'goals') {
      const goals = data.goals || [];
      await supabase.from('goals').delete().eq('user_id', userId);
      if (goals.length) {
        const rows = goals.map(g => ({
          user_id: userId,
          goal: g.goal,
          active: g.active,
          added_at: g.addedDate ? new Date(g.addedDate).toISOString() : new Date().toISOString(),
        }));
        await supabase.from('goals').insert(rows);
      }
      return res.status(200).json({ ok: true });
    }

    if (type === 'streak') {
      await supabase.from('profiles').update({
        streak_count: data.streak,
        streak_last_date: data.lastDate,
      }).eq('id', userId);
      return res.status(200).json({ ok: true });
    }

    if (type === 'activity') {
      await supabase.from('activities').insert({
        user_id: userId,
        type: data.actType,
        data: data.payload || {},
      });
      return res.status(200).json({ ok: true });
    }
  }

  if (req.method === 'GET') {
    const { type } = req.query;

    if (type === 'profile') {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      const { data: goals } = await supabase.from('goals').select('*').eq('user_id', userId);
      const { data: signals } = await supabase.from('signals')
        .select('keyword,signal_type,weight,created_at')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(200);
      const { data: saved } = await supabase.from('saved_items').select('*').eq('user_id', userId);
      return res.status(200).json({ profile, goals: goals||[], signals: signals||[], saved: saved||[] });
    }
  }

  res.status(400).json({ error: 'Unknown sync type' });
}
