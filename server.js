const http = require("http");
const Groq = require("groq-sdk");

const PORT = process.env.PORT || 3000;

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const groq = new Groq({
  apiKey: GROQ_API_KEY
});


const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};


const SYSTEM_PROMPT = `
You are AAMUSTED AI Assistant for Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development (AAMUSTED), Ghana.

Help students with:
- Admissions
- Registration
- Academic information
- Programmes
- Campus services
- Student support

AAMUSTED:
- Campuses: Kumasi and Mampong
- Website: www.aamusted.edu.gh

Programmes include:
Information Technology Education, Business Education, Fashion Design and Textiles, Graphic Design, Building Technology, Electrical/Electronic Engineering Technology, Mechanical Engineering Technology.

Be friendly and helpful.
If you don't know something, say so.
You can also answer general knowledge questions.
`;


const server = http.createServer((req, res) => {

  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }


  if (req.method === "GET" && req.url === "/") {

    res.writeHead(200, CORS_HEADERS);

    res.end(JSON.stringify({
      status: "AAMUSTED AI Backend Running",
      groqKeyLoaded: GROQ_API_KEY.length > 10
    }));

    return;
  }


  if (req.method === "POST" && req.url === "/chat") {

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });


    req.on("end", async () => {

      try {

        const data = JSON.parse(body);

        let messages = data.messages || [];

        const completion = await groq.chat.completions.create({

          model: "llama-3.1-8b-instant",

          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT
            },
            ...messages
          ],

          temperature: 0.7,
          max_tokens: 800

        });


        const reply =
          completion.choices[0].message.content;


        res.writeHead(200, CORS_HEADERS);

        res.end(JSON.stringify({
          reply
        }));


      } catch (error) {

        console.error("Groq Error:", error.message);


        res.writeHead(500, CORS_HEADERS);

        res.end(JSON.stringify({
          error: error.message
        }));

      }

    });

    return;
  }


  res.writeHead(404, CORS_HEADERS);

  res.end(JSON.stringify({
    error: "Not Found"
  }));

});


server.listen(PORT, () => {

  console.log(
    "AAMUSTED AI Backend running on port " + PORT
  );

  console.log(
    "Groq key loaded:",
    GROQ_API_KEY.length > 10
  );

});
