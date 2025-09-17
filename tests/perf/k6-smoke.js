import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800']
  }
};

export default function () {
  const base = __ENV.BASE_URL || 'http://localhost:8080';
  const res = http.post(`${base}/v1/ai/complete`, JSON.stringify({ prompt: 'Hello', model: 'adapter-a' }), {
    headers: { 'content-type': 'application/json', 'x-api-key': __ENV.SERVICE_API_KEY || 'service-secret' },
    timeout: '3s'
  });
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has completion': (r) => r.json('completion') !== undefined
  });
  sleep(1);
}
