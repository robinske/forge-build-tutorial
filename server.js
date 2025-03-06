// run this file `node server.js`
// run `ngrok http 8080`
// replace the url below with your ngrok url
// create twiml bin with the following
// connect your phone number to this twiml bin
// <?xml version="1.0" encoding="UTF-8"?>
// <Response>
//   <Connect>
//     <ConversationRelay url="wss://cr.ngrok.pizza/" welcomeGreeting="Hi! Ask me anything!" />
//   </Connect>
// </Response>


const WebSocket = require("ws");
const OpenAI = require("openai");
require("dotenv").config();

const wss = new WebSocket.Server({ port: 8080 });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function aiResponse(prompt) {
  let completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: prompt,
      },
    ],
    store: true,
  });
  return completion.choices[0].message.content;
}

wss.on("connection", (ws) => {
  console.log("New client connected");

  // Listener for call information and conversation
  ws.on("message", async (data) => {
    let message = JSON.parse(data);
    console.log("Message type: ", message.type);

    switch (message.type) {
      case "setup":
        console.log(`Setup initiated for number **${message.from.slice(-2)}`);
        console.log(`Call SID: ${message.callSid}`);
        break;
      case "prompt":
        let prompt = message.voicePrompt;
        console.log("Prompt: ", prompt);

        let response = await aiResponse(prompt);
        console.log("AI Response: ", response);

        ws.send(
          JSON.stringify({
            type: "text",
            token: response,
            last: true,
          })
        );
        break;
      case "interrupt":
        console.log("Response interrupted");
        break;
      case "error":
        console.log("Error");
        break;
      default:
        console.log("Unknown message type");
        break;
    }
  });

  // When call ends
  ws.on("close", () => {
    console.log("Client has disconnected.");
  });
});

console.log("WebSocket server is running on wss://localhost:8080");