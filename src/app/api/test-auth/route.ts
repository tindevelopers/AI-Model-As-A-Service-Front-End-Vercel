import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await AuthMiddleware.authenticateUser(request);
    
    if (!authResult.success) {
      return NextResponse.json({
        success: false,
        error: authResult.error,
        statusCode: authResult.statusCode
      }, { status: authResult.statusCode || 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authResult.user?.id,
        email: authResult.user?.email,
        role: authResult.user?.role,
        permissions: authResult.user?.permissions
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}