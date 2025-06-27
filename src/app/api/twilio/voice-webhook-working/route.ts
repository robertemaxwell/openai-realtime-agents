import { NextRequest, NextResponse } from "next/server";
import twilio from 'twilio';

export async function POST(request: NextRequest) {
  try {
    console.log('Working Twilio voice webhook called');
    
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    
    // Check if this is a user input response
    const formData = await request.formData();
    const speechResult = formData.get('SpeechResult');
    
    if (speechResult) {
      // User spoke - process with OpenAI and respond
      console.log('User said:', speechResult);
      
      // Get OpenAI response
      const aiResponse = await getOpenAIResponse(speechResult.toString());
      
      // Speak the AI response
      response.say({
        voice: 'Polly.Joanna'
      }, aiResponse);
      
      // Continue listening for more input
      response.gather({
        input: ['speech'] as any,
        speechTimeout: '3',
        action: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/voice-webhook-working`,
        method: 'POST'
      });
      
    } else {
      // Initial call - greet and start listening
      response.say({
        voice: 'Polly.Joanna'
      }, 'Hello! I am your AI assistant. Please tell me how I can help you today.');
      
      // Start listening for user input
      response.gather({
        input: ['speech'] as any,
        speechTimeout: '5',
        speechModel: 'experimental_conversations',
        action: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/voice-webhook-working`,
        method: 'POST'
      });
      
      // Fallback if no speech detected
      response.say({
        voice: 'Polly.Joanna'
      }, 'I didn\'t hear anything. Please try calling again.');
    }

    const twimlResponse = response.toString();
    console.log('Working TwiML Response:', twimlResponse);

    return new NextResponse(twimlResponse, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error in working voice webhook:', error);
    
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    
    response.say({
      voice: 'Polly.Joanna'
    }, 'Hello! I am your AI assistant. I\'m experiencing some technical difficulties but will be back shortly.');
    
    return new NextResponse(response.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}

async function getOpenAIResponse(userInput: string): Promise<string> {
  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant speaking to someone over the phone. Keep your responses conversational, helpful, and under 100 words. Speak naturally as if having a phone conversation.'
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    const data = await openaiResponse.json();
    return data.choices[0]?.message?.content || "I'm sorry, I didn't understand that. Could you please repeat?";
  } catch (error) {
    console.error('OpenAI API error:', error);
    return "I'm having trouble processing that right now. Could you try again?";
  }
} 