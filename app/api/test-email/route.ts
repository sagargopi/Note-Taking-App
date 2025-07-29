import { NextResponse } from 'next/server';
import { sendOTPEmail } from '@/lib/email';

export async function GET() {
  try {
    const testEmail = 'sagargopime@gmail.com'; // Replace with your test email
    const testOTP = '123456';
    
    console.log('Sending test email to:', testEmail);
    const result = await sendOTPEmail(testEmail, testOTP, 'Test User');
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
      messageId: result.messageId,
      error: result.error?.toString()
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: error },
      { status: 500 }
    );
  }
}
