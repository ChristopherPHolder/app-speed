module.exports = {
  name: 'portal-clerk-config',
  setup(build) {
    build.initialOptions.define = {
      ...build.initialOptions.define,
      PORTAL_CLERK_PUBLISHABLE_KEY: JSON.stringify(process.env.CLERK_PUBLISHABLE_KEY ?? ''),
    };
  },
};
