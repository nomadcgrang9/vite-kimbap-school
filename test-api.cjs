// 간단한 API 테스트 서버
const http = require('http');
const https = require('https');
const url = require('url');

const SUPABASE_URL = 'https://xzhbhrhihtfkuvcltpsw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6aGJocmhpaHRma3V2Y2x0cHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcxNjQ5MjAsImV4cCI6MjA0Mjc0MDkyMH0.s-vJdCEAL2gKx7pqxH_yRSsO_aDm8gSNRNph_yYIpgM'

// HTTPS 요청 헬퍼
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  console.log(`${req.method} ${path}`);
  
  try {
    // /tables/assignments 요청 처리
    if (path.startsWith('/tables/')) {
      const tableName = path.split('/')[2];
      const queryString = parsedUrl.search || '';
      
      let supabaseUrl = `${SUPABASE_URL}/rest/v1/${tableName}${queryString}`;
      console.log('Supabase 요청:', supabaseUrl);
      
      const data = await makeRequest(supabaseUrl);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }
    
    // /api/* 요청 처리
    if (path.startsWith('/api/')) {
      const apiPath = path.replace('/api/', '');
      
      let supabaseUrl;
      switch (apiPath) {
        case 'assignments':
          supabaseUrl = `${SUPABASE_URL}/rest/v1/assignments?select=*&order=assigned_at.desc`;
          break;
        case 'sessions':
          supabaseUrl = `${SUPABASE_URL}/rest/v1/sessions?select=*&order=created_at.desc`;
          break;
        default:
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'API Test Server', timestamp: new Date().toISOString() }));
          return;
      }
      
      console.log('Supabase 요청:', supabaseUrl);
      const data = await makeRequest(supabaseUrl);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        data: data,
        error: null
      }));
      return;
    }
    
    // 기본 응답
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Test API Server Running', path }));
    
  } catch (error) {
    console.error('API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(3002, '0.0.0.0', () => {
  console.log('API 테스트 서버가 포트 3002에서 실행 중입니다');
});