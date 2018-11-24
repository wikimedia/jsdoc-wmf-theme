module.exports = function gruntConfig( grunt ) {
	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),

		eslint: {
			options: {
				configFile: '.eslintrc'
			},
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
			options: {
				configFile: '.stylelintrc'
			},
			src: [ 'static/styles/**.css' ]
		}
	} );

	grunt.loadNpmTasks( 'grunt-eslint' );
	grunt.loadNpmTasks( 'grunt-stylelint' );

	grunt.registerTask( 'default', [ 'lint' ] );
	grunt.registerTask( 'lint', [ 'eslint', 'stylelint' ] );
};
