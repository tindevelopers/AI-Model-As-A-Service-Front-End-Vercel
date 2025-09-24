import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Deployment test API route is working!',
    timestamp: new Date().toISOString(),
    status: 'success',
    deployment_id: Math.random().toString(36).substring(7)
  });
}
