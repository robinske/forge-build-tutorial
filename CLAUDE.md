# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an educational Node.js voice assistant application that integrates Twilio ConversationRelay with OpenAI to create a phone-based AI assistant. This repository serves as a learning resource for developers who want to understand how to build AI-powered phone applications.

The branches prefixed with "forge" contain incremental steps that progressively build up the application with iterative and incremental information, breaking down complex concepts into digestible learning stages for developers.

The application demonstrates streaming responses, conversation history, tool calling, and interruption handling over phone calls.

## Development Commands

### Running the Application
```bash
node index.js
```
The server starts on port 8080 (or PORT environment variable).

### Dependencies
```bash
npm install
```

### Testing
There are no automated tests configured. Testing is done by calling the Twilio phone number after setup.

## Required Setup

### Environment Variables (.env file)
- `OPENAI_API_KEY`: OpenAI API key for chat completions
- `NGROK_URL`: Your ngrok domain (without https://) for webhook access

### External Services
- **ngrok**: Required for local development to expose webhook endpoints
  ```bash
  ngrok http 8080
  ```
- **Twilio Console**: Configure phone number webhook to `https://[ngrok-url]/twiml`
- **OpenAI Account**: API key needed for chat completions

## Architecture

### Core Components

**WebSocket Server** (`index.js:174-221`): Handles real-time communication with Twilio ConversationRelay
- Message types: `setup`, `prompt`, `interrupt`
- Manages conversation sessions by `callSid`

**Session Management** (`index.js:15`): Global Map storing conversation history
- Key: Twilio `callSid`
- Value: Array of OpenAI message objects with roles (system, user, assistant, tool)

**OpenAI Integration** (`index.js:53-122`): Streaming chat completions with tool support
- Model: `gpt-4o-mini`
- Supports function calling for external API integration
- Streams responses token-by-token for low latency

**Tool System** (`index.js:21-51`): Function calling framework
- Example: `get_programming_joke` fetches jokes from external API
- Tools defined in OpenAI function schema format
- Responses integrated into conversation flow

### Key Features

**Streaming Responses**: OpenAI responses are streamed token-by-token to reduce perceived latency
**Conversation Memory**: Full conversation history maintained per call session
**Interruption Handling**: `handleInterrupt` function truncates assistant responses when user interrupts
**Voice Optimization**: System prompt optimized for text-to-speech (spell out numbers, no emojis/symbols)

## Important Constants

- `SYSTEM_PROMPT`: Controls AI behavior and voice optimization
- `WELCOME_GREETING`: Initial message when call connects
- `WS_URL`: WebSocket endpoint for ConversationRelay

## Development Notes

- Application uses ES modules (`"type": "module"` in package.json)
- ConversationRelay requires AI features enabled in Twilio Console
- Ngrok URL changes on each restart - update both .env and Twilio webhook
- Tool functions must return strings compatible with voice synthesis