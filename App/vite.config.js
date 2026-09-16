import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import dns from 'node:dns'

dns.setDefaultResultOrder('ipv4first')

function localChatSyncPlugin() {
  let serverThreads = [];

  return {
    name: 'local-chat-sync',
    configureServer(server) {
      server.middlewares.use('/api/chat/sync', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(serverThreads));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              if (payload.action === 'SYNC_ALL' && Array.isArray(payload.threads)) {
                payload.threads.forEach(t => {
                  const idx = serverThreads.findIndex(st => st.id === t.id);
                  if (idx === -1) {
                    serverThreads.push(t);
                  } else {
                    const existingMsgs = serverThreads[idx].messages || [];
                    const incomingMsgs = t.messages || [];
                    const mergedMsgs = [...existingMsgs];
                    incomingMsgs.forEach(im => {
                      if (!mergedMsgs.some(em => em.id === im.id || (em.text === im.text && em.timestamp === im.timestamp))) {
                        mergedMsgs.push(im);
                      }
                    });
                    serverThreads[idx] = { ...serverThreads[idx], ...t, messages: mergedMsgs };
                  }
                });
              } else if (payload.action === 'MESSAGE' && payload.chatId && payload.message) {
                const idx = serverThreads.findIndex(st => st.id === payload.chatId);
                if (idx !== -1) {
                  const current = serverThreads[idx];
                  if (!current.messages.some(m => m.id === payload.message.id || (m.text === payload.message.text && m.timestamp === payload.message.timestamp))) {
                    current.messages.push(payload.message);
                  }
                  current.lastMessage = payload.message.text;
                  current.lastMessageAt = payload.message.timestamp;
                  current.updatedAt = Date.now();
                } else if (payload.thread) {
                  serverThreads.unshift(payload.thread);
                }
              } else if (payload.action === 'DELETE_THREAD' && payload.threadId) {
                serverThreads = serverThreads.filter(st => st.id !== payload.threadId);
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: serverThreads.length }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        res.statusCode = 404;
        res.end();
      });
    }
  };
}

function loadEnvFile() {
  const envVars = { ...process.env };
  try {
    const envFile = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          envVars[key] = val;
        }
      });
    }
  } catch (err) {
    console.warn('[vite] Erro ao ler .env:', err);
  }
  return envVars;
}

function emailVerificationPlugin() {
  return {
    name: 'email-verification-endpoint',
    configureServer(server) {
      server.middlewares.use('/api/auth/send-verification-code', async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { email, code, name } = JSON.parse(body || '{}');
            if (!email || !code) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'E-mail e código são obrigatórios.' }));
              return;
            }

            const env = loadEnvFile();
            const smtpHost = env.SMTP_HOST || env.VITE_SMTP_HOST;
            const smtpUser = env.SMTP_USER || env.VITE_SMTP_USER;
            const smtpPass = env.SMTP_PASS || env.VITE_SMTP_PASS;
            const smtpPort = Number(env.SMTP_PORT || env.VITE_SMTP_PORT || 587);

            // Anti-Spam: O endereço de e-mail do 'From' deve coincidir exatamente com a conta autenticada no SMTP
            // para passar na validação SPF e DKIM do Gmail/Outlook.
            const authenticatedAddress = (smtpUser && smtpUser.includes('@')) ? smtpUser : 'contato@ivaiconecta.com.br';
            const smtpFrom = env.SMTP_FROM || env.VITE_SMTP_FROM || `"Ivaí Conecta" <${authenticatedAddress}>`;

            console.log(`\n======================================================`);
            console.log(`📧 [Ivaí Conecta] CÓDIGO DE CONFIRMAÇÃO DE E-MAIL`);
            console.log(`   Destinatário: ${email}`);
            console.log(`   Código:       ${code}`);
            console.log(`   Expiração:    10 minutos`);
            if (smtpHost && smtpUser) {
              console.log(`   SMTP Server:  ${smtpHost}:${smtpPort} (Enviando e-mail via ${smtpUser})...`);
            } else {
              console.log(`   Status SMTP:  Nenhum servidor SMTP configurado no .env.`);
              console.log(`                 (Para envio real automático via Gmail/Outlook/etc,`);
              console.log(`                  configure SMTP_HOST, SMTP_USER, SMTP_PASS no .env)`);
            }
            console.log(`======================================================\n`);

            if (smtpHost && smtpUser && smtpPass) {
              try {
                const nodemailer = await import('nodemailer');
                const transporter = nodemailer.createTransport({
                  host: smtpHost || 'smtp.gmail.com',
                  port: smtpPort || 587,
                  secure: smtpPort === 465,
                  auth: {
                    user: smtpUser,
                    pass: smtpPass
                  },
                  connectionTimeout: 4000,
                  greetingTimeout: 4000,
                  socketTimeout: 5000,
                  tls: {
                    rejectUnauthorized: false
                  }
                });

                await transporter.sendMail({
                  from: smtpFrom,
                  to: email,
                  replyTo: authenticatedAddress,
                  subject: `Ivaí Conecta: seu código de verificação é ${code}`,
                  text: `Olá ${name || 'Usuário'}!\n\nSeu código de verificação no Ivaí Conecta é: ${code}\n\nEste código é de uso exclusivo e expira em 10 minutos.\n\nSe você não solicitou este código, ignore esta mensagem com total segurança.\n\nAtenciosamente,\nEquipe Ivaí Conecta — Plataforma Regional de Oportunidades\nVale do Ivaí - PR, Brasil`,
                  headers: {
                    'X-Priority': '1',
                    'X-MSMail-Priority': 'High',
                    'Importance': 'high',
                    'Auto-Submitted': 'auto-generated',
                    'X-Auto-Response-Suppress': 'All',
                    'X-Mailer': 'IvaiConecta Platform'
                  },
                  html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
                      <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #0284c7; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">Ivaí <span style="color: #0f172a;">Conecta</span></h1>
                        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Plataforma de Talentos, Vagas e Serviços do Vale do Ivaí</p>
                      </div>
                      <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #e2e8f0;">
                        <p style="color: #334155; font-size: 15px; margin: 0 0 14px;">Olá <strong>${name || 'Usuário'}</strong>,</p>
                        <p style="color: #64748b; font-size: 14px; margin: 0 0 20px; line-height: 1.5;">Utilize o código de segurança de 6 dígitos abaixo para verificar seu endereço de e-mail no Ivaí Conecta:</p>
                        <div style="display: inline-block; background: #0284c7; color: #ffffff; font-size: 34px; font-weight: 800; letter-spacing: 8px; padding: 14px 32px; border-radius: 10px; margin: 4px 0 16px;">
                          ${code}
                        </div>
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">⏱️ Código válido por 10 minutos. Nunca compartilhe esta chave com terceiros.</p>
                      </div>
                      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;">
                        <p style="margin: 0;"><strong>Ivaí Conecta</strong> — Plataforma Regional de Oportunidades do Vale do Ivaí</p>
                        <p style="margin: 2px 0;">Ivaiporã e Região — Paraná, Brasil</p>
                        <p style="margin: 6px 0 0; color: #cbd5e1;">Você recebeu esta mensagem transacional porque solicitou a verificação do seu e-mail no sistema.</p>
                      </div>
                    </div>
                  `
                });

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ sent: true, provider: 'smtp', email }));
                return;
              } catch (sendErr) {
                console.warn('[SMTP Error] Falha ao enviar via SMTP:', sendErr.message);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  sent: false,
                  reason: 'smtp_error',
                  error: sendErr.message,
                  code
                }));
                return;
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              sent: false,
              reason: 'smtp_not_configured',
              devNotice: 'Código gerado no servidor. Configure SMTP no .env para envio via e-mail real.',
              code
            }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    localChatSyncPlugin(),
    emailVerificationPlugin(),
  ],
})

