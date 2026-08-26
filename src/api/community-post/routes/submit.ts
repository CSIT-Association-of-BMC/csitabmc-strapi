export default {
  routes: [
    {
      method: 'POST',
      path: '/community-posts/submit',
      handler: 'submit.submit',
      config: {
        auth: false,
      },
    },
  ],
};