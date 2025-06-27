import { NextRequest, NextResponse } from "next/server";
import twilio from 'twilio';

export async function POST(request: NextRequest) {
  try {
    console.log('Simple Twilio voice webhook called');
    
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    
    // Simple greeting without WebSocket streaming
    response.say({
      voice: 'Polly.Joanna'
    }, 'Hello! This is your AI assistant. The WebSocket integration is being tested. Please hold while we connect you to the advanced features.');
    
    // Pause for a moment
    response.pause({
      length: 2
    });
    
    // Try to connect to WebSocket stream
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const wsUrl = baseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    
    console.log('Attempting WebSocket connection to:', `${wsUrl}/api/twilio/audio-stream`);
    
    response.connect({
      action: `${baseUrl}/api/twilio/call-status`
    }).stream({
      url: `${wsUrl}/api/twilio/audio-stream`,
      track: 'both' as any
    });

    const twimlResponse = response.toString();
    console.log('Simple TwiML Response:', twimlResponse);

    return new NextResponse(twimlResponse, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error in simple voice webhook:', error);
    
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    
    response.say({
      voice: 'Polly.Joanna'
    }, 'Hello! I am your AI assistant. There was a technical issue with the advanced features, but basic functionality is working. Please try calling again in a moment.');
    
    return new NextResponse(response.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
} 