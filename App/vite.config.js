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

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    localChatSyncPlugin(),
  ],
})
