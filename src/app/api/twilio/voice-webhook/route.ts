import { NextRequest, NextResponse } from "next/server";
import twilio from 'twilio';

export async function POST(request: NextRequest) {
  try {
    console.log('Twilio voice webhook called');
    
    const VoiceResponse = twilio.twiml.VoiceResponse;
    
    const response = new VoiceResponse();
    
    // Get the base URL from the request
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    
    // Start the call and connect to WebSocket for audio streaming
    const wsUrl = baseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    
    console.log('WebSocket URL:', `${wsUrl}/api/twilio/audio-stream`);
    
    response.connect({
      action: `${baseUrl}/api/twilio/call-status`
    }).stream({
      url: `${wsUrl}/api/twilio/audio-stream`,
      track: 'both' as any
    });

    const twimlResponse = response.toString();
    console.log('TwiML Response:', twimlResponse);

    return new NextResponse(twimlResponse, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error in voice webhook:', error);
    
    // Return a simple TwiML response that will say something instead of failing
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    
    response.say({
      voice: 'Polly.Joanna'
    }, 'Hello! I\'m your AI assistant. There was a technical issue, but I\'m working on it. Please try calling again.');
    
    return new NextResponse(response.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
} 