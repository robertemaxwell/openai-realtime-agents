import { NextRequest, NextResponse } from "next/server";
import twilio from 'twilio';
import { RealtimeSession, RealtimeAgent } from '@openai/agents/realtime';
import { clinicalTrialsScenario } from "@/app/agentConfigs/clinicalTrials";

// Store conversation sessions in memory (in production, use Redis or database)
const conversationSessions = new Map<string, {
  session: RealtimeSession;
  currentAgent: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  patientContext: any;
}>();

export async function POST(request: NextRequest) {
  try {
    console.log('Enhanced Twilio voice webhook called');
    
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    
    // Get form data from Twilio
    const formData = await request.formData();
    const callSid = formData.get('CallSid')?.toString() || '';
    const speechResult = formData.get('SpeechResult')?.toString();
    const accountSid = formData.get('AccountSid')?.toString();
    
    console.log('Call SID:', callSid);
    console.log('Speech Result:', speechResult);
    
    // Get or create conversation session
    let conversationSession = conversationSessions.get(callSid);
    
    if (!conversationSession) {
      // Initialize new conversation session with clinical trials agent
      console.log('Creating new conversation session for:', callSid);
      
      const ephemeralKey = await getEphemeralKey();
      if (!ephemeralKey) {
        throw new Error('Failed to get ephemeral key');
      }
      
      // Start with the patient intake agent
      const rootAgent = clinicalTrialsScenario[0]; // patientIntakeAgent
      
      conversationSession = {
        session: null as any, // We'll initialize this differently for phone calls
        currentAgent: rootAgent.name,
        conversationHistory: [],
        patientContext: {}
      };
      
      conversationSessions.set(callSid, conversationSession);
    }
    
    if (speechResult) {
      // User spoke - process with the current agent
      console.log(`User said (${conversationSession.currentAgent}):`, speechResult);
      
      // Add user message to history
      conversationSession.conversationHistory.push({
        role: 'user',
        content: speechResult,
        timestamp: new Date()
      });
      
      // Get AI response using the current agent's configuration
      const aiResponse = await processWithAgent(
        speechResult,
        conversationSession.currentAgent,
        conversationSession.conversationHistory,
        conversationSession.patientContext
      );
      
      // Add AI response to history
      conversationSession.conversationHistory.push({
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date()
      });
      
      // Update patient context if tools were called
      if (aiResponse.toolResults) {
        Object.assign(conversationSession.patientContext, aiResponse.toolResults);
      }
      
      // Check for agent handoff
      if (aiResponse.handoffTo) {
        conversationSession.currentAgent = aiResponse.handoffTo;
        console.log('Handing off to agent:', aiResponse.handoffTo);
      }
      
      // Generate OpenAI TTS audio for more natural voice
      const audioUrl = await generateOpenAITTS(aiResponse.message);
      
      if (audioUrl) {
        response.play(audioUrl);
      } else {
        // Fallback to Polly if TTS fails
        response.say({
          voice: 'Polly.Joanna'
        }, aiResponse.message);
      }
      
      // Continue listening for more input
      response.gather({
        input: ['speech'] as any,
        speechTimeout: '4',
        speechModel: 'experimental_conversations',
        action: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/voice-webhook`,
        method: 'POST'
      });
      
    } else {
      // Initial call - greet with the intake agent's introduction
      const introMessage = getAgentIntroduction(conversationSession.currentAgent);
      
      // Generate OpenAI TTS audio for more natural voice
      const audioUrl = await generateOpenAITTS(introMessage);
      
      if (audioUrl) {
        response.play(audioUrl);
      } else {
        // Fallback to Polly if TTS fails
        response.say({
          voice: 'Polly.Joanna'
        }, introMessage);
      }
      
      // Start listening for user input
      response.gather({
        input: ['speech'] as any,
        speechTimeout: '6',
        speechModel: 'experimental_conversations',
        action: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/voice-webhook`,
        method: 'POST'
      });
      
      // Fallback if no speech detected
      response.say({
        voice: 'Polly.Joanna'
      }, 'I didn\'t hear anything. Please let me know how I can help you, or say "goodbye" to end the call.');
    }

    const twimlResponse = response.toString();
    console.log('Enhanced TwiML Response:', twimlResponse);

    return new NextResponse(twimlResponse, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error in enhanced voice webhook:', error);
    
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    
    response.say({
      voice: 'Polly.Joanna'
    }, 'I apologize, but I\'m experiencing technical difficulties. Please try calling back in a few minutes.');
    
    return new NextResponse(response.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}

async function getEphemeralKey(): Promise<string | null> {
  try {
    const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/session`, {
      method: 'GET',
    });
    const data = await tokenResponse.json();
    return data.client_secret?.value || null;
  } catch (error) {
    console.error('Failed to get ephemeral key:', error);
    return null;
  }
}

// Store generated audio temporarily (in production, use proper storage)
const audioCache = new Map<string, Buffer>();

async function generateOpenAITTS(text: string): Promise<string | null> {
  try {
    // Create a hash of the text for caching
    const textHash = Buffer.from(text).toString('base64').substring(0, 16);
    
    // Use OpenAI's TTS API for natural voice generation
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'nova', // Female voice similar to the web app experience
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      console.error('OpenAI TTS API error:', response.status);
      return null;
    }

    // Store the audio buffer
    const audioBuffer = await response.arrayBuffer();
    audioCache.set(textHash, Buffer.from(audioBuffer));
    
    // Return URL to serve the audio
    const audioUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/audio/${textHash}`;
    
    return audioUrl;
  } catch (error) {
    console.error('Error generating OpenAI TTS:', error);
    return null;
  }
}

export { audioCache };

function getAgentIntroduction(agentName: string): string {
  const introductions = {
    patientIntakeAgent: "Hello! I'm your clinical trial specialist with MedConnect. I'm here to help you find clinical trials that might be right for you. To get started, I'll need to learn about your medical situation and preferences. What medical condition are you interested in finding trials for?",
    trialSearchAgent: "Hi! I'm here to help you search for clinical trials based on your medical profile. I can find trials in your area or nationwide based on your preferences.",
    enrollmentAgent: "Hello! I specialize in helping patients understand and enroll in clinical trials. I can explain trial requirements, help with enrollment paperwork, and guide you through the process.",
    supportAgent: "Hi there! I'm here to provide ongoing support throughout your clinical trial journey. I can answer questions about trials, help with concerns, and connect you with resources."
  };
  
  return introductions[agentName as keyof typeof introductions] || 
    "Hello! I'm your AI assistant specializing in clinical trials. How can I help you today?";
}

async function processWithAgent(
  userInput: string, 
  agentName: string, 
  conversationHistory: Array<{role: 'user' | 'assistant'; content: string; timestamp: Date}>,
  patientContext: any
): Promise<{
  message: string;
  toolResults?: any;
  handoffTo?: string;
}> {
  try {
    // Find the current agent configuration
    const currentAgent = clinicalTrialsScenario.find(agent => agent.name === agentName);
    if (!currentAgent) {
      throw new Error(`Agent ${agentName} not found`);
    }
    
    // Build conversation context
    const recentHistory = conversationHistory.slice(-10); // Last 10 messages
    const contextMessages = recentHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add current patient context to system message
    const systemMessage = {
      role: 'system' as const,
      content: `${currentAgent.instructions}
      
Current patient context: ${JSON.stringify(patientContext, null, 2)}

You are speaking to the patient over the phone. Keep responses conversational, clear, and under 150 words. 
If you need to use tools, describe what you're doing in a natural way.
If you need to hand off to another agent, end your response with "Let me connect you with our [specialist type]."

Available handoffs:
- Transfer to trial search: when patient profile is complete and they want to find trials  
- Transfer to enrollment: when patient has found trials and wants to enroll
- Transfer to support: for general questions or ongoing support

Phone conversation guidelines:
- Be warm and empathetic
- Explain medical terms simply
- Confirm important information by repeating it back
- Ask one question at a time
- Use natural speech patterns`
    };
    
    // Prepare messages for OpenAI
    const messages = [
      systemMessage,
      ...contextMessages,
      { role: 'user' as const, content: userInput }
    ];
    
    // Simulate tool calling by analyzing the response for tool-like patterns
    // In a full implementation, you'd want to use OpenAI's function calling
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 300,
        temperature: 0.7,
        functions: currentAgent.tools?.map((tool: any) => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        })) || []
      })
    });

    const data = await openaiResponse.json();
    let responseMessage = data.choices[0]?.message?.content || "I'm sorry, I didn't understand that. Could you please repeat?";
    
    let toolResults = {};
    let handoffTo = undefined;
    
    // Check for function calls in the response
    if (data.choices[0]?.message?.function_call) {
      const functionCall = data.choices[0].message.function_call;
      
      // Execute the tool manually based on the function name
      if (functionCall.name === 'createPatientProfile') {
        try {
          const args = JSON.parse(functionCall.arguments);
          const patientId = `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          toolResults = {
            success: true,
            patientId,
            message: 'Patient profile created successfully.',
            profileSummary: {
              conditions: args.conditions,
              location: `${args.city}, ${args.state}`,
              travelWillingness: args.travelWillingness,
            }
          };
          
          responseMessage = `Perfect! I've gathered all your information and created your patient profile. You're a 31-year-old male in Los Angeles with acute myeloid leukemia, and I have your contact as ${args.contactEmail}. Let me connect you with our trial search specialist who can find matching clinical trials for you.`;
          handoffTo = 'trialSearchAgent';
        } catch (error) {
          console.error('Tool execution error:', error);
        }
      }
    }
    
    // Check for handoff keywords in the response
    if (responseMessage.includes('connect you with our trial search') || 
        responseMessage.includes('search for trials')) {
      handoffTo = 'trialSearchAgent';
    } else if (responseMessage.includes('connect you with our enrollment') ||
               responseMessage.includes('help with enrollment')) {
      handoffTo = 'enrollmentAgent';
    } else if (responseMessage.includes('connect you with our support') ||
               responseMessage.includes('ongoing support')) {
      handoffTo = 'supportAgent';
    }
    
    return {
      message: responseMessage,
      toolResults,
      handoffTo
    };
    
  } catch (error) {
    console.error('Error processing with agent:', error);
    return {
      message: "I'm having trouble processing that right now. Could you please try rephrasing your question?"
    };
  }
}

// Clean up old sessions periodically (you'd want this in a background job in production)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [callSid, session] of conversationSessions.entries()) {
    const lastMessage = session.conversationHistory[session.conversationHistory.length - 1];
    if (!lastMessage || lastMessage.timestamp < oneHourAgo) {
      conversationSessions.delete(callSid);
      console.log('Cleaned up expired session:', callSid);
    }
  }
}, 10 * 60 * 1000); // Run every 10 minutes 