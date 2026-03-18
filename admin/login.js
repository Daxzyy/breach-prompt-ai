const R_U = process.env.R_U;
const R_T = process.env.R_T;

async function rGet(key) {
  const res = await fetch(`${R_U}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${R_T}` }
  });
  const j = await res.json();
  return j.result;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();

  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const stored = await rGet(`admin:user:${username}`);
    if (!stored) return res.status(401).json({ error: 'Invalid credentials' });
    const data = JSON.parse(stored);
    if (data.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ ok: true, username });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}
