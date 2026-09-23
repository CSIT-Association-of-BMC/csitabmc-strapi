export default {
  routes: [
    {
      method: 'POST',
      path: '/push-devices/register',
      handler: 'register.register',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/push-devices/unregister',
      handler: 'register.unregister',
      config: {
        auth: false,
      },
    },
  ],
};