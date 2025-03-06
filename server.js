const WebSocket = require('ws');
const wss = new WebSocket.Server({port: 8080});

wss.on('connection', (ws) => {
  console.log('New client connected');

  // Listener for call information and conversation
  ws.on('message', (data) => {
    let message = JSON.parse(data);

    switch (message.type) {
        case 'setup':
            console.log(`Conversation setup initiated for number ending in **${message.from.slice(-2)}`);
            console.log(`Call SID: ${message.callSid}`);
            break;
        case 'prompt':
            console.log('Prompt: ', message.voicePrompt);

            // echo back the voice prompt
            ws.send(JSON.stringify({
                type: 'text',
                token: message.voicePrompt,
                last: false,
              }));
            break;
        case 'error':
            console.log('Error');
            break;
        default:
            console.log('Unknown message type');
            break;
    }
  });

  // Event listener for client disconnection
  ws.on('close', () => {
    console.log('Client has disconnected.');
  });
});

console.log('WebSocket server is running on ws://localhost:8080');