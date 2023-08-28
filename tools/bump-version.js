'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const PACKAGEPATH = path.join( __dirname, '..', 'package.json' );
const PACKAGELOCKPATH = path.join( __dirname, '..', 'package-lock.json' );

for ( const pkgpath of [ PACKAGEPATH, PACKAGELOCKPATH ] ) {
	// eslint-disable-next-line security/detect-non-literal-require
	const pkg = require( pkgpath );
	if ( !/\+git$/.test( pkg.version ) ) {
		pkg.version += '+git';
		// eslint-disable-next-line security/detect-non-literal-fs-filename
		fs.writeFileSync( pkgpath, JSON.stringify( pkg, null, 2 ) + '\n', 'utf8' );
	}
}
