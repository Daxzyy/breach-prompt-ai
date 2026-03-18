export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    R_U: process.env.R_U,
    R_T: process.env.R_T,
  });
}
