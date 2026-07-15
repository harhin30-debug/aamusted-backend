const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

const KB = `
You are AAMUSTED AI Assistant for Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development (AAMUSTED), Ghana.

You help students with friendly and accurate answers.

ABOUT AAMUSTED:
- Full name: Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development
- Campuses: Kumasi and Mampong
- Website: www.aamusted.edu.gh

PROGRAMMES:
Information Technology Education, Fashion Design and Textiles, Graphic Design, Building Technology, Electrical/Electronic Engineering Technology, Mechanical Engineering Technology, Hospitality and Tourism Management, Business Education.

REGISTRATION:
New students register mainly in September.
Students should have admission letter, WASSCE results, national ID and passport photo.
Student portal: students.aamusted.edu.gh

SEMESTERS:
Semester 1: September to January.
Semester 2: February to June.

CAMPUS SERVICES:
Library, ICT Centre, Health Centre, Sports Complex, Cafeteria and ATM services.

GRADING:
A = 80-100
B = 70-79
C = 60-69
D = 50-59
F = Below 50

CONTACT:
registrar@aamusted.edu.gh
admissions@aamusted.edu.gh
ict@aamusted.edu.gh

Be polite, helpful and conversational.
If you do not know an answer, advise the student to contact the appropriate university office.
`;

function callGemini(prompt, callback) {

  const data = JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: KB + "\n\nStudent Question:\n" + prompt
          }
        ]
      }
    ]
  });

  const options = {
    hostname: "generativelanguage.googleapis.com",
    path:
      "/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      GEMINI_API_KEY,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data)
    }
  };


  const request = https.request(options, response => {

    let result = "";

    response.on("data", chunk => {
      result += chunk;
    });


    response.on("end", () => {

      try {

        const json = JSON.parse(result);

        if (json.error) {
          callback(null, json.error.message);
          return;
        }

        const reply =
          json.candidates[0].content.parts[0].text;

        callback(reply, null);

      } catch (error) {

        callback(null, "Failed to read Gemini response");

      }

    });

  });


  request.on("error", error => {
    callback(null, error.message);
  });


  request.write(data);
  request.end();

}



const server = http.createServer((req, res) => {


  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }


  if (req.method === "GET" && req.url === "/") {

    res.writeHead(200, CORS_HEADERS);

    res.end(JSON.stringify({
      status: "AAMUSTED AI Backend is running",
      geminiKeyLoaded: GEMINI_API_KEY.length > 10
    }));

    return;
  }



  if (req.method === "POST" && req.url === "/chat") {

    let body = "";


    req.on("data", chunk => {
      body += chunk;
    });


    req.on("end", () => {


      try {

        const data = JSON.parse(body);

        let message = "";


        if (data.messages && Array.isArray(data.messages)) {

          const last =
            data.messages[data.messages.length - 1];

          message = last.content || "";

        }

        else if (data.message) {

          message = data.message;

        }



        if (!GEMINI_API_KEY) {

          res.writeHead(500, CORS_HEADERS);

          res.end(JSON.stringify({
            error: "Gemini API key missing"
          }));

          return;
        }



        callGemini(message, (reply, error) => {


          res.writeHead(
            error ? 500 : 200,
            CORS_HEADERS
          );


          res.end(JSON.stringify({

            reply: error || reply

          }));


        });



      }

      catch(error) {

        res.writeHead(400, CORS_HEADERS);

        res.end(JSON.stringify({
          error: "Invalid request"
        }));

      }


    });


    return;

  }



  res.writeHead(404, CORS_HEADERS);

  res.end(JSON.stringify({
    error: "Not found"
  }));

});



server.listen(PORT, () => {

  console.log(
    "AAMUSTED AI Backend running on port " + PORT
  );

  console.log(
    "Gemini key loaded:",
    GEMINI_API_KEY.length > 10
  );

});
