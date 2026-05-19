import net from 'net';
import { ENV } from '../../../config/env.js';

// Tiny SMTP-over-plain-TCP sender targeted at Mailpit (the local SMTP catcher).
//
// We avoid a nodemailer dep because Mailpit listens on plain SMTP at
// localhost:1025 with no auth and no TLS — the whole handshake is a few
// lines of `cmd → expected-code` ping-pong. If you ever swap to a real
// provider, replace this provider with a nodemailer-backed one.
//
// Mailpit web UI: http://localhost:8025 — open it to see the OTP arrive.

function readLine(socket) {
    return new Promise((resolve, reject) => {
        let buf = '';
        const onData = (chunk) => {
            buf += chunk.toString('utf8');
            const nl = buf.indexOf('\r\n');
            if (nl !== -1) {
                cleanup();
                resolve(buf.slice(0, nl));
            }
        };
        const onError = (err) => {
            cleanup();
            reject(err);
        };
        const cleanup = () => {
            socket.off('data', onData);
            socket.off('error', onError);
        };
        socket.on('data', onData);
        socket.on('error', onError);
    });
}

async function send(socket, line, expectedCode) {
    socket.write(`${line}\r\n`);
    const response = await readLine(socket);
    if (expectedCode && !response.startsWith(String(expectedCode))) {
        throw new Error(`SMTP: expected ${expectedCode}, got "${response}"`);
    }
    return response;
}

function buildMessage({ from, to, subject, text }) {
    return [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        '',
        text,
        '.',
    ].join('\r\n');
}

async function sendViaSmtp({ host, port, from, to, subject, text }) {
    return new Promise((resolve, reject) => {
        const socket = net.createConnection({ host, port });
        socket.setEncoding('utf8');
        socket.setTimeout(10_000, () => {
            socket.destroy(new Error('SMTP timeout'));
        });

        socket.once('connect', async () => {
            try {
                // Greeting (220), then EHLO/MAIL FROM/RCPT TO/DATA dance.
                await readLine(socket);
                await send(socket, 'EHLO localhost', 250);
                await send(socket, `MAIL FROM:<${stripAngles(from)}>`, 250);
                await send(socket, `RCPT TO:<${to}>`, 250);
                await send(socket, 'DATA', 354);
                socket.write(`${buildMessage({ from, to, subject, text })}\r\n`);
                const dataResp = await readLine(socket);
                if (!dataResp.startsWith('250')) {
                    throw new Error(`SMTP DATA: ${dataResp}`);
                }
                await send(socket, 'QUIT', 221);
                socket.end();
                resolve();
            } catch (err) {
                socket.destroy();
                reject(err);
            }
        });

        socket.once('error', reject);
    });
}

function stripAngles(emailLike) {
    // From-headers often look like `Name <a@b>`. SMTP MAIL FROM wants just a@b.
    const m = /<([^>]+)>/.exec(emailLike);
    return m ? m[1] : emailLike;
}

export const MailpitEmailProvider = {
    name: 'mailpit',
    async sendOtpEmail(toEmail, otp) {
        const host = ENV.SMTP_HOST || 'localhost';
        const port = Number(ENV.SMTP_PORT || 1025);
        const from = ENV.EMAIL_FROM || 'Your App <no-reply@local.test>';
        const subject = 'Your verification code';
        const text =
            `Your one-time verification code is: ${otp}\n\n` +
            `This code expires in ${ENV.AUTH_OTP_EXPIRY_MINUTES || 5} minutes.\n` +
            `If you did not request this, you can safely ignore this email.`;

        try {
            await sendViaSmtp({ host, port, from, to: toEmail, subject, text });
            console.log(`[email] OTP sent to ${toEmail} via Mailpit at ${host}:${port}`);
        } catch (err) {
            // Don't crash the request — in dev the user can still see the SMS
            // OTP in console logs. Log clearly so the dev knows Mailpit isn't up.
            console.error(
                `[email] Mailpit send failed (${host}:${port}): ${err.message}. ` +
                `Is Mailpit running? Try \`mailpit\` or the Docker one-liner in AUTH_OTP_SETUP.md.`
            );
        }
    },
};
