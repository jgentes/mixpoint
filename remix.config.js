/** @type {import('@remix-run/dev').AppConfig} */
module.exports =
  process.env.NODE_ENV === 'production'
    ? {
        ignoredRouteFiles: ['**/.*'],
        future: {
          unstable_dev: false,
          v2_routeConvention: true,
        },
      }
    : {
        future: {
          unstable_dev: false,
          v2_routeConvention: true,
        },
      }
