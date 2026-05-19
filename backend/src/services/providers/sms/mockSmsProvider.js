// Mock SMS provider for local development.
//
// Just prints the OTP to the backend console — no carrier involved. This is
// the recommended provider while you're learning the OTP flow because it's
// free, instant, and works without a phone/SIM/SMS-gateway. NEVER use this
// in production: it's a giant unauthenticated leak of OTPs into logs.

export const MockSmsProvider = {
    name: 'mock',
    async sendOtpSms(toPhoneNumber, otp) {
        // Loud banner so it's obvious in `npm run dev` output where to find the code.
        const banner = '='.repeat(60);
        console.log(`\n${banner}`);
        console.log(`[sms:mock]  📱  OTP for ${toPhoneNumber}: ${otp}`);
        console.log(`${banner}\n`);
    },
};
