/** @type {import('@remix-run/dev').AppConfig} */
module.exports =
  process.env.NODE_ENV === 'production'
    ? {
        serverBuildTarget: 'cloudflare-pages',
        server: './server.js',
      }
    : {}
