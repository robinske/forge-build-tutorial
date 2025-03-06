const WebSocket = require("ws");
const OpenAI = require("openai");
require("dotenv").config();

const wss = new WebSocket.Server({ port: 8080 });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sessions = new Map();

async function aiResponse(messages) {
  let completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages,
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
        let callSid = message.callSid;
        console.log(
          `Setup initiated for call from **${message.from.slice(-2)}`
        );
        console.log(`Call SID: ${callSid}`);

        // Initialize conversation history for the new client
        ws.callSid = callSid;
        sessions.set(callSid, [
          { role: "system", content: "You are a helpful assistant." },
        ]);
        break;
      case "prompt":
        let prompt = message.voicePrompt;
        console.log("Prompt: ", prompt);

        // Retrieve and update conversation history
        let conversation = sessions.get(ws.callSid);
        conversation.push({ role: "user", content: prompt });

        let response = await aiResponse(conversation);
        console.log("AI Response: ", response);

        // Add AI response to conversation history
        conversation.push({ role: "assistant", content: response });

        ws.send(
          JSON.stringify({
            type: "text",
            token: response,
            last: true,
          })
        );
        break;
      case "interrupt":
        console.log("Response interrupted: " + JSON.stringify(message));
        break;
      case "error":
        console.log("Error");
        break;
      default:
        console.log("Unknown message type");
        break;
    }
  });

  // Clean up conversation history when call ends
  ws.on("close", () => {
    console.log("Client has disconnected.");
    sessions.delete(ws.callSid);
  });
});

console.log("WebSocket server is running on wss://localhost:8080");
