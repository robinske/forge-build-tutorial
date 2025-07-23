# Forge ConversationRelay - Voice Assistant with Twilio and OpenAI

This application demonstrates how to use Node.js, [Twilio Voice](https://www.twilio.com/docs/voice) and [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay), and the [OpenAI API](https://platform.openai.com/api-keys) to create a voice assistant that can engage in two-way conversations over a phone call. 

This repository includes progressive tutorials that demonstrate advanced features such as conversation history, streaming responses, tool/function calling, and conversational intelligence.

## Prerequisites

To use the app, you will need:

1. **[Node.js](https://nodejs.org/en)** installed on your machine (tested with v23.9.0)
2. **A Twilio Account**: [Sign up for a free trial](https://www.twilio.com/try-twilio)
3. **A Twilio Phone Number with Voice Capabilities**: [Instructions to purchase a number](https://support.twilio.com/hc/en-us/articles/223180928-How-to-Buy-a-Twilio-Phone-Number)
4. **Enable Voice AI features** in the [Twilio Console](http://twilio.com/console/voice/settings): Navigate to the Voice section, select **General** under **Settings**, and turn on the **Predictive and Generative AI/ML Features Addendum** to use ConversationRelay
5. **Your code editor of choice** (such as Visual Studio Code)
6. **The [ngrok](https://ngrok.com/) tunneling service** (or other tunneling service). Alternatively, a [fly.io](http://fly.io) account or other way to host a web socket server
7. **An [OpenAI Account and API Key](https://platform.openai.com/api-keys)** to generate an API Key
8. **A phone** to place your outgoing call to Twilio

## Quick Start

### 1. Run ngrok

You'll need to expose your local server to the internet for Twilio to access it. Use ngrok for tunneling:

```bash
ngrok http 8080
```

Copy the Forwarding URL and put it aside; it looks like `https://[your-ngrok-subdomain].ngrok.app`. You'll need it in a couple places.

### 2. Install dependencies

Run the following command to install necessary packages:

```bash
npm install
```

### 3. Configure Twilio

Update Your Twilio Phone Number: In the Twilio Console under **Phone Numbers**, set the Webhook for **A call comes in** to your ngrok URL followed by `/twiml`. 

Example: `https://[your-ngrok-subdomain].ngrok.app/twiml`.

### 4. Configure Environment Variables

Copy the example environment file to `.env`:

```bash
cp .env.example .env
```

Edit the .env file and input your OpenAI API key in `OPENAI_API_KEY`. Add your ngrok URL in `NGROK_URL` (do not include the scheme, "http://" or "https://")

### 5. Run the app

Start the development server:

```bash
node index.js
```

### 6. Test the app

Call your Twilio phone number. After connection, you should be able to converse with the OpenAI-powered AI Assistant, integrated over ConversationRelay with Twilio Voice!

> [!NOTE] 
> Customize the initial greeting and response behavior by modifying the aiResponse function and constants like SYSTEM_PROMPT in index.js.
> Ensure that you update ngrok URLs each time you restart ngrok, as they change with each session.

## Useful Resources

- [ConversationRelay documentation](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay)
- GitHub - completed code: [https://github.com/robinske/cr-demo/tree/forge](https://github.com/robinske/cr-demo/tree/forge)
- Blog post - detailed getting started guide: [https://www.twilio.com/en-us/blog/integrate-openai-twilio-voice-using-conversationrelay](https://www.twilio.com/en-us/blog/integrate-openai-twilio-voice-using-conversationrelay)

## Step-by-Step Tutorial

This section provides a comprehensive walkthrough for building the voice assistant with progressive features. Each step builds upon the previous one, demonstrating increasingly sophisticated capabilities.

### Tutorial Setup

If you want to follow along with the step-by-step tutorial, create a new project:

```bash
mkdir conversation-relay && cd conversation-relay
npm init -y
npm pkg set type="module"
npm install fastify @fastify/websocket @fastify/formbody openai dotenv axios
```

Create an `.env` file:

```bash
# See https://platform.openai.com/docs/quickstart
OPENAI_API_KEY="sk-proj......."

# Replace with your ngrok url
NGROK_URL="abc123.ngrok.app"
```

### Step-by-Step Progress Guide

> [!NOTE]  
> These steps demonstrate the complete development process with code diffs and testing instructions

| Step | Feature | Code diff | Complete file | How to test |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Boilerplate |  | [Complete file](https://github.com/robinske/forge-build-tutorial/blob/forge-1/index.js) |  |
| 2 | /twiml endpoint | [Code diff](https://github.com/robinske/forge-build-tutorial/compare/forge-1...forge-2) | [Complete file](https://github.com/robinske/forge-build-tutorial/blob/forge-2/index.js) |  |
| 3 | WebSocket & OpenAI | [Code diff](https://github.com/robinske/forge-build-tutorial/compare/forge-2...forge-3) | [Complete file](https://github.com/robinske/forge-build-tutorial/blob/forge-3/index.js) | [Connect your phone number](https://github.com/robinske/forge-build-tutorial/blob/main/README.md#3-configure-twilio) and test by asking anything! |
| 4 | Conversation history | [Code diff](https://github.com/robinske/forge-build-tutorial/compare/forge-3...forge-4) | [Complete file](https://github.com/robinske/forge-build-tutorial/blob/forge-4/index.js) | Test by asking follow up questions - e.g.: Who won the Oscar in 2009? What about 2010? |
| 5 | Streaming | [Code diff](https://github.com/robinske/forge-build-tutorial/compare/forge-4...forge-5) | [Complete file](https://github.com/robinske/forge-build-tutorial/blob/forge-5/index.js) | Test by prompting for a long answer - e.g.: Tell me 10 things that happened in 2015 |
| 6 | Tool calling | [Code diff](https://github.com/robinske/forge-build-tutorial/compare/forge-5...forge-6) | [Complete file](https://github.com/robinske/forge-build-tutorial/blob/forge-6/index.js) | Test by trying to make an appointment at a fictional Veterinary Clinic |
| 7 | Conversational Intelligence | [Code diff](https://github.com/robinske/forge-build-tutorial/compare/forge-6...forge-7) | [Complete file](https://github.com/robinske/forge-build-tutorial/blob/forge-7/index.js) | Set up custom operators in the Console and test against your transcripts |

## Detailed Implementation Guide

### Step 1: Create Boilerplate

Create an `index.js` file and paste in [this boilerplate](https://github.com/robinske/forge-build-tutorial/blob/forge-1/index.js)

### Step 2: Add /twiml Endpoint Response

Add the TwiML response that connects calls to ConversationRelay:

```javascript
reply.type("text/xml").send(
   `<?xml version="1.0" encoding="UTF-8"?>
   <Response>
     <Connect>
       <ConversationRelay url="${WS_URL}" welcomeGreeting="${WELCOME_GREETING}" />
     </Connect>
   </Response>`
 );
```

### Step 3: WebSocket Server & OpenAI Response

Process incoming messages from ConversationRelay:

```javascript
const message = JSON.parse(data);
switch (message.type) {
  case "prompt":
    console.log("Processing prompt:", message.voicePrompt);
    const response = await aiResponse(message.voicePrompt);
    console.log("AI response:", response);

    ws.send(
      JSON.stringify({
        type: "text",
        token: response,
        last: true,
      })
    );
    break;
  default:
    console.warn("Unknown message type received:", message.type);
    break;
}
```

Call out to OpenAI API:

```javascript
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function aiResponse(prompt) {
  let completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });
  return completion.choices[0].message.content;
}
```

**Test:** Connect your ngrok URL (+ /twiml) to your Twilio Phone number and call to test!

### Step 4: Add Conversation History

Add a global object to track sessions:

```javascript
const sessions = new Map();
```

Update aiResponse method to accept an array of messages:

```javascript
async function aiResponse(messages) {
 let completion = await openai.chat.completions.create({
   model: "gpt-4o-mini",
   messages: messages,
 });
 return completion.choices[0].message.content;
}
```

Add tracking for call setup:

```javascript
case "setup":
  const callSid = message.callSid;
  console.log("Setup for call:", callSid);
  ws.callSid = callSid;
  sessions.set(callSid, [{ role: "system", content: SYSTEM_PROMPT }]);
  break;
```

Fetch conversation by call sid and add new prompt/response:

```javascript
const messages = sessions.get(ws.callSid);
messages.push({ role: "user", content: message.voicePrompt });

const response = await aiResponse(messages);
messages.push({ role: "assistant", content: response });
```

**Test:** Ask follow up questions - e.g.: "Who won the Oscar in 2009? What about 2010?"

### Step 5: Add Streaming Tokens

Replace the aiResponse method with aiResponseStream:

```javascript
async function aiResponseStream(messages, ws) {
 const stream = await openai.chat.completions.create({
   model: "gpt-4o-mini",
   messages: messages,
   stream: true,
 });

 const assistantSegments = [];
 console.log("Received response chunks:");
 for await (const chunk of stream) {
   const content = chunk.choices[0]?.delta?.content || "";

   // Send each token
   console.log(content);
   ws.send(
     JSON.stringify({
       type: "text",
       token: content,
       last: false,
     })
   );
   assistantSegments.push(content);
 }

 const finalResponse = assistantSegments.join("");
 console.log("Assistant response complete:", finalResponse);
 messages.push({
   role: "assistant",
   content: finalResponse,
 });
}
```

Update the "prompt" case to use streaming:

```javascript
case "prompt":
 console.log("Processing prompt:", message.voicePrompt);

 const messages = sessions.get(ws.callSid);
 messages.push({ role: "user", content: message.voicePrompt });

 await aiResponseStream(messages, ws);

 // Send the final "last" token when streaming completes
 ws.send(
   JSON.stringify({
     type: "text",
     token: "",
     last: true,
   })
 );
 break;
```

**Test:** Prompt for a long answer - e.g.: "Tell me 10 things that happened in 2015"

### Step 6: Add Tool Calling

Install axios for API calls:

```bash
npm install axios
```

Update the welcome greeting and system prompt for veterinary clinic context:

```javascript
const WELCOME_GREETING =
  "Hi! Thank you for calling Wiggles Veterinary. How can I help you today?";
const SYSTEM_PROMPT = `You are a helpful assistant for a veterinary clinic, so you will be asked about animal care, appointments, and other related topics.
  This conversation is being translated to voice, so answer carefully.
  When you respond, please spell out all numbers, for example twenty not 20. Do not include emojis in your responses. 
  Do not include bullet points, asterisks, or special symbols.
    
  Make sure you get the pet's name, the owner's name, and the type of animal (dog, cat, etc.) if relevant.
  If someone asks for an appointment call the "get_appointments" function to fetch appointment options.
  Do not call the function if someone confirms an appointment, just say "Great! We have you scheduled for that time."`;
```

Add tool definition and appointment function:

```javascript
import axios from "axios";

const tools = [
  {
    type: "function",
    function: {
      name: "find_appointments",
      description:
        "Find available appointments based on user preferences, such as mornings or a specific week.",
      parameters: {
        type: "object",
        properties: {
          preferences: {
            type: "string",
            description:
              "Preferences for appointment search, e.g., 'mornings, week of june ninth'.",
          },
        },
        required: ["preferences"],
      },
    },
  },
];

async function getAppointments(preferences) {
  const response = await axios.get(
    `https://appointment-finder-4175.twil.io/appointments?preferences=${encodeURIComponent(
      preferences
    )}`
  );
  const data = response.data;
  return data.availableAppointments
    .map((appointment) => appointment.displayTime)
    .join(", ");
}
```

Add tools parameter to OpenAI call and handle tool responses in the streaming logic. See the [complete implementation](https://github.com/robinske/forge-build-tutorial/blob/forge-6/index.js) for full details.

**Test:** Try to make an appointment for your (real or fictional) pet

### Step 7: Add Conversational Intelligence

Create an intelligence service in the [Twilio Console](https://console.twilio.com/us1/develop/conversational-intelligence/services).

Create a custom operator called "Pet name extractor" with training examples to extract pet names from conversations.

Add your intelligence service SID to your TwiML:

```javascript
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay 
      url="${WS_URL}"
      welcomeGreeting="${WELCOME_GREETING}"
      intelligenceService="GAxxxxxx"
    />
  </Connect>
</Response>
```

**Test:** Make another call and explore your transcripts with extracted intelligence in the Console!

## Advanced Development

Try adding another tool, creating another custom operator, modifying the [TTS voice](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay#additional-tts-voices-available-for-conversationrelay) or [other attributes](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay#conversationrelay-attributes). Use this as an opportunity to experiment and ask questions about ConversationRelay capabilities.
