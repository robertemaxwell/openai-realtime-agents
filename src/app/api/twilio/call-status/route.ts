import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const callStatus = formData.get('StreamStatus');
  
  console.log('Call status:', callStatus);
  
  // You can add additional logic here to handle different call statuses
  // For example, logging call duration, handling call completion, etc.
  
  return new NextResponse('OK', { status: 200 });
} 