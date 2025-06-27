import { NextRequest, NextResponse } from "next/server";
import { audioCache } from "../../voice-webhook/route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: audioId } = await params;
    const audioBuffer = audioCache.get(audioId);
    
    if (!audioBuffer) {
      return new NextResponse('Audio not found', { status: 404 });
    }
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error serving audio:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 