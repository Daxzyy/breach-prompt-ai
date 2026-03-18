const R_U = process.env.R_U;
const R_T = process.env.R_T;

async function r(cmd, ...args) {
  const res = await fetch(R_U, {
    method: 'POST',
    headers: { Authorization: `Bearer ${R_T}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([cmd, ...args])
  });
  const j = await res.json();
  return j.result;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const { method } = req;

  try {
    if (method === 'POST') {
      const { title, description, content, category_ids } = req.body;
      if (!title || !content) return res.status(400).json({ error: 'Missing fields' });
      const id = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const data = { title, description: description || '', content, category_ids: category_ids || [], created_at: new Date().toISOString() };
      await r('SET', `prompt:${id}`, JSON.stringify(data));
      await r('RPUSH', 'prompts:list', id);
      return res.json({ ok: true, id });
    }

    if (method === 'PUT') {
      const { id, title, description, content, category_ids, created_at } = req.body;
      if (!id || !title || !content) return res.status(400).json({ error: 'Missing fields' });
      const data = { title, description: description || '', content, category_ids: category_ids || [], created_at };
      await r('SET', `prompt:${id}`, JSON.stringify(data));
      return res.json({ ok: true });
    }

    if (method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await r('DEL', `prompt:${id}`);
      await r('LREM', 'prompts:list', 0, id);
      return res.json({ ok: true });
    }

    res.status(405).end();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}
