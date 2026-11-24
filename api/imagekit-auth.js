const crypto = require('crypto');

async function verifyFirebaseUser(req) {
  const authorization = String(req.headers.authorization || '');
  const idToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!idToken || !apiKey) return null;

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!response.ok) return null;
  const payload = await response.json();
  return payload.users?.[0]?.localId || null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const uid = await verifyFirebaseUser(req);
  if (!uid) return res.status(401).json({ error: 'Sessão inválida ou expirada.' });

  const requestedUid = String(req.body?.uid || '');
  if (requestedUid !== uid) return res.status(403).json({ error: 'Você só pode enviar arquivos para a própria conta.' });

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return res.status(503).json({ error: 'ImageKit não configurado no servidor.' });
  }

  const folder = String(req.body?.folder || '').replace(/\/+$/, '');
  const allowedRoot = `ivai-conecta/users/${uid}`;
  if ((folder !== allowedRoot && !folder.startsWith(`${allowedRoot}/`)) || folder.includes('..')) {
    return res.status(403).json({ error: 'Pasta de envio inválida.' });
  }

  const kind = String(req.body?.kind || 'avatar');
  if (!['avatar', 'cover', 'job', 'post', 'ad'].includes(kind)) {
    return res.status(400).json({ error: 'Tipo de imagem inválido.' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const expire = Math.floor(Date.now() / 1000) + 300;
  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(`${token}${expire}`)
    .digest('hex');

  return res.status(200).json({ publicKey, token, expire, signature, folder });
};
