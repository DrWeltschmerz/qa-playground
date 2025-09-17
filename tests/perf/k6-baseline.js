import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  scenarios: {
    baseline: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const base = __ENV.BASE_URL || 'http://localhost:8080';
  const res = http.post(`${base}/v1/ai/complete`, JSON.stringify({ prompt: 'Hi', model: 'adapter-a' }), {
    headers: { 'content-type': 'application/json', 'x-api-key': __ENV.SERVICE_API_KEY || 'service-secret' },
    timeout: '5s'
  });
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has completion': (r) => r.json('completion') !== undefined,
  });
  sleep(0.2);
}
