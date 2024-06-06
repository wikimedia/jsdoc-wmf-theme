'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const version = require( '../package.json' ).version;

const HISTORY_PATH = path.join( __dirname, '..', 'HISTORY.md' );

let history = fs.readFileSync( HISTORY_PATH, 'utf8' );

if ( /\+git$/.test( version ) ) {
	history = history.replace(
		/^(?=## jsdoc-wmf-theme)/m,
		'## jsdoc-wmf-theme x.x.x (not yet released)\n\n'
	);
} else {
	history = history.replace( /^## jsdoc-wmf-theme x\.x\.x.*$/m, () => {
		const today = new Date();
		const fmt = new Intl.DateTimeFormat( 'en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		} ).format( today );
		return '## jsdoc-wmf-theme ' + version + ' (' + fmt + ')';
	} );
}

fs.writeFileSync( HISTORY_PATH, history, 'utf8' );
