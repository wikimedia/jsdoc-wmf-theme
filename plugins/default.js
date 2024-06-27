'use strict';

// eslint-disable-next-line n/no-missing-require
const app = require( 'jsdoc/app' ),
	// eslint-disable-next-line n/no-missing-require
	plugins = require( 'jsdoc/plugins' ),
	// eslint-disable-next-line n/no-missing-require
	path = require( 'jsdoc/path' ),
	defaultPlugins = require( '../src/defaultPlugins' );

plugins.installPlugins(
	defaultPlugins.map(
		( plugin ) => path.getResourcePath(
			path.dirname( plugin ),
			path.basename( plugin )
		)
	),
	app.jsdoc.parser
);
