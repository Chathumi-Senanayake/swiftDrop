// 30-second load test with 1,000 virtual users (NFR-02 / NFR-03).
// Each virtual user keeps loading the event list and checking stock, like real shoppers waiting for a drop.
//
// Run (while docker compose is up):
//   docker run --rm -i --network swiftdrop_default -e BASE_URL=http://nginx grafana/k6 run - < loadtest/k6-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE = __ENV.BASE_URL || 'http://localhost:8080';
const serverErrors = new Rate('server_errors'); // 5xx responses or no response at all

export const options = {
  vus: 1000,
  duration: '30s',
  thresholds: {
    server_errors: ['rate<0.05'], // at least 95% of requests must NOT be a 5xx (uptime >= 95%)
  },
};

// Log in once and share the token with every virtual user
export function setup() {
  const res = http.post(`${BASE}/api/auth/login`, JSON.stringify({ email: 'sarah@example.com', password: 'Customer@123' }), {
    headers: { 'Content-Type': 'application/json' },
  });
  const events = http.get(`${BASE}/api/events`, { headers: { Authorization: `Bearer ${res.json('token')}` } });
  return { token: res.json('token'), eventId: events.json('events.0._id') };
}

export default function (data) {
  const params = { headers: { Authorization: `Bearer ${data.token}` } };
  const responses = [http.get(`${BASE}/api/events`, params), http.get(`${BASE}/api/events/${data.eventId}/stock`, params)];

  for (const r of responses) {
    serverErrors.add(r.status === 0 || r.status >= 500);
    check(r, {
      'no 5xx': (res) => res.status !== 0 && res.status < 500,
      'JSON response': (res) => (res.headers['Content-Type'] || '').includes('application/json'),
    });
  }
  sleep(1);
}
