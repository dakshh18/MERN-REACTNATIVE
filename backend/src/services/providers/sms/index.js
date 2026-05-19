import { ENV } from '../../../config/env.js';
import { MockSmsProvider } from './mockSmsProvider.js';
import { AndroidSmsGatewayProvider } from './androidSmsGatewayProvider.js';

// Factory: pick the SMS provider based on SMS_PROVIDER env var.
//
//   mock                  → console log only (default, dev/learning)
//   android-sms-gateway   → POST to a self-hosted android-sms-gateway instance
//
// To extend: add a new file under this directory exporting an object with a
// { name, async sendOtpSms(phone, otp) } shape, then wire it into the switch.
export function getSmsProvider() {
    const choice = (ENV.SMS_PROVIDER || 'mock').toLowerCase();
    switch (choice) {
        case 'mock':
            return MockSmsProvider;
        case 'android-sms-gateway':
        case 'android':
        case 'smsgate':
            return AndroidSmsGatewayProvider;
        default:
            console.warn(
                `[sms] Unknown SMS_PROVIDER="${choice}", falling back to mock.`
            );
            return MockSmsProvider;
    }
}
