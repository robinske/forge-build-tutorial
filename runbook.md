# Forge ConversationRelay \- Runbook

## Pre-requisites

1. [Node.js](https://nodejs.org/en) installed on your machine  
2. A Twilio phone number ([Sign up here](https://console.twilio.com/))  
3. Your code editor of choice (such as Visual Studio Code)  
4. The [ngrok](https://ngrok.com/) tunneling service (or other tunneling service). Alternatively, a [fly.io](http://fly.io) account or other way to host a web socket server.  
5. An [OpenAI Account](https://platform.openai.com/api-keys) to generate an API Key  
6. A phone to place your outgoing call to Twilio

## Useful links

* GitHub \- completed code: [https://github.com/robinske/cr-demo](https://github.com/robinske/cr-demo)  
* Blog post \- step 1 / getting started: [https://www.twilio.com/en-us/blog/integrate-openai-twilio-voice-using-conversationrelay](https://www.twilio.com/en-us/blog/integrate-openai-twilio-voice-using-conversationrelay) 

### Step by step diffs
| Step | Code diff | Complete file | How to test |
| :---- | :---- | :---- | :---- |
| 1 \- Boilerplate |  | [Complete file](https://github.com/robinske/cr-demo/blob/forge-1/workshop-steps/index.js) |  |
| 2 \- /twiml | [Code diff](https://github.com/robinske/cr-demo/compare/forge-1...forge-2) | [Complete file](https://github.com/robinske/cr-demo/blob/forge-2/workshop-steps/index.js) |  |
| 3 \- ws & OpenAI | [Code diff](https://github.com/robinske/cr-demo/compare/forge-2...forge-3) | [Complete file](https://github.com/robinske/cr-demo/blob/forge-3/workshop-steps/index.js) | Test by asking anything\! |
| 4 \- Conversation history | [Code diff](https://github.com/robinske/cr-demo/compare/forge-3...forge-4) | [Complete file](https://github.com/robinske/cr-demo/blob/forge-4/workshop-steps/index.js) | Test by asking follow up questions \- e.g.: Who won the Oscar in 2009? What about 2010? |
| 5 \- Streaming | [Code diff](https://github.com/robinske/cr-demo/compare/forge-4...forge-5) | [Complete file](https://github.com/robinske/cr-demo/blob/forge-5/workshop-steps/index.js) | Test by prompting for a long answer \- e.g.: Tell me 10 things that happened in 2015 |
| 6 \- Tool calling | [Code diff](https://github.com/robinske/cr-demo/compare/forge-5...forge-6) | [Complete file](https://github.com/robinske/cr-demo/blob/forge-6/workshop-steps/index.js) | Test by asking for a programming joke |
| 7 \- Interruption handling | [Code diff](https://github.com/robinske/cr-demo/compare/forge-6...forge-7) | [Complete file](https://github.com/robinske/cr-demo/blob/forge-7/workshop-steps/index.js) | Test by asking for something like "name 10 Canadian Prime Ministers", interrupt the answer, and asking for how many it got through. |

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
async function aiResponse(messages) {
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

### \[Test it out\!\] buy a Twilio phone number 

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

### 6\. Add tool calling

1. [Code diff](https://github.com/robinske/cr-demo/compare/forge-5...forge-6)  
2. [Code file to this point](https://github.com/robinske/cr-demo/blob/forge-6/workshop-steps/index.js)

Install axios so we can call an API

```
npm install axios
```

Update the SYSTEM\_PROMPT with instructions for how to handle tool calling:

```javascript
const SYSTEM_PROMPT = `You are a helpful assistant. This conversation is being translated to voice, so answer carefully.
  When you respond, please spell out all numbers, for example twenty not 20. Do not include emojis in your responses. Do not include bullet points, asterisks, or special symbols.
  You should use the 'get_programming_joke' function only when the user is asking for a programming joke (or a very close prompt, such as developer or software engineering joke). For other requests, including other types of jokes, you should use your own knowledge.`;
```

Add functions to fetch a joke:

```javascript
import axios from "axios";
const tools = [
  {
    type: "function",
    function: {
      name: "get_programming_joke",
      description: "Fetches a programming joke",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      strict: true,
    },
  },
];

async function getJoke() {
  // Use jokeapi.dev to fetch a clean joke
  const response = await axios.get(
    "https://v2.jokeapi.dev/joke/Programming?safe-mode"
  );
  const data = response.data;
  return data.type === "single"
    ? data.joke
    : `${data.setup} ... ${data.delivery}`;
}

const toolFunctions = {
  get_programming_joke: async () => getJoke(),
};
```

Add a parameter for tools when you call the OpenAI chat completions API:

```javascript
const stream = await openai.chat.completions.create({
   model: "gpt-4o-mini",
   messages: messages,
   stream: true,
   tools: tools,
});
```

After const content \= …, add the code to fetch tools and respond:

```javascript
const toolCalls = chunk.choices[0].delta.tool_calls || [];

for (const toolCall of toolCalls) {
 const toolName = toolCall.function.name;
 const toolFn = toolFunctions[toolName];

 if (toolFn) {
   const toolResponse = await toolFn();

   // Append tool call request and the result with the "tool" role
   messages.push({
     role: "assistant",
     tool_calls: [
       {
         id: toolCall.id,
         function: {
           name: toolName,
           arguments: "{}",
         },
         type: "function",
       },
     ],
   });

   messages.push({
     role: "tool",
     tool_call_id: toolCall.id,
     content: toolResponse,
   });

   // Send the completed tool response to the client
   ws.send(
     JSON.stringify({ type: "text", token: toolResponse, last: true })
   );
   assistantSegments.push(toolResponse);
   console.log(`Fetched ${toolName}:`, toolResponse);
 }
}
```

### 7\. Add interruption handling

3. [Code diff](https://github.com/robinske/cr-demo/compare/forge-6...forge-7)  
4. [Code file to this point](https://github.com/robinske/cr-demo/blob/forge-7/workshop-steps/index.js)

Add a function to handle interrupts

```javascript
function handleInterrupt(callSid, utteranceUntilInterrupt) {
  const conversation = sessions.get(callSid);

  let updatedConversation = [...conversation];

  const interruptedIndex = updatedConversation.findIndex(
    (message) =>
      message.role === "assistant" &&
      message.content.includes(utteranceUntilInterrupt),
  );

  if (interruptedIndex !== -1) {
    const interruptedMessage = updatedConversation[interruptedIndex];

    const interruptPosition = interruptedMessage.content.indexOf(
      utteranceUntilInterrupt,
    );
    const truncatedContent = interruptedMessage.content.substring(
      0,
      interruptPosition + utteranceUntilInterrupt.length,
    );

    updatedConversation[interruptedIndex] = {
      ...interruptedMessage,
      content: truncatedContent,
    };

    updatedConversation = updatedConversation.filter(
      (message, index) =>
        !(index > interruptedIndex && message.role === "assistant"),
    );
  }

  sessions.set(callSid, updatedConversation);
}
```

Add case statement for "interrupt" messages:

```javascript
case "interrupt":
  console.log("Handling interruption; last utterance: ", message.utteranceUntilInterrupt);
  handleInterrupt(ws.callSid, message.utteranceUntilInterrupt);
  break;
```

## Open build / Q\&A