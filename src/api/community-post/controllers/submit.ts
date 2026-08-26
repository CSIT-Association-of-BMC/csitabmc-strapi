import crypto from 'crypto';

function generateAnonymousUsername(pushToken: string) {
  const hash = crypto
    .createHash('sha256')
    .update(pushToken)
    .digest('hex')
    .substring(0, 8)
    .toUpperCase();

  return `CSITABMC_${hash}`;
}

export default {
  async submit(ctx: any) {
    try {
      const { message, pushToken } = ctx.request.body ?? {};

      if (
        typeof message !== 'string' ||
        !message.trim()
      ) {
        return ctx.badRequest('Message is required.');
      }

      if (
        typeof pushToken !== 'string' ||
        !pushToken.trim()
      ) {
        return ctx.badRequest(
          'Push token is required.'
        );
      }

      const cleanMessage = message
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1000);

      const username =
        generateAnonymousUsername(pushToken.trim());

      const post = await strapi
        .documents('api::community-post.community-post')
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