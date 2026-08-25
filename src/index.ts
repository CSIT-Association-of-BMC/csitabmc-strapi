import type { Core } from '@strapi/strapi';
import { sendNoticePush } from './utils/push-notifications';

export default {
  /**
   * Runs before Strapi initializes.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.documents.use(async (context: any, next: any) => {
      // Ignore everything except Notice publishing
      if (
        context.uid !== 'api::notice.notice' ||
        context.action !== 'publish'
      ) {
        return next();
      }

      const documentId = context.params?.documentId;

      strapi.log.info(
        `[Push] Notice publish detected: ${documentId}`
      );

      // Check whether this notice was already published before.
      // This prevents another notification when an existing
      // notice is edited and republished.
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

      // Allow Strapi to actually publish the notice
      const result = await next();

      // If it was already published before, don't notify again.
      if (alreadyPublished) {
        strapi.log.info(
          `[Push] Notice already published before. Skipping notification.`
        );

        return result;
      }

      try {
        // Fetch the newly published version
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

        await sendNoticePush(strapi, publishedNotice);
      } catch (error) {
        strapi.log.error(
          '[Push] Error while handling notice publication:',
          error
        );
      }

      return result;
    });
  },

  /**
   * Runs when Strapi starts.
   */
  bootstrap(/* { strapi }: { strapi: Core.Strapi } */) {},
};