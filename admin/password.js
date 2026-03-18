const R_U = process.env.R_U;
const R_T = process.env.R_T;

async function rGet(key) {
  const res = await fetch(`${R_U}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${R_T}` }
  });
  const j = await res.json();
  return j.result;
}

async function rSet(key, val) {
  const res = await fetch(`${R_U}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${R_T}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', key, typeof val === 'string' ? val : JSON.stringify(val)])
  });
  const j = await res.json();
  return j.result;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();

  const { username, oldPassword, newPassword } = req.body;
  if (!username || !oldPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password too short' });

  try {
    const stored = await rGet(`admin:user:${username}`);
    if (!stored) return res.status(401).json({ error: 'User not found' });
    const data = JSON.parse(stored);
    if (data.password !== oldPassword) return res.status(401).json({ error: 'Wrong password' });
    data.password = newPassword;
    await rSet(`admin:user:${username}`, data);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}
