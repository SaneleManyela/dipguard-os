import http from 'k6/http';
import { check, sleep } from 'k6';

// Step 3: Load Testing using K6 to identify bottlenecks before launch
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
};

export default function () {
  // Replace with actual API endpoint
  const url = 'http://localhost:3000/api/health';
  
  const res = http.get(url);
  
  check(res, {
    'is status 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
