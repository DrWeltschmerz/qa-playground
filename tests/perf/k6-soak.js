import { sleep } from 'k6';
import http from 'k6/http';

export const options = {
  scenarios: {
    soak: {
      executor: 'constant-vus',
      vus: 15,
      duration: '30m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1200'],
  },
};

export default function () {
  const base = __ENV.BASE_URL || 'http://localhost:8080';
  http.get(`${base}/healthz`, { timeout: '3s' });
  sleep(1);
}
