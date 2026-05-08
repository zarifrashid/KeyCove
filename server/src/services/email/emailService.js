import nodemailer from 'nodemailer'

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value).trim()
}

function getClientUrl(req) {
  const configuredUrl = normalizeString(process.env.CLIENT_URL)
  if (configuredUrl) return configuredUrl.replace(/\/$/, '')

  const origin = req?.get?.('origin') || ''
  if (origin) return origin.replace(/\/$/, '')

  return 'http://localhost:5173'
}

function getSmtpConfig() {
  const host = normalizeString(process.env.SMTP_HOST)
  const user = normalizeString(process.env.SMTP_USER)
  const pass = normalizeString(process.env.SMTP_PASS)

  if (!host || !user || !pass) {
    return null
  }

  const port = Number(process.env.SMTP_PORT || 587)
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465

  return {
    host,
    port,
    secure,
    auth: { user, pass }
  }
}

function buildTransporter() {
  const smtpConfig = getSmtpConfig()
  if (!smtpConfig) return null
  return nodemailer.createTransport(smtpConfig)
}

function getFromAddress() {
  return normalizeString(process.env.SMTP_FROM) || normalizeString(process.env.SMTP_USER) || 'KeyCove <no-reply@keycove.local>'
}

export function buildEmailVerificationUrl(req, token) {
  return `${getClientUrl(req)}/verify-email/${token}`
}

export async function sendVerificationEmail({ user, token, req }) {
  const verificationUrl = buildEmailVerificationUrl(req, token)
  const transporter = buildTransporter()

  if (!transporter) {
    console.log('Email verification SMTP is not configured. Development verification link:')
    console.log(verificationUrl)
    return { sent: false, verificationUrl }
  }

  await transporter.sendMail({
    from: getFromAddress(),
    to: user.email,
    subject: 'Verify your KeyCove email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #172033;">
        <h2 style="color: #0f4c81;">Welcome to KeyCove, ${user.name}!</h2>
        <p>Please verify your email address before logging in to your KeyCove account.</p>
        <p style="margin: 28px 0;">
          <a href="${verificationUrl}" style="background: #0f4c81; color: #ffffff; padding: 12px 18px; border-radius: 10px; text-decoration: none; font-weight: 700;">Verify Email</a>
        </p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #34495e;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create a KeyCove account, you can ignore this email.</p>
      </div>
    `,
    text: `Welcome to KeyCove, ${user.name}! Verify your email address before logging in: ${verificationUrl}. This link expires in 24 hours.`
  })

  return { sent: true }
}
