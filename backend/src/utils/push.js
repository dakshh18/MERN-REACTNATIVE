// Sends push notifications via Expo's push service.
// https://docs.expo.dev/push-notifications/sending-notifications/#http2-api
//
// tokens: array of Expo push tokens (e.g. "ExponentPushToken[...]"). Invalid
// tokens are silently skipped by Expo; we filter obvious junk client-side.
// data: optional object payload available to the app on tap.
export async function sendPushNotifications(tokens, { title, body, data }) {
    console.log('[push] attempting send to', tokens?.length ?? 0, 'tokens. title=', title);
    const valid = (tokens || []).filter(
        (t) => typeof t === 'string' && t.startsWith('ExponentPushToken')
    );
    console.log('[push] valid tokens after filter:', valid.length);
    if (valid.length === 0) {
        console.warn('[push] no valid tokens, skipping send. raw tokens:', tokens);
        return { sent: 0, skipped: 0 };
    }

    const messages = valid.map((to) => ({
        to,
        sound: 'default',
        title,
        body,
        data: data ?? {},
        priority: 'high',
    }));

    try {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });
        const json = await res.json().catch(() => ({}));
        console.log('[push] expo response status=', res.status, 'body=', JSON.stringify(json));
        if (!res.ok) {
            console.error('[push] non-200 response:', res.status, json);
        }
        return { sent: valid.length, skipped: (tokens || []).length - valid.length, response: json };
    } catch (err) {
        console.error('[push] send failed:', err);
        return { sent: 0, skipped: (tokens || []).length, error: err.message };
    }
}
