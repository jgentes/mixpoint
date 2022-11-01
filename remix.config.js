/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  appDirectory: 'app',
  assetsBuildDirectory: 'public/build',
  serverBuildTarget: 'cloudflare-pages',
  publicPath: '/build/',
  serverBuildDirectory: 'build',
  browserBuildDirectory: 'public/build',
  server: './server.js',
}
