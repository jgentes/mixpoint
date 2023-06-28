/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
	ignoredRouteFiles: ['**/.*'],
	serverModuleFormat: 'cjs',
	serverDependenciesToBundle: [
		'wavesurfer.js',
		'wavesurfer.js/dist/plugins/minimap.js',
		'wavesurfer.js/dist/plugins/regions.js'
	],
	future: {
		v2_dev: true,
		v2_routeConvention: true,
		v2_errorBoundary: true,
		v2_meta: true,
		v2_normalizeFormMethod: true,
		v2_headers: true
	}
}
