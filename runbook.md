# Forge ConversationRelay \- Runbook

## Pre-requisites
> [!IMPORTANT]  
> Please complete these steps prior to joining the workshop

1. [Node.js](https://nodejs.org/en) installed on your machine  
2. A Twilio phone number ([Sign up here](https://console.twilio.com/))
3. Enable Voice AI features in the [Twilio Console](http://twilio.com/console/voice/settings): Navigate to the Voice section, select **General** under **Settings**, and turn on the **Predictive and Generative AI/ML Features Addendum** in order to use ConversationRelay.
4. Your code editor of choice (such as Visual Studio Code)  
5. The [ngrok](https://ngrok.com/) tunneling service (or other tunneling service). Alternatively, a [fly.io](http://fly.io) account or other way to host a web socket server.  
6. An [OpenAI Account](https://platform.openai.com/api-keys) to generate an API Key  
7. A phone to place your outgoing call to Twilio

## Useful links

* [ConversationRelay documentation](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay)
* GitHub \- completed code: [https://github.com/robinske/cr-demo/tree/forge](https://github.com/robinske/cr-demo/tree/forge)
* Blog post \- detailed getting started guide: [https://www.twilio.com/en-us/blog/integrate-openai-twilio-voice-using-conversationrelay](https://www.twilio.com/en-us/blog/integrate-openai-twilio-voice-using-conversationrelay) 

### Step by step diffs
> [!NOTE]  
> These steps will be covered in real time during the workshop

| Step | Code diff | Complete file | How to test |
| :---- | :---- | :---- | :---- |
| 1 \- Boilerplate |  | [Complete file](https://github.com/robinske/cr-demo/blob/forge-1/workshop-steps/index.js) |  |
| 2 \- /twiml | [Code diff](https://github.com/robinske/cr-demo/compare/forge-1...forge-2) | [Complete file](https://github.com/robinske/cr-demo/blob/forge-2/workshop-steps/index.js) |  |
| 3 \- ws & OpenAI | [Code diff](https://github.com/robinske/cr-demo/compare/forge-2...forge-3) | [Complete file](https://github.com/robinske/cr-demo/blob/forge-3/workshop-steps/index.js) | [Connect your phone number](https://github.com/robinske/cr-demo/blob/forge/runbook.md#test-it-out-with-your-twilio-phone-number) and test by asking anything\! |
| 4 \- Conversation history | [Code diff](https://github.com/robinske/cr-demo/compare/forge-3...forge-4) | [Complete file](https://github.com/robinske/cr-demo/blob/forge-4/workshop-steps/index.js) | Test by asking follow up questions \- e.g.: Who won the Oscar in 2009? What about 2010? |
| 5 \- Streaming | [Code diff](https://github.com/robinske/cr-demo/compare/forge-4...forge-5) | [Complete file](https://github.com/robinske/cr-demo/blob/forge-5/workshop-steps/index.js) | Test by prompting for a long answer \- e.g.: Tell me 10 things that happened in 2015 |
| 6 \- Tool calling | [Code diff](https://github.com/robinske/cr-demo/compare/forge-5...forge-6b) | [Complete file](https://github.com/robinske/cr-demo/blob/forge-6b/workshop-steps/index.js) | Test by trying to make an appointment at a fictional Veterinary Clinic |
| 7 \- Conversational Intelligence | [Code diff](https://github.com/robinske/cr-demo/compare/forge-6b...forge-7b) | [Complete file](https://github.com/robinske/cr-demo/blob/forge-7b/workshop-steps/index.js) | Set up custom operators in the Console and test against your transcripts. |

## Setup

* Create a new folder called **"conversation-relay"**

```
mdkir conversation-relay && cd conversation-relay
```

* Node project setup:

```
npm init -y
npm pkg set type="module"
npm install fastify @fastify/websocket @fastify/formbody openai dotenv axios
```

* In a new tab \- run ngrok (and leave this tab open/running)

```
ngrok http 8080
```

* Create an .env file

```
# See https://platform.openai.com/docs/quickstart
OPENAI_API_KEY="sk-proj......."

# Replace with your ngrok url
NGROK_URL="abc123.ngrok.app"
```

## CODE WALKTHROUGH

### 1\. Create an index.js file and paste in [this boilerplate](https://github.com/robinske/cr-demo/blob/forge-1/workshop-steps/index.js)

### 2\. Add /twiml endpoint response

1. [Code diff](https://github.com/robinske/cr-demo/compare/forge-1...forge-2)  
2. [File to this point](https://github.com/robinske/cr-demo/blob/forge-2/workshop-steps/index.js)

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

### 3\. Web socket server & OpenAI response

1. [Code diff](https://github.com/robinske/cr-demo/compare/forge-2...forge-3)  
2. [File to this point](https://github.com/robinske/cr-demo/blob/forge-3/workshop-steps/index.js)

Process incoming messages:

```javascript
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

### \[Test it out\!\] with your Twilio phone number 

Connect your ngrok URL (+ /twiml) to your Twilio Phone number.  
<img width="1781" alt="Image" src="https://github.com/user-attachments/assets/24982387-bcc6-49bc-bcdc-2b3fbd0a2a97" />

Call your Twilio phone number to test\!

### 4\. Add conversation history

1. [Code diff](https://github.com/robinske/cr-demo/compare/forge-3...forge-4)  
2. [File to this point](https://github.com/robinske/cr-demo/blob/forge-4/workshop-steps/index.js)

Add a global object to track sessions:

```javascript
const sessions = new Map();
```

Update aiResponse method to accept an array of messages as the parameter:

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

> [!TIP]
> Test conversation history by asking follow up questions \- e.g.: Who won the Oscar in 2009? What about 2010?

### 5\. Add streaming tokens

1. [Code diff](https://github.com/robinske/cr-demo/compare/forge-4...forge-5)  
2. [File to this point](https://github.com/robinske/cr-demo/blob/forge-5/workshop-steps/index.js)

Replace the aiResponse method with the aiResponseStream method:

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

Replace the "prompt" section with the following, passing messages *and* the websocket variable into the new aiResponseStream method:

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
> [!TIP]
> Test the decreased latency by prompting for a long answer \- e.g.: Tell me 10 things that happened in 2015.

### 6\. Add tool calling

1. [Code diff](https://github.com/robinske/cr-demo/compare/forge-5...forge-6b)  
2. [Code file to this point](https://github.com/robinske/cr-demo/blob/forge-6b/workshop-steps/index.js)

Install axios so we can call an API

```
npm install axios
```

We're going to introduce a fictional veterinary clinic into our demo application. Update the WELCOME\_GREETING and SYSTEM\_PROMPT with instructions for how to handle tool calling to book an appointment:

```javascript
const WELCOME_GREETING =
  "Hi! Thank you for calling Wiggles Veterinary. How can I help you today?";
const SYSTEM_PROMPT = `You are a helpful assistant for a veterinary clinic, so you will be asked about animal care, appointments, and other related topics.
  This conversation is being translated to voice, so answer carefully.
  When you respond, please spell out all numbers, for example twenty not 20. Do not include emojis in your responses. 
  Do not include bullet points, asterisks, or special symbols.
    
  Make sure you get the pet's name, the owner's name, and the type of animal (dog, cat, etc.) if relevant.
  If someone asks for an appointment call the "get_appointments" function to fetch appointment options.`;
```

Add tool definition and a function to fetch available appointments:

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

Add a parameter for tools when you call the OpenAI chat completions API:

```diff
const stream = await openai.chat.completions.create({
   model: "gpt-4o-mini",
   messages: messages,
   stream: true,
+  tools: tools,
});
```

After `const assistantSegments = ...`, add an object to track tool calls. Because we're streaming the response, we need to build up the tokens for our function parameters ([learn more](https://platform.openai.com/docs/guides/function-calling?api-mode=chat#streaming)):

```javascript
const finalToolCalls = {};
```

After `assistantSegments.push(content);`, add the code to fetch tools and respond:

```javascript
// Call functions if tool calls are present
const toolCalls = chunk.choices[0].delta.tool_calls || [];
const finishReason = chunk.choices[0].finish_reason;

// Accumulate function arguments
// See: https://platform.openai.com/docs/guides/function-calling?api-mode=chat#streaming
for (const toolCall of toolCalls) {
  const { index } = toolCall;

  if (!finalToolCalls[index]) {
    finalToolCalls[index] = toolCall;
  }

  finalToolCalls[index].function.arguments += toolCall.function.arguments;
}

if (finishReason === "tool_calls") {
  for (const toolCallIdx in finalToolCalls) {
    const toolCall = finalToolCalls[toolCallIdx];
    try {
      const parsedArgs = JSON.parse(toolCall.function.arguments);
      console.log("Calling tool:", toolCall.function.name, parsedArgs);
      const result = await getAppointments(parsedArgs.preferences);
      const toolResponse =
        "We found the following appointment options: " + result;

      ws.send(
        JSON.stringify({
          type: "text",
          token: toolResponse,
          last: false,
        })
      );
      console.log(toolResponse);

      assistantSegments.push(toolResponse);
    } catch (err) {
      console.error("Error processing tool call:", err);
    }
  }
}
```

> [!TIP]
> Test by trying to make an appointment for your (real or fictional) pet.

### 7\. Add interruption handling

3. [Code diff](https://github.com/robinske/cr-demo/compare/forge-6...forge-7)  
4. [Code file to this point](https://github.com/robinske/cr-demo/blob/forge-7/workshop-steps/index.js)

Add a function to handle interrupts

```javascript
function handleInterrupt(callSid, utteranceUntilInterrupt) {
  let conversation = sessions.get(callSid);

  // Find the relevant assistant message
  const interruptedIndex = conversation.findIndex(
    (message) =>
      message.role === "assistant" &&
      message.content.includes(utteranceUntilInterrupt)
  );

  // If there's no message to interrupt, exit early
  if (interruptedIndex === -1) {
    return;
  }

  // Truncate message content at the interruption point
  const interruptedMessage = conversation[interruptedIndex];
  const interruptPosition = interruptedMessage.content.indexOf(
    utteranceUntilInterrupt
  );
  conversation[interruptedIndex] = {
    ...interruptedMessage,
    content: interruptedMessage.content.slice(
      0,
      interruptPosition + utteranceUntilInterrupt.length
    ),
  };

  // Remove assistant messages after the interrupted one
  conversation = conversation.filter(
    (message, index) =>
      !(index > interruptedIndex && message.role === "assistant")
  );

  // Update the stored session data
  sessions.set(callSid, conversation);
}
```

Add case statement for "interrupt" messages:

```javascript
case "interrupt":
  console.log("Handling interruption; last utterance: ", message.utteranceUntilInterrupt);
  handleInterrupt(ws.callSid, message.utteranceUntilInterrupt);
  break;
```
> [!TIP]
> Test by asking for a story about something, and then interrupt and ask how much of the story it got through.

## Open build / Q\&A

Try adding another tool, modifying the [TTS voice](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay#additional-tts-voices-available-for-conversationrelay) or [other attributes](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay#conversationrelay-attributes). Use this opportunity to ask questions.
