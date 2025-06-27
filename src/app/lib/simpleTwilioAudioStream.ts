import { WebSocket } from 'ws';

interface TwilioStreamEvent {
  event: string;
  sequenceNumber?: string;
  media?: {
    track: string;
    chunk: string;
    timestamp: string;
    payload: string;
  };
  mark?: {
    name: string;
  };
  start?: {
    streamSid: string;
    accountSid: string;
    callSid: string;
    tracks: string[];
    mediaFormat: {
      encoding: string;
      sampleRate: number;
      channels: number;
    };
  };
}

export class SimpleTwilioAudioStreamHandler {
  private twilioWs: WebSocket;
  private streamSid: string | null = null;

  constructor(twilioWs: WebSocket) {
    this.twilioWs = twilioWs;
    this.setupTwilioHandlers();
  }

  private setupTwilioHandlers() {
    this.twilioWs.on('message', (data) => {
      try {
        const message: TwilioStreamEvent = JSON.parse(data.toString());
        console.log('Received Twilio message:', message.event);
        this.handleTwilioMessage(message);
      } catch (error) {
        console.error('Error parsing Twilio message:', error);
      }
    });

    this.twilioWs.on('close', () => {
      console.log('Twilio WebSocket closed');
      this.cleanup();
    });

    this.twilioWs.on('error', (error) => {
      console.error('Twilio WebSocket error:', error);
    });
  }

  private async handleTwilioMessage(message: TwilioStreamEvent) {
    switch (message.event) {
      case 'connected':
        console.log('Twilio stream connected');
        break;

      case 'start':
        console.log('Stream started with SID:', message.start?.streamSid);
        this.streamSid = message.start?.streamSid || null;
        console.log('Media format:', message.start?.mediaFormat);
        
        // Send a simple greeting audio after a short delay
        setTimeout(() => {
          this.sendGreeting();
        }, 1000);
        break;

      case 'media':
        // For now, just log that we received audio
        if (message.media) {
          console.log(`Received audio: track=${message.media.track}, chunk=${message.media.chunk}`);
          
          // Echo back some simple audio (just for testing)
          // In a real implementation, this would go to OpenAI and back
          this.sendSimpleResponse();
        }
        break;

      case 'stop':
        console.log('Stream stopped');
        this.cleanup();
        break;

      default:
        console.log('Unknown Twilio event:', message.event);
    }
  }

  private sendGreeting() {
    if (this.twilioWs.readyState === WebSocket.OPEN && this.streamSid) {
      // Send a mark to indicate we're ready
      const markMessage = {
        event: 'mark',
        streamSid: this.streamSid,
        mark: {
          name: 'greeting_ready'
        }
      };
      
      console.log('Sending greeting mark');
      this.twilioWs.send(JSON.stringify(markMessage));
      
      // For now, we'll just send a mark instead of actual audio
      // This helps us confirm the WebSocket connection is working
    }
  }

  private sendSimpleResponse() {
    // For now, just log that we would send a response
    // This helps us confirm we're receiving audio data
    console.log('Would send response to audio input');
  }

  private cleanup() {
    console.log('Cleaning up audio stream handler');
    // Nothing to clean up in this simple version
  }
} 