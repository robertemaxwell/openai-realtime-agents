import { WebSocket } from 'ws';
import { RealtimeSession, RealtimeAgent } from '@openai/agents/realtime';
import { OpenAIRealtimeWebSocket } from '@openai/agents/realtime';

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
}

export class TwilioAudioStreamHandler {
  private twilioWs: WebSocket;
  private openaiSession: RealtimeSession | null = null;
  private streamSid: string | null = null;

  constructor(twilioWs: WebSocket) {
    this.twilioWs = twilioWs;
    this.setupTwilioHandlers();
  }

  private setupTwilioHandlers() {
    this.twilioWs.on('message', (data) => {
      try {
        const message: TwilioStreamEvent = JSON.parse(data.toString());
        this.handleTwilioMessage(message);
      } catch (error) {
        console.error('Error parsing Twilio message:', error);
      }
    });

    this.twilioWs.on('close', () => {
      console.log('Twilio WebSocket closed');
      this.cleanup();
    });
  }

  private async handleTwilioMessage(message: TwilioStreamEvent) {
    switch (message.event) {
      case 'start':
        console.log('Stream started');
        this.streamSid = message.sequenceNumber || null;
        await this.initializeOpenAISession();
        break;

      case 'media':
        if (message.media && this.openaiSession) {
          // Convert Twilio's μ-law audio to linear PCM for OpenAI
          const audioData = this.convertMulawToPCM(message.media.payload);
          await this.sendAudioToOpenAI(audioData);
        }
        break;

      case 'stop':
        console.log('Stream stopped');
        this.cleanup();
        break;
    }
  }

  private async initializeOpenAISession() {
    try {
      // Get ephemeral key
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/session`);
      const sessionData = await response.json();
      
      if (!sessionData.client_secret) {
        throw new Error('Failed to get OpenAI session data');
      }
      
      // You can customize which agent to use based on the call
      // For now, we'll use a simple configuration
      const agent = new RealtimeAgent({
        name: "phone_assistant",
        voice: "shimmer",
        instructions: `You are a helpful phone assistant. You are speaking to a caller over the phone. Keep your responses conversational and natural. Speak clearly and at a moderate pace. Start by greeting the caller.`,
        handoffs: [],
        tools: [],
        handoffDescription: 'Phone assistant for Twilio calls'
      });

      this.openaiSession = new RealtimeSession(agent, {
        model: 'gpt-4o-realtime-preview-2025-06-03',
        config: {
          inputAudioFormat: 'pcm16',
          outputAudioFormat: 'pcm16',
          inputAudioTranscription: {
            model: 'gpt-4o-mini-transcribe',
          },
        },
      });

      await this.openaiSession.connect({ apiKey: sessionData.client_secret.value });
      console.log('OpenAI session connected successfully');
      
      // Send initial greeting
      this.openaiSession.sendMessage("Hello! I'm your AI assistant. How can I help you today?");
      
      // Set up audio handling after connection
      this.setupAudioHandling();

    } catch (error) {
      console.error('Error initializing OpenAI session:', error);
              // Send error message to Twilio
        this.sendErrorToTwilio('Failed to initialize AI session');
    }
  }

  private convertMulawToPCM(mulawData: string): ArrayBuffer {
    // Convert base64 μ-law to ArrayBuffer
    const buffer = Buffer.from(mulawData, 'base64');
    
    // Convert μ-law to linear PCM (simplified conversion)
    // In a production environment, you'd want to use a proper μ-law decoder
    const pcmBuffer = new ArrayBuffer(buffer.length * 2);
    const pcmView = new Int16Array(pcmBuffer);
    
    for (let i = 0; i < buffer.length; i++) {
      // Simplified μ-law to linear conversion
      const mulawByte = buffer[i];
      pcmView[i] = this.mulawToLinear(mulawByte);
    }
    
    return pcmBuffer;
  }

  private mulawToLinear(mulaw: number): number {
    // Standard μ-law to linear conversion
    mulaw = ~mulaw;
    const sign = mulaw & 0x80;
    const exponent = (mulaw >> 4) & 0x07;
    const mantissa = mulaw & 0x0F;
    let sample = mantissa << (exponent + 3);
    if (exponent !== 0) sample += (0x84 << exponent);
    return sign !== 0 ? -sample : sample;
  }

  private async sendAudioToOpenAI(audioData: ArrayBuffer) {
    if (this.openaiSession) {
      // Send audio data to OpenAI
      this.openaiSession.transport.sendEvent({
        type: 'input_audio_buffer.append',
        audio: audioData
      });
    }
  }

  private sendAudioToTwilio(audioData: any) {
    if (this.twilioWs.readyState === WebSocket.OPEN) {
      // Convert OpenAI audio back to μ-law for Twilio
      const mulawAudio = this.convertPCMToMulaw(audioData);
      const base64Audio = Buffer.from(mulawAudio).toString('base64');
      
      const message = {
        event: 'media',
        streamSid: this.streamSid,
        media: {
          payload: base64Audio
        }
      };
      
      this.twilioWs.send(JSON.stringify(message));
    }
  }

  private convertPCMToMulaw(pcmData: ArrayBuffer): Uint8Array {
    // Convert linear PCM to μ-law
    const pcmView = new Int16Array(pcmData);
    const mulawBuffer = new Uint8Array(pcmView.length);
    
    for (let i = 0; i < pcmView.length; i++) {
      mulawBuffer[i] = this.linearToMulaw(pcmView[i]);
    }
    
    return mulawBuffer;
  }

  private linearToMulaw(linear: number): number {
    // Standard linear to μ-law conversion
    const BIAS = 0x84;
    const CLIP = 32635;
    
    if (linear < 0) {
      linear = -linear;
      linear += BIAS;
      if (linear > CLIP) linear = CLIP;
      
      let exponent = 7;
      for (let expMask = 0x4000; (linear & expMask) === 0 && exponent > 0; exponent--) {
        expMask >>= 1;
      }
      
      const mantissa = (linear >> (exponent + 3)) & 0x0F;
      return ~(0x80 | (exponent << 4) | mantissa);
    } else {
      linear += BIAS;
      if (linear > CLIP) linear = CLIP;
      
      let exponent = 7;
      for (let expMask = 0x4000; (linear & expMask) === 0 && exponent > 0; exponent--) {
        expMask >>= 1;
      }
      
      const mantissa = (linear >> (exponent + 3)) & 0x0F;
      return ~(exponent << 4 | mantissa);
    }
  }

  private setupAudioHandling() {
    // TODO: Set up proper audio event handling
    // This needs to be implemented based on the actual RealtimeSession API
    console.log('Audio handling setup - needs implementation');
  }

  private sendErrorToTwilio(message: string) {
    console.error('Sending error to Twilio:', message);
    if (this.twilioWs.readyState === WebSocket.OPEN) {
      const errorMessage = {
        event: 'mark',
        streamSid: this.streamSid,
        mark: {
          name: 'error_occurred'
        }
      };
      this.twilioWs.send(JSON.stringify(errorMessage));
    }
  }

  private cleanup() {
    if (this.openaiSession) {
      this.openaiSession.close();
      this.openaiSession = null;
    }
  }
} 