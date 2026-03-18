import { createClient } from '@supabase/supabase-js';

const sb = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function getUser(token) {
  const { data: { user } } = await sb().auth.getUser(token);
  return user;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = await getUser(token);
  if (!user) return res.status(401).json({ error: 'Auth required' });
  const userId = user.id;
  const supabase = sb();

  if (req.method === 'GET') {
    const { action, threadId } = req.query;

    if (action === 'threads') {
      const { data: threads } = await supabase
        .from('dm_threads')
        .select('*')
        .contains('participant_ids', [userId])
        .order('last_message_at', { ascending: false });

      if (!threads?.length) return res.status(200).json({ threads: [] });

      // Enrich with other participant profiles and last message
      const enriched = await Promise.all(threads.map(async (t) => {
        const otherId = t.participant_ids.find(id => id !== userId);
        const { data: profile } = await supabase
          .from('profiles')
          .select('id,username,display_name,avatar_color')
          .eq('id', otherId).single();
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content,media,created_at,sender_id')
          .eq('thread_id', t.id)
          .order('created_at', { ascending: false }).limit(1).single();
        const unreadCount = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('thread_id', t.id)
          .not('read_by', 'cs', `{${userId}}`);
        return { ...t, otherUser: profile, lastMessage: lastMsg, unread: unreadCount.count || 0 };
      }));

      return res.status(200).json({ threads: enriched });
    }

    if (action === 'messages' && threadId) {
      // Verify user is participant
      const { data: thread } = await supabase
        .from('dm_threads').select('participant_ids').eq('id', threadId).single();
      if (!thread?.participant_ids?.includes(userId)) return res.status(403).json({ error: 'Not a participant' });

      const { data: messages } = await supabase
        .from('messages')
        .select('*, profiles!messages_sender_id_fkey(id,username,display_name,avatar_color)')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      // Mark all as read
      const unreadIds = (messages||[])
        .filter(m => !m.read_by?.includes(userId))
        .map(m => m.id);
      if (unreadIds.length) {
        for (const id of unreadIds) {
          await supabase.rpc('array_append_unique', { row_id: id, user_id: userId })
            .catch(() => null);
          // Fallback manual update
          const msg = messages.find(m => m.id === id);
          if (msg) {
            await supabase.from('messages').update({
              read_by: [...(msg.read_by||[]), userId]
            }).eq('id', id);
          }
        }
      }

      return res.status(200).json({ messages: messages||[] });
    }
  }

  if (req.method === 'POST') {
    const { action } = req.body;

    if (action === 'send') {
      const { recipientId, content, media } = req.body;
      if (!recipientId) return res.status(400).json({ error: 'recipientId required' });

      // Find or create thread
      const { data: existing } = await supabase
        .from('dm_threads')
        .select('id')
        .contains('participant_ids', [userId, recipientId])
        .limit(1);

      let threadId = existing?.[0]?.id;
      if (!threadId) {
        const { data: newThread } = await supabase
          .from('dm_threads')
          .insert({ participant_ids: [userId, recipientId] })
          .select('id').single();
        threadId = newThread?.id;
      }

      if (!threadId) return res.status(500).json({ error: 'Could not create thread' });

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          sender_id: userId,
          content: content || null,
          media: media || null,
          read_by: [userId],
        })
        .select('*, profiles!messages_sender_id_fkey(id,username,display_name,avatar_color)')
        .single();

      // Update thread last_message_at
      await supabase.from('dm_threads').update({ last_message_at: new Date().toISOString() }).eq('id', threadId);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ message, threadId });
    }
  }

  res.status(400).json({ error: 'Unknown action' });
}
