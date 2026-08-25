const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Your Strapi server origin — WITHOUT /api
const STRAPI_ORIGIN = 'https://dashboard.csitabmc.com';

type PushDevice = {
  documentId?: string;
  token: string;
  enabled?: boolean;
};

function getNotificationTitle(title: unknown): string {
  if (typeof title !== 'string') {
    return 'New Notice';
  }

  const clean = title
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) {
    return 'New Notice';
  }

  // Keep notification title reasonably short
  return clean.length > 80
    ? `${clean.substring(0, 77)}...`
    : clean;
}

function getNotificationDescription(description: unknown): string {
  if (typeof description !== 'string') {
    return 'Tap to view the new notice.';
  }

  const clean = description
    .replace(/<[^>]*>/g, '')
    .replace(/[#*_>`~[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) {
    return 'Tap to view the new notice.';
  }

  return clean.length > 180
    ? `${clean.substring(0, 177)}...`
    : clean;
}


/**
 * Get the first IMAGE from the Notice media field.
 *
 * Notice.image is configured as multiple media and
 * may also contain files, so only use actual images.
 */
function getNoticeImageUrl(notice: any): string | undefined {
  if (!notice?.image) {
    return undefined;
  }

  const mediaItems = Array.isArray(notice.image)
    ? notice.image
    : [notice.image];

  const firstImage = mediaItems.find(
    (item: any) =>
      item?.url &&
      (!item?.mime || item.mime.startsWith('image/'))
  );

  if (!firstImage?.url) {
    return undefined;
  }

  // Cloudinary/S3/etc. may already return a complete URL
  if (
    firstImage.url.startsWith('https://') ||
    firstImage.url.startsWith('http://')
  ) {
    return firstImage.url;
  }

  // Strapi local uploads usually return /uploads/...
  return `${STRAPI_ORIGIN}${firstImage.url}`;
}

export async function sendNoticePush(
  strapi: any,
  notice: any
) {
  try {
    // Get all enabled devices
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
      strapi.log.info(
        '[Push] No enabled devices registered.'
      );

      return;
    }

    // Get image preview if notice contains an image
    const imageUrl = getNoticeImageUrl(notice);

    strapi.log.info(
      `[Push] Notice image: ${imageUrl ?? 'No image'}`
    );

    const messages = tokens.map((token) => ({
      to: token,

      sound: 'default',

      priority: 'high',

      // Must match the Android channel created in Expo
      channelId: 'notices',

      // Actual Notice title
      title: getNotificationTitle(notice?.title),
      body: getNotificationDescription(
        notice?.description
      ),

      ...(imageUrl
        ? {
            richContent: {
              image: imageUrl,
            },
          }
        : {}),

      // Extra data available to the Expo app
      data: {
        type: 'notice',

        noticeId: notice.documentId,

        documentId: notice.documentId,

        category: notice.category,

        imageUrl: imageUrl ?? null,
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
          `Expo Push API failed: ${
            response.status
          } ${JSON.stringify(result)}`
        );
      }

      strapi.log.info(
        `[Push] Sent notice "${notice.title}" to ${chunk.length} device(s)`
      );

      strapi.log.debug(
        `[Push] Expo response: ${JSON.stringify(result)}`
      );
    }
  } catch (error) {
    strapi.log.error(
      '[Push] Failed to send notice notification:',
      error
    );
  }
}