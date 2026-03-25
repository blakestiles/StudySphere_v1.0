import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "StudySphere <noreply@studysphere.app>",
    to,
    subject: "Reset your StudySphere password",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Reset Password</a>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "StudySphere <noreply@studysphere.app>",
    to,
    subject: "Verify your StudySphere email",
    html: `
      <h2>Email Verification</h2>
      <p>Click the link below to verify your email address.</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Verify Email</a>
    `,
  });
}
