const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type PushDevice = {
  documentId?: string;
  token: string;
  enabled?: boolean;
};

export async function sendNoticePush(strapi: any, notice: any) {
  try {
    const devices = (await strapi
      .documents('api::push-device.push-device')
      .findMany({
        filters: {
          enabled: true,
        },
      })) as PushDevice[];

    const tokens = devices
      .map((device) => device.token)
      .filter(Boolean);

    if (tokens.length === 0) {
      strapi.log.info('[Push] No enabled devices registered.');
      return;
    }

    const messages = tokens.map((token) => ({
      to: token,
      sound: 'default',
      priority: 'high',

      // Must match Android channel created in Expo
      channelId: 'notices',

      title: 'New Notice',
      body: notice.title || 'A new notice has been published.',

      data: {
        type: 'notice',
        noticeId: notice.documentId,
        documentId: notice.documentId,
        category: notice.category,
      },
    }));

    // Expo accepts up to 100 messages per request
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);

      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          `Expo Push API failed: ${response.status} ${JSON.stringify(result)}`
        );
      }

      strapi.log.info(
        `[Push] Sent notice "${notice.title}" to ${chunk.length} device(s)`
      );

      strapi.log.debug(`[Push] Expo response: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    strapi.log.error('[Push] Failed to send notice notification:', error);
  }
}