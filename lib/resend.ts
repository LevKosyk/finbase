import { Resend } from 'resend';

// Make sure RESEND_API_KEY is in your .env
export const resend = new Resend(process.env.RESEND_API_KEY);
