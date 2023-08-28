/* eslint-env node, es6 */
module.exports = function gruntConfig( grunt ) {
	grunt.loadNpmTasks( 'grunt-eslint' );
	grunt.loadNpmTasks( 'grunt-stylelint' );

	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),

		eslint: {
			src: [ '.' ]
		},

		stylelint: {
			src: [ 'static/styles/**.css' ]
		}
	} );

	grunt.registerTask( 'lint', [ 'eslint', 'stylelint' ] );
};
