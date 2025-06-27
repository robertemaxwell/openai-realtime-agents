import { NextRequest, NextResponse } from "next/server";
import twilio from 'twilio';

export async function GET() {
  try {
    const requiredEnvVars = [
      'OPENAI_API_KEY',
      'TWILIO_ACCOUNT_SID', 
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE_NUMBER'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing required environment variables',
        missingVariables: missingVars
      }, { status: 400 });
    }

    // Test Twilio connection
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    try {
      await client.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
    } catch (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid Twilio credentials',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'All environment variables configured correctly',
      config: {
        openaiConfigured: !!process.env.OPENAI_API_KEY,
        twilioConfigured: true,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Configuration test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 