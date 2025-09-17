import { sleep } from 'k6';
import http from 'k6/http';

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.03'],
    http_req_duration: ['p(95)<1500'],
  },
};

export default function () {
  const base = __ENV.BASE_URL || 'http://localhost:8080';
  http.post(`${base}/v1/ai/complete`, JSON.stringify({ prompt: 'Load', model: 'adapter-b' }), {
    headers: { 'content-type': 'application/json', 'x-api-key': __ENV.SERVICE_API_KEY || 'service-secret' },
    timeout: '5s'
  });
  sleep(0.1);
}
