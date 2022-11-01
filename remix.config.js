/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  appDirectory: 'app', // default
  assetsBuildDirectory: 'public/build', // default
  //ignoredRouteFiles: ['**/.*'], // default
  serverBuildTarget: 'cloudflare-pages',
  publicPath: '/build/',
  serverBuildDirectory: 'build',
}
