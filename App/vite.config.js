import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
              const getMsgTimestamp = (m) => {
                if (!m) return 0;
                if (typeof m.createdAt === 'number' && m.createdAt > 0) return m.createdAt;
                if (typeof m.createdAt === 'string') {
                  const p = Date.parse(m.createdAt);
                  if (!isNaN(p)) return p;
                }
                if (m.timestamp && typeof m.timestamp === 'string') {
                  const parts = m.timestamp.split(' - ');
                  if (parts.length === 2) {
                    const d = parts[0].split('/');
                    const t = parts[1].split(':');
                    if (d.length === 3 && t.length >= 2) {
                      const dt = new Date(parseInt(d[2], 10), parseInt(d[1], 10) - 1, parseInt(d[0], 10), parseInt(t[0], 10), parseInt(t[1], 10));
                      if (!isNaN(dt.getTime())) return dt.getTime();
                    }
                  }
                }
                if (typeof m.id === 'string' && m.id.startsWith('m_')) {
                  const segs = m.id.split('_');
                  const ts = parseInt(segs[1], 10);
                  if (!isNaN(ts)) return ts;
                }
                return 0;
              };

              if (payload.action === 'SYNC_ALL' && Array.isArray(payload.threads)) {
                payload.threads.forEach(t => {
                  const idx = serverThreads.findIndex(st => st.id === t.id);
                  if (idx === -1) {
                    const msgs = (t.messages || []).slice().sort((a, b) => getMsgTimestamp(a) - getMsgTimestamp(b));
                    serverThreads.push({ ...t, messages: msgs });
                  } else {
                    const existingMsgs = serverThreads[idx].messages || [];
                    const incomingMsgs = t.messages || [];
                    const mergedMsgs = [...existingMsgs];
                    incomingMsgs.forEach(im => {
                      if (!mergedMsgs.some(em => em.id === im.id || (em.text === im.text && em.timestamp === im.timestamp))) {
                        mergedMsgs.push(im);
                      }
                    });
                    mergedMsgs.sort((a, b) => getMsgTimestamp(a) - getMsgTimestamp(b));
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
                  current.messages.sort((a, b) => getMsgTimestamp(a) - getMsgTimestamp(b));
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

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    localChatSyncPlugin(),
  ],
})
