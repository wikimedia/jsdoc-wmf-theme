'use strict';

module.exports = function gruntConfig( grunt ) {
	grunt.loadNpmTasks( 'grunt-eslint' );
	grunt.loadNpmTasks( 'grunt-stylelint' );

	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),

		eslint: {
			options: {
				fix: grunt.option( 'fix' )
			},
			all: [ '.' ]
		},

		stylelint: {
			src: [ 'static/styles/**.css' ]
		}
	} );

	grunt.registerTask( 'lint', [ 'eslint', 'stylelint' ] );
};
