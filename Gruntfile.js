/* eslint-env node, es6 */
module.exports = function gruntConfig( grunt ) {
	grunt.loadNpmTasks( 'grunt-eslint' );
	grunt.loadNpmTasks( 'grunt-stylelint' );

	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),

		eslint: {
			src: [
				'Gruntfile.js',
				'betterlinks.js',
				'lunrHelper.js',
				'publish.js',
				'static/scripts/fonts-loader.js',
				'static/scripts/linenumber.js',
				'static/scripts/lunrSearch.js',
				'static/scripts/method-filters.js',
				'static/scripts/open-members.js'
			]
		},

		stylelint: {
			src: [ 'static/styles/**.css' ]
		}
	} );

	grunt.registerTask( 'lint', [ 'eslint', 'stylelint' ] );
};
