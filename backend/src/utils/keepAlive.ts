import http from 'http';
import https from 'https';

const BACKEND_URL = process.env.RENDER_EXTERNAL_URL || 'https://campusconnect-7xaa.onrender.com';

export function startKeepAlive() {
  const TEN_MINUTES = 10 * 60 * 1000;

  setInterval(() => {
    try {
      const healthUrl = `${BACKEND_URL}/health`;
      const client = healthUrl.startsWith('https') ? https : http;

      client
        .get(healthUrl, (res) => {
          console.log(`💓 Keep-alive ping sent to ${healthUrl} [Status: ${res.statusCode}]`);
        })
        .on('error', (err) => {
          console.error('⚠️ Keep-alive ping error:', err.message);
        });
    } catch (err) {
      console.error('⚠️ Keep-alive execution error:', err);
    }
  }, TEN_MINUTES);

  console.log(`⚡ Keep-alive heartbeat started for 24/7 uptime targeting ${BACKEND_URL}`);
}
