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
  ],
};