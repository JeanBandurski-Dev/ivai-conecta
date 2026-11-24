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
  if (String(req.body?.uid || '') !== uid) {
    return res.status(403).json({ error: 'Você só pode excluir arquivos da própria conta.' });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const fileId = String(req.body?.fileId || '').trim();
  if (!privateKey) return res.status(503).json({ error: 'ImageKit não configurado no servidor.' });
  if (!fileId) return res.status(400).json({ error: 'Identificador do arquivo ausente.' });

  const response = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`,
    },
  });
  if (!response.ok) {
    const payload = await response.text();
    return res.status(response.status).json({ error: payload || 'Falha ao excluir o arquivo no ImageKit.' });
  }
  return res.status(200).json({ success: true });
};
