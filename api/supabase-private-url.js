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

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_PRIVATE_BUCKET;
  if (!supabaseUrl || !serviceRoleKey || !bucket) {
    return res.status(503).json({ error: 'Supabase privado não configurado no servidor.' });
  }

  const privateReference = String(req.body?.privateReference || '');
  const expectedPrefix = `supabase://${bucket}/users/${uid}/`;
  if (!privateReference.startsWith(expectedPrefix)) {
    return res.status(403).json({ error: 'Você não pode acessar este documento privado.' });
  }
  const path = privateReference.slice(`supabase://${bucket}/`.length);

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/sign/${encodeURIComponent(bucket)}`,
    {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expiresIn: 3600,
        paths: [path],
      }),
    }
  );
  if (!response.ok) {
    const payload = await response.text();
    return res.status(response.status).json({ error: payload || 'Falha ao gerar acesso ao documento.' });
  }
  const payload = await response.json();
  const signedPath = Array.isArray(payload) ? payload[0]?.signedURL : payload?.signedURL;
  if (!signedPath) return res.status(502).json({ error: 'Supabase não retornou uma URL assinada.' });

  return res.status(200).json({
    url: `${supabaseUrl.replace(/\/$/, '')}${signedPath.startsWith('/') ? '' : '/'}${signedPath}`,
  });
};
