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
    return res.status(403).json({ error: 'Você só pode enviar documentos para a própria conta.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_PRIVATE_BUCKET;
  if (!supabaseUrl || !serviceRoleKey || !bucket) {
    return res.status(503).json({ error: 'Supabase privado não configurado no servidor.' });
  }

  const allowedDocTypes = new Set(['student_proof', 'cnpj_proof', 'resume', 'document']);
  const docType = String(req.body?.docType || 'document');
  if (!allowedDocTypes.has(docType)) return res.status(400).json({ error: 'Tipo de documento inválido.' });

  const contentType = String(req.body?.contentType || '');
  const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
  if (!allowedTypes.has(contentType)) return res.status(400).json({ error: 'Formato de documento inválido.' });

  const fileName = String(req.body?.fileName || 'documento').replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileBase64 = String(req.body?.fileBase64 || '');
  if (!fileBase64) return res.status(400).json({ error: 'Arquivo ausente.' });

  let buffer;
  try {
    buffer = Buffer.from(fileBase64, 'base64');
  } catch {
    return res.status(400).json({ error: 'Arquivo inválido.' });
  }
  if (!buffer.length || buffer.length > 10 * 1024 * 1024) {
    return res.status(413).json({ error: 'O documento excede o limite máximo permitido de 10MB.' });
  }

  const path = `users/${uid}/${docType}_${Date.now()}_${fileName}`;
  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${encodeURIComponent(bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`,
    {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: buffer,
    }
  );
  if (!response.ok) {
    const payload = await response.text();
    return res.status(response.status).json({ error: payload || 'Falha ao enviar o documento privado.' });
  }

  return res.status(200).json({
    privateReference: `supabase://${bucket}/${path}`,
  });
};
