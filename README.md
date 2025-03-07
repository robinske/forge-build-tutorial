# Conversation Relay Demo

1. run this file `node server.js`
1. run `ngrok http 8080`
1. replace the url in the twiml below with your ngrok url (leave the wss://)
1. create twiml bin with the following
1. connect your phone number to this twiml bin
1. call your phone number to test

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay url="wss://<YOUR NGROK URL>/" welcomeGreeting="Hi! Ask me anything!" />
  </Connect>
</Response>
```