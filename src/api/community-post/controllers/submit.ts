import crypto from 'crypto';

function generateAnonymousUsername(identityKey: string) {
  const hash = crypto
    .createHash('sha256')
    .update(identityKey)
    .digest('hex')
    .substring(0, 8)
    .toUpperCase();

  return `CSITABMC_${hash}_GM`;
}

export default {
  async submit(ctx: any) {
    try {
      const { message, identityKey } = ctx.request.body ?? {};

      // Validate message
      if (
        typeof message !== 'string' ||
        !message.trim()
      ) {
        return ctx.badRequest('Message is required.');
      }

      // Validate anonymous installation identity
      if (
        typeof identityKey !== 'string' ||
        !identityKey.trim()
      ) {
        return ctx.badRequest(
          'Identity key is required.'
        );
      }

      // Basic size protection
      if (identityKey.length > 500) {
        return ctx.badRequest(
          'Invalid identity key.'
        );
      }

      const cleanMessage = message
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1000);

      const username =
        generateAnonymousUsername(
          identityKey.trim()
        );

      // Always force anonymous submissions to:
      // source = user
      // status = draft
      const post = await strapi
        .documents(
          'api::community-post.community-post'
        )
        .create({
          data: {
            username,
            message: cleanMessage,
            source: 'user',
          },

          status: 'draft',
        });

      ctx.body = {
        success: true,
        message:
          'Your post has been submitted for review.',
        documentId: post.documentId,
      };
    } catch (error) {
      strapi.log.error(
        '[Community] Submission failed:',
        error
      );

      return ctx.internalServerError(
        'Unable to submit community post.'
      );
    }
  },
};