const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const KB = `
You are AAMUSTED AI Assistant.

Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development (AAMUSTED) is a public university in Ghana with campuses at Kumasi and Mampong.

You help students with:

- Admissions
- Registration
- Academic information
- Programmes
- Campus services
- Student life

Answer normal general knowledge questions as well.

Use AAMUSTED information when relevant.
`;

const HEADERS = {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
"Access-Control-Allow-Headers": "Content-Type",
"Content-Type": "application/json"
};

function askGemini(question, callback) {

const prompt = `${KB}

Student Question:
${question}`;

const payload = JSON.stringify({
contents: [
{
parts: [
{
text: prompt
}
]
}
]
});

const options = {
hostname: "generativelanguage.googleapis.com",
path: "/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}",
method: "POST",
headers: {
"Content-Type": "application/json",
"Content-Length": Buffer.byteLength(payload)
}
};

const req = https.request(options, (apiRes) => {

let data = "";

apiRes.on("data", chunk => {
  data += chunk;
});

apiRes.on("end", () => {

  console.log("Gemini Response:", data);

  try {

    const json = JSON.parse(data);

    const answer =
      json.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      callback("I could not generate a response.");
      return;
    }

    callback(answer);

  } catch (err) {

    console.error(err);
    callback("Error reading Gemini response.");

  }

});

});

req.on("error", err => {

console.error(err);
callback("Error contacting Gemini.");

});

req.write(payload);
req.end();
}

const server = http.createServer((req, res) => {

if (req.method === "OPTIONS") {
res.writeHead(204, HEADERS);
return res.end();
}

if (req.method === "GET" && req.url === "/") {

res.writeHead(200, HEADERS);

return res.end(JSON.stringify({
  status: "AAMUSTED AI Backend Running",
  geminiKeyLoaded: GEMINI_API_KEY.length > 10
}));

}

if (req.method === "POST" && req.url === "/chat") {

let body = "";

req.on("data", chunk => {
  body += chunk;
});

req.on("end", () => {

  try {

    const parsed = JSON.parse(body);

    const question =
      parsed.message ||
      parsed.messages?.[parsed.messages.length - 1]?.content ||
      "";

    askGemini(question, (reply) => {

      res.writeHead(200, HEADERS);

      res.end(JSON.stringify({
        reply
      }));

    });

  } catch {

    res.writeHead(400, HEADERS);

    res.end(JSON.stringify({
      error: "Invalid request"
    }));

  }

});

return;

}

res.writeHead(404, HEADERS);

res.end(JSON.stringify({
error: "Not Found"
}));
});

server.listen(PORT, () => {
console.log("AAMUSTED AI Backend running on port", PORT);
console.log("Gemini Key Loaded:", GEMINI_API_KEY.length > 10);
});
