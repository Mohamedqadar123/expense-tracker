import dgram from 'node:dgram';

const DEV_FRONTEND_PORT = 5173;

let lanAppUrl = null;

// Local development only: finds this machine's address on the local network,
// so a link in an email also opens on a phone on the same Wi-Fi ("localhost"
// there would mean the phone itself). Connecting a UDP socket sends nothing;
// it only makes the OS pick the network interface that leads outwards, which
// skips virtual adapters. Leaves the localhost fallback in place when offline.
export function detectLanAppUrl() {
  return new Promise((resolve) => {
    const socket = dgram.createSocket('udp4');
    socket.on('error', () => {
      socket.close();
      resolve(null);
    });
    socket.connect(53, '8.8.8.8', () => {
      lanAppUrl = `http://${socket.address().address}:${DEV_FRONTEND_PORT}`;
      socket.close();
      resolve(lanAppUrl);
    });
  });
}

// Public URL of the frontend, used to build links in emails: APP_URL, else the
// first allowed CORS origin, else (local development with neither set) this
// machine's local-network address when known, else localhost.
export function getAppUrl() {
  const configured = process.env.APP_URL || (process.env.CORS_ORIGIN || '').split(',')[0].trim();
  return (configured || lanAppUrl || `http://localhost:${DEV_FRONTEND_PORT}`).replace(/\/$/, '');
}
