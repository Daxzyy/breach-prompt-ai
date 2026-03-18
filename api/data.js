const R_U = process.env.R_U;
const R_T = process.env.R_T;

async function rFetch(path) {
  const res = await fetch(`${R_U}${path}`, {
    headers: { Authorization: `Bearer ${R_T}` }
  });
  const j = await res.json();
  return j.result;
}

async function mget(keys) {
  if (!keys.length) return [];
  return rFetch(`/mget/${keys.map(k => encodeURIComponent(k)).join('/')}`);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const [catIds, promptIds] = await Promise.all([
      rFetch('/smembers/categories'),
      rFetch('/lrange/prompts%3Alist/0/-1')
    ]);

    const cats = [];
    if (catIds?.length) {
      const vals = await mget(catIds.map(id => `category:${id}`));
      catIds.forEach((id, i) => {
        try { const d = JSON.parse(vals[i] || '{}'); if (d.name) cats.push({ id, ...d }); } catch {}
      });
    }

    const prompts = [];
    if (promptIds?.length) {
      const vals = await mget(promptIds.map(id => `prompt:${id}`));
      promptIds.forEach((id, i) => {
        try { const d = JSON.parse(vals[i] || '{}'); if (d.title) prompts.push({ id, ...d }); } catch {}
      });
    }

    res.json({ cats, prompts });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load data' });
  }
}
