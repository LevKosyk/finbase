"use server";

import { resend } from "@/lib/resend";
import ConfirmEmail from "@/components/emails/ConfirmEmail";

export async function sendVerificationCode(email: string, code: string) {
    if (!process.env.RESEND_API_KEY) {
        return { error: "Resend API Key is missing" };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: "Finbase <onboarding@resend.dev>", // Or your verified domain like 'noreply@finbase.app'
            to: [email],
            subject: "Ваш код підтвердження Finbase",
            react: ConfirmEmail({ validationCode: code }),
        });

        if (error) {
            console.error("Resend Error:", error);
            return { error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Email Sending Error:", error);
        return { error: "Failed to send email" };
    }
}
