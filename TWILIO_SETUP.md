# Twilio Integration Setup Guide

This guide will walk you through setting up Twilio Voice integration with your OpenAI Realtime Agents so you can call your AI assistant over the phone.

## Prerequisites

1. A Twilio account (sign up at https://www.twilio.com)
2. Your application running locally or deployed
3. ngrok or similar tunneling tool for local development

## Step 1: Set up your Twilio Account

1. **Sign up for Twilio** at https://www.twilio.com if you haven't already
2. **Get your Account SID and Auth Token** from the Twilio Console dashboard
3. **Buy a phone number** with Voice capabilities:
   - Go to Phone Numbers > Manage > Buy a number
   - Select a number with Voice capabilities
   - Purchase the number

## Step 2: Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# Your existing OpenAI API key
OPENAI_API_KEY=your_openai_api_key_here

# Twilio credentials from your console
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

# Your application URL (see Step 3)
NEXT_PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io
```

## Step 3: Expose Your Local Server (Development)

Since Twilio needs to send webhooks to your application, you need to make your local server accessible from the internet.

### Using ngrok:

1. **Install ngrok**: https://ngrok.com/download
2. **Start your application**: `npm run dev`
3. **In a new terminal, expose port 3000**: `ngrok http 3000`
4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)
5. **Update your `.env.local`** with the ngrok URL:
   ```bash
   NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
   ```
6. **Restart your application** to pick up the new environment variable

## Step 4: Configure Twilio Webhooks

1. **Go to the Twilio Console** > Phone Numbers > Manage > Active numbers
2. **Click on your purchased phone number**
3. **In the Voice Configuration section**, set:
   - **Webhook**: `https://your-ngrok-url.ngrok.io/api/twilio/voice-webhook`
   - **HTTP Method**: POST
4. **Save the configuration**

## Step 5: Test the Integration

1. **Make sure your application is running**: `npm run dev`
2. **Call your Twilio phone number**
3. **You should hear the AI assistant respond!**

## How It Works

1. **Incoming Call**: When someone calls your Twilio number, Twilio sends a webhook to `/api/twilio/voice-webhook`
2. **WebSocket Setup**: The webhook responds with TwiML that establishes a WebSocket connection to `/api/twilio/audio-stream`
3. **Audio Streaming**: Audio from the call is streamed to OpenAI's Realtime API, and responses are streamed back to the caller
4. **Real-time Conversation**: The caller can have a natural conversation with your AI assistant

## Customizing the AI Assistant

You can customize the AI assistant's behavior by modifying the agent configuration in `src/app/lib/twilioAudioStream.ts`:

```typescript
const agent = new RealtimeAgent({
  name: "phone_assistant",
  voice: "shimmer", // Options: alloy, echo, fable, onyx, nova, shimmer
  instructions: `Your custom instructions here...`,
  handoffs: [],
  tools: [], // Add any tools your assistant should have access to
  handoffDescription: 'Phone assistant for Twilio calls'
});
```

## Production Deployment

For production:

1. **Deploy your application** to a hosting service (Vercel, Heroku, etc.)
2. **Update the webhook URL** in your Twilio console to point to your production domain
3. **Update environment variables** in your production environment

## Troubleshooting

### Common Issues:

1. **"Connection failed"**: Check that your ngrok tunnel is running and the URL is correct
2. **"No response from AI"**: Verify your OpenAI API key is set correctly
3. **"Webhook not receiving calls"**: Ensure your Twilio phone number webhook is configured correctly
4. **"Audio quality issues"**: This is normal for the current implementation - production would need proper μ-law encoding/decoding

### Logs:

Check your application logs for detailed error messages. The console will show:
- WebSocket connection events
- OpenAI session status
- Audio streaming events
- Any errors in the integration

## Next Steps

- Add more sophisticated agent configurations
- Implement call recording and transcription
- Add analytics and monitoring
- Implement proper μ-law audio codec handling for better audio quality
- Add support for multiple agents with handoffs during calls 