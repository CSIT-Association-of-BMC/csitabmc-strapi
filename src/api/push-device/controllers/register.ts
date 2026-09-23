export default {
  async register(ctx) {
    try {
      const { token, platform } = ctx.request.body ?? {};

      if (!token || typeof token !== 'string') {
        return ctx.badRequest('Push token is required');
      }

      if (!['android', 'ios'].includes(platform)) {
        return ctx.badRequest('Platform must be android or ios');
      }

      // Basic Expo push token validation
      const isExpoToken =
        token.startsWith('ExponentPushToken[') ||
        token.startsWith('ExpoPushToken[');

      if (!isExpoToken) {
        return ctx.badRequest('Invalid Expo push token');
      }

      // Check whether this phone/token has already been registered
      const existingDevices = await strapi
        .documents('api::push-device.push-device')
        .findMany({
          filters: {
            token: {
              $eq: token,
            },
          },
          limit: 1,
        });

      if (existingDevices.length > 0) {
        const existing = existingDevices[0];

        // Re-enable the token if it was previously disabled
        if (!existing.enabled) {
          await strapi
            .documents('api::push-device.push-device')
            .update({
              documentId: existing.documentId,
              data: {
                enabled: true,
                platform,
              },
            });
        }

        ctx.body = {
          success: true,
          registered: false,
          message: 'Device already registered',
        };

        return;
      }

      // Register new device
      await strapi
        .documents('api::push-device.push-device')
        .create({
          data: {
            token,
            platform,
            enabled: true,
          },
        });

      ctx.body = {
        success: true,
        registered: true,
        message: 'Device registered successfully',
      };
    } catch (error) {
      strapi.log.error('Push device registration failed:', error);

      ctx.internalServerError('Unable to register device');
    }
  },

  /**
   * Stops pushes to a device (user turned notifications off in the app).
   * The token is kept but disabled; registering again re-enables it.
   * Idempotent: an unknown token is treated as already unregistered.
   */
  async unregister(ctx) {
    try {
      const { token } = ctx.request.body ?? {};

      if (!token || typeof token !== 'string') {
        return ctx.badRequest('Push token is required');
      }

      const existingDevices = await strapi
        .documents('api::push-device.push-device')
        .findMany({
          filters: {
            token: {
              $eq: token,
            },
          },
          limit: 1,
        });

      if (existingDevices.length > 0 && existingDevices[0].enabled) {
        await strapi
          .documents('api::push-device.push-device')
          .update({
            documentId: existingDevices[0].documentId,
            data: {
              enabled: false,
            },
          });
      }

      ctx.body = {
        success: true,
        message: 'Device unregistered',
      };
    } catch (error) {
      strapi.log.error('Push device unregistration failed:', error);

      ctx.internalServerError('Unable to unregister device');
    }
  },
};