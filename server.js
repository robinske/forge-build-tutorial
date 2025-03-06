const WebSocket = require('ws');
const wss = new WebSocket.Server({port: 8080});

wss.on('connection', (ws) => {
  console.log('New client connected');

  // Listener for call information and conversation
  ws.on('message', (data) => {

    let message = JSON.parse(data);
    console.log("Received message type: ", message.type);
    console.log("Parsed message", message);

    switch (message.type) {
        case 'setup':
            console.log('Setup');
            break;
        case 'prompt':
            console.log('Prompt: ', message.voicePrompt);

            // TODO - this triggers { type: 'error', description: 'Invalid message received: {"message":"Echo this back."}' }
            // TODO - figure out MVP for echoing back messages
            ws.send(JSON.stringify({
                type: 'text',
                token: message.voicePrompt,
                last: true,
              }));
            break;
        case 'interrupt':
            console.log('Interrupt');
            break;
        case 'error':
            console.log('Error');
            break;
        case 'dtmf':
            console.log('DTMF');
            break;
        default:
            console.log('Unknown message type');
            break;
    }

    
    // copied from Hao's post
    // ----------------------- //
    // console.log(msg);
    // if (msg.type === 'setup') {
    //     addLog('convrelay', `convrelay socket setup ${msg.callSid}`);
    //     callSid = msg.callSid;        
    //     gptService.setCallInfo('user phone number', msg.from);

    //     //trigger gpt to start 
    //     gptService.completion('hello', interactionCount);
    //     interactionCount += 1;

    //     if(record.recording){
    //     recordingService(textService, callSid).then(() => {
    //         console.log(`Twilio -> Starting recording for ${callSid}`.underline.red);
    //     });
    //     }
    // }  
    
    // if (msg.type === 'prompt') {
    //     addLog('convrelay', `convrelay -> GPT (${msg.lang}) :  ${msg.voicePrompt} `);
    //     gptService.completion(msg.voicePrompt, interactionCount);
    //     interactionCount += 1;
    // } 
    
    // if (msg.type === 'interrupt') {
    //     addLog('convrelay', 'convrelay interrupt: utteranceUntilInterrupt: ' + msg.utteranceUntilInterrupt + ' durationUntilInterruptMs: ' + msg.durationUntilInterruptMs);
    //     gptService.interrupt();
    //     // console.log('Todo: add interruption handling');
    // }

    // if (msg.type === 'error') {
    //     addLog('convrelay', 'convrelay error: ' + msg.description);
        
    //     console.log('Todo: add error handling');
    // }

    // if (msg.type === 'dtmf') {
    //     addLog('convrelay', 'convrelay dtmf: ' + msg.digit);
        
    //     console.log('Todo: add dtmf handling');
    // }
    // ----------------------- //

  });

  // Event listener for client disconnection
  ws.on('close', () => {
    console.log('Client has disconnected.');
  });
});

console.log('WebSocket server is running on ws://localhost:8080');