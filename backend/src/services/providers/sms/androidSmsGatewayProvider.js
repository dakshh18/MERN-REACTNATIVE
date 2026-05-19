import { ENV } from '../../../config/env.js';

// Optional provider for the open-source android-sms-gateway
// (https://github.com/capcom6/android-sms-gateway).
//
// IMPORTANT: this is "free software" not "free SMS" — it just uses the SIM
// in your own Android phone to send the message. You still pay your carrier
// for every SMS sent. Don't enable this until you've tested with MockSms.
//
// Configure via env:
//   SMS_PROVIDER=android-sms-gateway
//   SMS_GATEWAY_BASE_URL=http://<phone-ip>:8080   (or the hosted cloud URL)
//   SMS_GATEWAY_API_KEY=<basic-auth-token-or-bearer>
//
// The exact auth scheme depends on which mode of the gateway you're running
// (local / cloud / private). We pass the key as a Bearer token by default;
// switch to Basic in your reverse proxy if your gateway expects that.

export const AndroidSmsGatewayProvider = {
    name: 'android-sms-gateway',
    async sendOtpSms(toPhoneNumber, otp) {
        const baseUrl = ENV.SMS_GATEWAY_BASE_URL;
        const apiKey = ENV.SMS_GATEWAY_API_KEY;
        if (!baseUrl || !apiKey) {
            console.error(
                '[sms:android-gateway] SMS_GATEWAY_BASE_URL / SMS_GATEWAY_API_KEY missing — ' +
                'cannot send. Set them in backend/.env or fall back to SMS_PROVIDER=mock.'
            );
            return;
        }

        const url = `${baseUrl.replace(/\/$/, '')}/messages`;
        const body = {
            message: `Your verification code is ${otp}. It expires in ${
                ENV.AUTH_OTP_EXPIRY_MINUTES || 5
            } minutes.`,
            phoneNumbers: [toPhoneNumber],
        };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
            }
            console.log(
                `[sms:android-gateway] OTP dispatched to ${toPhoneNumber} via ${baseUrl}`
            );
        } catch (err) {
            // Surface but don't crash — request flow can still succeed (email OTP).
            console.error(
                `[sms:android-gateway] send failed for ${toPhoneNumber}: ${err.message}`
            );
        }
    },
};
