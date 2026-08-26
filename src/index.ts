import type { Core } from '@strapi/strapi';

import {
  sendNoticePush,
  sendCustomPush,
} from './utils/push-notifications';

const STRAPI_ORIGIN = 'https://dashboard.csitabmc.com';

/**
 * Convert Strapi media URL into a public URL.
 */
function getMediaUrl(media: any): string | undefined {
  if (!media?.url) {
    return undefined;
  }

  if (
    media.url.startsWith('https://') ||
    media.url.startsWith('http://')
  ) {
    return media.url;
  }

  return `${STRAPI_ORIGIN}${media.url}`;
}

export default {
  /**
   * Runs before Strapi initializes.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.documents.use(async (context: any, next: any) => {
      /*
       * =====================================================
       * NORMAL NOTICE
       * =====================================================
       */
      if (
        context.uid === 'api::notice.notice' &&
        context.action === 'publish'
      ) {
        const documentId = context.params?.documentId;

        strapi.log.info(
          `[Push] Notice publish detected: ${documentId}`
        );

        // Check whether already published
        let alreadyPublished = false;

        if (documentId) {
          const existingPublishedNotice = await strapi
            .documents('api::notice.notice')
            .findOne({
              documentId,
              status: 'published',
            });

          alreadyPublished = !!existingPublishedNotice;
        }

        // Allow Strapi to publish
        const result = await next();

        // Prevent duplicate notification on republish
        if (alreadyPublished) {
          strapi.log.info(
            '[Push] Notice already published before. Skipping notification.'
          );

          return result;
        }

        try {
          const publishedNotice = await strapi
            .documents('api::notice.notice')
            .findOne({
              documentId,
              status: 'published',

              populate: {
                image: true,
              },
            });

          if (!publishedNotice) {
            strapi.log.warn(
              `[Push] Published notice could not be found: ${documentId}`
            );

            return result;
          }

          strapi.log.info(
            `[Push] Sending notification for: ${publishedNotice.title}`
          );

          await sendNoticePush(
            strapi,
            publishedNotice
          );
        } catch (error) {
          strapi.log.error(
            '[Push] Error while handling notice publication:',
            error
          );
        }

        return result;
      }

      /*
       * =====================================================
       * TEMPORARY NOTIFICATION
       * =====================================================
       */
      if (
        context.uid ===
          'api::temporary-notification.temporary-notification' &&
        context.action === 'publish'
      ) {
        const documentId = context.params?.documentId;

        strapi.log.info(
          `[Push] Temporary notification publish detected: ${documentId}`
        );

        // Prevent duplicate pushes if edited + republished
        let alreadyPublished = false;

        if (documentId) {
          const existingNotification = await strapi
            .documents(
              'api::temporary-notification.temporary-notification'
            )
            .findOne({
              documentId,
              status: 'published',
            });

          alreadyPublished = !!existingNotification;
        }

        // Publish first
        const result = await next();

        if (alreadyPublished) {
          strapi.log.info(
            '[Push] Temporary notification already published before. Skipping duplicate push.'
          );

          return result;
        }

        try {
          // Get published version and optional image
          const notification = await strapi
            .documents(
              'api::temporary-notification.temporary-notification'
            )
            .findOne({
              documentId,
              status: 'published',

              populate: {
                image: true,
              },
            });

          if (!notification) {
            strapi.log.warn(
              `[Push] Published temporary notification could not be found: ${documentId}`
            );

            return result;
          }

          const imageUrl = getMediaUrl(
            notification.image
          );

          strapi.log.info(
            `[Push] Sending temporary notification: ${notification.title}`
          );

          await sendCustomPush(strapi, {
            title: notification.title,

            description:
              notification.description,

            imageUrl,
          });
        } catch (error) {
          strapi.log.error(
            '[Push] Error while handling temporary notification publication:',
            error
          );
        }

        return result;
      }

      /*
       * Everything else in Strapi continues normally.
       */
      return next();
    });
  },

  /**
   * Runs when Strapi starts.
   */
  bootstrap(
    /* { strapi }: { strapi: Core.Strapi } */
  ) {},
};