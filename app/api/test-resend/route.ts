import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Define types for Resend API responses
interface ResendErrorResponse {
  name: string;
  message: string;
  statusCode?: number;
  code?: string;
}

interface ResendSuccessResponse {
  id: string;
}

export async function GET() {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    
    // Test the API key by making a simple request
    const response = await resend.emails.send({
      from: 'test@hdnotes.com',
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'This is a test email to verify Resend API connection.',
    });

    // Check if the response has an error property
    if ('error' in response) {
      const error = response.error as ResendErrorResponse;
      return NextResponse.json(
        { 
          success: false, 
          error: {
            name: error.name,
            message: error.message,
            statusCode: error.statusCode,
            code: error.code
          }
        },
        { status: error.statusCode || 500 }
      );
    }

    const successResponse = response as { data: ResendSuccessResponse };
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Resend API',
      data: {
        id: successResponse.data?.id,
        // Don't expose sensitive data
        email: 'test@example.com',
      }
    });
  } catch (error: unknown) {
    console.error('Resend API test error:', error);
    
    // Safely handle the error with proper type checking
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    const errorName = error && typeof error === 'object' && 'name' in error
      ? String(error.name)
      : 'Error';
      
    const statusCode = error && typeof error === 'object' && 'statusCode' in error
      ? (error as { statusCode: number }).statusCode
      : 500;
      
    const errorStack = error instanceof Error && process.env.NODE_ENV === 'development' 
      ? error.stack 
      : undefined;

    return NextResponse.json(
      { 
        success: false, 
        error: {
          name: errorName,
          message: errorMessage,
          ...(errorStack && { stack: errorStack })
        }
      },
      { status: statusCode }
    );
  }
}
