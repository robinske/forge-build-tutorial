# Conversation Relay Demo

1. run `ngrok http 8080`
2. set your ngrok url and openai API key in the .env file
3. run this file `node server`
4. configure the voice webhook on your twilio phone number - set it to your ngrok url + `/twiml` e.g. https://abcdefgh.ngrok.io/twiml
5. call your phone number to test
