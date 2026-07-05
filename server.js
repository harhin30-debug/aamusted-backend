const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;

// Accept any of these variable names
const ANTHROPIC_API_KEY = 
  process.env.ANTHROPIC_API_KEY || 
  process.env.Anthropic_key ||
  process.env.ANTHROPIC_KEY ||
  process.env.anthropic_key ||
  process.env.API_KEY || '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const KB = `You are the official AAMUSTED AI Assistant for Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development (AAMUSTED), Ghana. You help students with friendly, accurate, specific answers.

ABOUT AAMUSTED:
- Full name: Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development
- Campuses: Kumasi (main) and Mampong
- Type: Technical University, Ghana
- Website: www.aamusted.edu.gh

PROGRAMMES: Information Technology Education, Fashion Design and Textiles, Graphic Design, Building Technology, Electrical/Electronic Engineering Technology, Mechanical Engineering Technology, Hospitality and Tourism Management, Business Education.

REGISTRATION: New student registration happens in September. Required documents: admission letter, WASSCE results, national ID, passport photo. Portal: students.aamusted.edu.gh. Late registration attracts a penalty fee. Semester 1: September to January. Semester 2: February to June.

CAMPUS SERVICES: Library Mon-Fri 8am-8pm, Sat 9am-4pm. Health Centre Mon-Fri 8am-5pm. Sports Complex, ICT Centre 7am-9pm weekdays, Cafeteria 6:30am-8pm daily. ATM on campus.

GRADING: A 80-100, B 70-79, C 60-69, D 50-59, F below 50. Exams in January and June. Results within 4 weeks.

CONTACTS: registrar@aamusted.edu.gh, admissions@aamusted.edu.gh, bursary@aamusted.edu.gh, deanofstudents@aamusted.edu.gh, ict@aamusted.edu.gh

Be warm, helpful, and conversational. If you do not know something, say so and direct the student to the right office.`;

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, CORS_HEADERS);
    res.end(JSON.stringify({ 
      status: 'AAMUSTED AI Backend is running',
      keyLoaded: ANTHROPIC_API_KEY.length > 10
    }));
    return;
  }

  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { messages } = JSON.parse(body);

        if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY.length < 10) {
          res.writeHead(500, CORS_HEADERS);
          res.end(JSON.stringify({ error: 'API key not configured on server.' }));
          return;
        }

        const payload = JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 800,
          system: KB,
          messages
        });

        const options = {
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Length': Buffer.byteLength(payload)
          }
        };

        const apiReq = https.request(options, apiRes => {
          let data = '';
          apiRes.on('data', chunk => { data += chunk; });
          apiRes.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                res.writeHead(500, CORS_HEADERS);
                res.end(JSON.stringify({ error: parsed.error.message }));
              } else {
                res.writeHead(200, CORS_HEADERS);
                res.end(JSON.stringify({ reply: parsed.content[0].text }));
              }
            } catch (e) {
              res.writeHead(500, CORS_HEADERS);
              res.end(JSON.stringify({ error: 'Failed to parse AI response' }));
            }
          });
        });

        apiReq.on('error', e => {
          res.writeHead(500, CORS_HEADERS);
          res.end(JSON.stringify({ error: 'Could not reach AI server: ' + e.message }));
        });

        apiReq.write(payload);
        apiReq.end();

      } catch (e) {
        res.writeHead(400, CORS_HEADERS);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  res.writeHead(404, CORS_HEADERS);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`AAMUSTED AI backend running on port ${PORT}`);
  console.log(`API key loaded: ${ANTHROPIC_API_KEY.length > 10 ? 'YES' : 'NO - key missing!'}`);
});
            
