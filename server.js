const http = require("http");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite"
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};


const SYSTEM_PROMPT = `
You are AAMUSTED AI Assistant for Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development (AAMUSTED), Ghana.

Your role is to assist students, staff and visitors with accurate and friendly information.

AAMUSTED INFORMATION:
- Full name: Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development.
- Location: Ghana.
- Campuses: Kumasi and Mampong.
- Website: www.aamusted.edu.gh.

PROGRAMMES INCLUDE:
- Information Technology Education
- Business Education
- Fashion Design and Textiles
- Graphic Design
- Building Technology
- Electrical/Electronic Engineering Technology
- Mechanical Engineering Technology
- Hospitality and Tourism Management

STUDENT SERVICES:
- Library services
- ICT Centre
- Health Centre
- Sports activities
- Cafeteria
- Student support services

REGISTRATION:
Students should use the university student portal for registration.
New students complete registration after admission.

GRADING:
A: 80-100
B: 70-79
C: 60-69
D: 50-59
F: Below 50

Always answer politely.
For information you don't know, advise the student to contact the appropriate university office.

You can also answer normal general knowledge questions.
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
      geminiKeyLoaded: GEMINI_API_KEY.length > 10
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

        let userMessage = "";


        if (Array.isArray(data.messages)) {

          const lastMessage =
            data.messages[data.messages.length - 1];

          userMessage = lastMessage.content;

        } 
        
        else if (data.message) {

          userMessage = data.message;

        }


        console.log("User question:", userMessage);


        const result = await model.generateContent(
          SYSTEM_PROMPT +
          "\n\nStudent Question:\n" +
          userMessage
        );


        const reply = result.response.text();


        console.log("Gemini reply:", reply);


        res.writeHead(200, CORS_HEADERS);

        res.end(JSON.stringify({
          reply: reply
        }));


      } catch (error) {

        console.error("Gemini Error:", error);


        res.writeHead(500, CORS_HEADERS);

        res.end(JSON.stringify({
          error: "Gemini failed: " + error.message
        }));

      }

    });

    return;
  }


  res.writeHead(404, CORS_HEADERS);

  res.end(JSON.stringify({
    error: "Route not found"
  }));

});


server.listen(PORT, () => {

  console.log(
    `AAMUSTED AI Backend running on port ${PORT}`
  );

  console.log(
    "Gemini key loaded:",
    GEMINI_API_KEY.length > 10
  );

});
