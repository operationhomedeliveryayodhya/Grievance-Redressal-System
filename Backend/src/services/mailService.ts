import dotenv from 'dotenv';

dotenv.config();

export const sendOTPEmail = async (email: string, otp: string, name: string = 'User') => {
  console.log(`Attempting to send OTP via EmailJS to ${email}`);

  const data = {
    service_id: 'service_c4vpo1p',
    template_id: 'template_7blk1ch',
    user_id: 'XfIj_4J13gpzqBSbN',
    accessToken: 'smoSJUGOvKqYjQvUE4tWZ', // Private Key for strict mode
    template_params: {
      otp: otp,
      to_email: email,
      email: email, // Adding this as a fallback
      user_name: name,
    }
  };

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log(`OTP successfully sent via EmailJS to ${email}`);
    } else {
      const errorText = await response.text();
      console.error('EmailJS Error Response:', errorText);
      throw new Error(`EmailJS Failed: ${errorText}`);
    }
  } catch (error: any) {
    console.error('Error in sendOTPEmail:', error);
    // Log the OTP as fallback so user isn't stuck
    console.log(`FALLBACK OTP FOR ${email}: ${otp}`);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
