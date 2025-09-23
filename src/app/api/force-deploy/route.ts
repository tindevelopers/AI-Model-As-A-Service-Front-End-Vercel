import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Force deploy API route is working!',
    timestamp: new Date().toISOString(),
    status: 'deployed',
    version: '2.2.2',
    deploymentId: 'force-deploy-test'
  });
}
