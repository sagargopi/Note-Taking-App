import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const isDev = process.env.NODE_ENV === 'development';

// Resend configuration
const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

// Initialize Resend client
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Gmail SMTP configuration (fallback)
const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
};

// Create transporter for Gmail (fallback)
const transporter = emailConfig.auth.user && emailConfig.auth.pass
  ? nodemailer.createTransport(emailConfig)
  : null;

type EmailResponse = {
  success: boolean;
  messageId?: string;
  error?: string;
};

const mockEmailService = {
  send: async (email: string, otp: string, firstName?: string): Promise<EmailResponse> => {
    console.log(`[MOCK] Email would be sent to ${email} with OTP: ${otp}`);
    return { 
      success: true, 
      messageId: `mock-${Date.now()}` 
    };
  }
};

// Resend email service using SDK
const resendEmailService = {
  send: async (email: string, otp: string, firstName?: string): Promise<EmailResponse> => {
    try {
      console.log(`🔍 Attempting to send email via Resend to: ${email}`);
      console.log(`🔍 Using sender: ${resendFromEmail}`);
      
      // Send to the actual email address
      const recipientEmail = email;
      
      if (!resend) {
        throw new Error('Resend client not initialized');
      }

      const { data, error } = await resend.emails.send({
        from: resendFromEmail,
        to: [recipientEmail],
        subject: 'Your HD Notes Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; text-align: center;">HD Notes</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #667eea;">
              <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
              <p style="color: #666; font-size: 16px;">Hello${firstName ? ` ${firstName}` : ''},</p>
              <p style="color: #666; font-size: 16px;">Your verification code is:</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #e9ecef;">
                <h1 style="color: #667eea; font-size: 2.5rem; letter-spacing: 0.2em; margin: 0; font-weight: bold;">${otp}</h1>
              </div>
              
              <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
              <p style="color: #666; font-size: 14px;">If you didn't request this verification, please ignore this email.</p>

            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #999; font-size: 12px;">
                HD Notes Team<br>
                <a href="#" style="color: #667eea;">Unsubscribe</a> | <a href="#" style="color: #667eea;">Privacy Policy</a>
              </p>
            </div>
          </div>
        `,
        text: `HD Notes Verification

Hello${firstName ? ` ${firstName}` : ''},

Your verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this verification, please ignore this email.


--
HD Notes Team`
      });

      if (error) {
        console.error('❌ Resend SDK error:', error);
        throw new Error(`Resend API error: ${error.message}`);
      }

      console.log('✅ Email sent successfully via Resend:', data?.id);
      return { success: true, messageId: data?.id };
      
    } catch (error) {
      console.error('❌ Resend email failed:', error);
      
      // Check if it's a network timeout error
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('fetch failed')) {
          console.log('🌐 Network timeout detected. This might be due to:');
          console.log('   - Firewall blocking the request');
          console.log('   - Network connectivity issues');
          console.log('   - Corporate network restrictions');
          console.log('   - VPN interference');
        }
      }
      
      throw error;
    }
  }
};

export async function sendOTPEmail(
  email: string, 
  otp: string, 
  firstName?: string
): Promise<EmailResponse> {
  try {
    // Skip Resend due to network issues and go directly to Gmail SMTP

    // Fall back to Gmail SMTP
    if (transporter) {
      try {
        console.log(`📧 Sending email to ${email} via Gmail SMTP`);
        
        const mailOptions = {
          from: `"HD Notes" <${emailConfig.auth.user}>`,
          to: email,
          subject: '🔐 Your HD Notes Verification Code',
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">HD Notes</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Secure Note Taking Platform</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Email Verification</h2>
                
                <p style="color: #6b7280; font-size: 16px; margin: 0 0 25px 0; line-height: 1.6;">
                  Hello${firstName ? ` ${firstName}` : ''},<br>
                  Please use the verification code below to complete your sign-in process.
                </p>
                
                <!-- OTP Code -->
                <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 25px; text-align: center; margin: 25px 0;">
                  <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0; font-weight: 500;">VERIFICATION CODE</p>
                  <h1 style="color: #1e40af; font-size: 32px; font-weight: 700; letter-spacing: 0.3em; margin: 0; font-family: 'Courier New', monospace;">${otp}</h1>
                </div>
                
                <!-- Security Info -->
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 0 6px 6px 0;">
                  <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
                    ⏰ This code expires in <strong>10 minutes</strong><br>
                    🔒 For your security, never share this code with anyone
                  </p>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin: 25px 0 0 0; line-height: 1.5;">
                  If you didn't request this verification code, please ignore this email. Your account security is our top priority.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  © 2024 HD Notes. All rights reserved.<br>
                  <a href="#" style="color: #667eea; text-decoration: none;">Privacy Policy</a> • 
                  <a href="#" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
                </p>
              </div>
            </div>
          `,
          text: `🔐 HD Notes Verification Code

Hello${firstName ? ` ${firstName}` : ''},

Your verification code is: ${otp}

⏰ This code expires in 10 minutes
🔒 For your security, never share this code with anyone

If you didn't request this verification code, please ignore this email.

---
HD Notes Team
Secure Note Taking Platform`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully via Gmail:', info.messageId);
        return { success: true, messageId: info.messageId };
        
      } catch (error) {
        console.error('Failed to send email via Gmail:', error);
        if (!isDev) throw error; // In production, re-throw the error
      }
    }

    // Fall back to mock service in development
    if (isDev) {
      console.log('🔄 Falling back to mock email service');
      return await mockEmailService.send(email, otp, firstName);
    }

    throw new Error('Email service not properly configured');

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}