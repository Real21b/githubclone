import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 }, // 10 saniyede 20 sanal kullanıcıya çık
    { duration: '30s', target: 20 }, // 30 saniye boyunca 20 kullanıcıyla devam et
    { duration: '5s', target: 0 },   // 5 saniyede kullanıcıları sıfırla
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // İsteklerin %95'i 500ms altında olmalı
  },
};

export default function () {
  const url = 'http://backend:3000/graphql'; // Docker network içindeki servis adını kullanıyoruz!
  const query = `
    query {
      getHealth {
        status
      }
    }
  `;

  const headers = { 'Content-Type': 'application/json' };
  const res = http.post(url, JSON.stringify({ query: query }), { headers: headers });

  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
