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

async function rGet(key) {
  const res = await fetch(`${R_U}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${R_T}` }
  });
  const j = await res.json();
  return j.result;
}

async function rLrange(key) {
  const res = await fetch(`${R_U}/lrange/${encodeURIComponent(key)}/0/-1`, {
    headers: { Authorization: `Bearer ${R_T}` }
  });
  const j = await res.json();
  return j.result || [];
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const { method } = req;

  try {
    if (method === 'POST') {
      const { id, name } = req.body;
      if (!id || !name) return res.status(400).json({ error: 'Missing fields' });
      const existing = await rGet(`category:${id}`);
      if (existing) return res.status(409).json({ error: 'ID already exists' });
      await r('SET', `category:${id}`, JSON.stringify({ name }));
      await r('SADD', 'categories', id);
      return res.json({ ok: true });
    }

    if (method === 'PUT') {
      const { oldId, id, name } = req.body;
      if (!oldId || !id || !name) return res.status(400).json({ error: 'Missing fields' });
      if (oldId !== id) {
        await r('SREM', 'categories', oldId);
        await r('DEL', `category:${oldId}`);
        const promptIds = await rLrange('prompts:list');
        for (const pid of promptIds) {
          const raw = await rGet(`prompt:${pid}`);
          if (!raw) continue;
          const p = JSON.parse(raw);
          if ((p.category_ids || []).includes(oldId)) {
            p.category_ids = p.category_ids.map(cid => cid === oldId ? id : cid);
            await r('SET', `prompt:${pid}`, JSON.stringify(p));
          }
        }
      }
      await r('SET', `category:${id}`, JSON.stringify({ name }));
      await r('SADD', 'categories', id);
      return res.json({ ok: true });
    }

    if (method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await r('SREM', 'categories', id);
      await r('DEL', `category:${id}`);
      return res.json({ ok: true });
    }

    res.status(405).end();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}
