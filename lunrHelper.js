'use strict';
/* global env */
const lunr = require( 'lunr' ),
	// eslint-disable-next-line node/no-missing-require
	fs = require( 'jsdoc/fs' ),
	// eslint-disable-next-line node/no-missing-require
	path = require( 'jsdoc/path' ),
	// eslint-disable-next-line node/no-missing-require
	helper = require( 'jsdoc/util/templateHelper' );

exports.makeIndex = function ( data ) {
	const outdir = path.normalize( env.opts.destination ),
		documents = [];

	// Collect only the data we need to search
	data.each( function ( doclet ) {
		documents.push( {
			id: helper.longnameToUrl[ doclet.longname ],
			kind: doclet.kind,
			title: doclet.pageTitle,
			longname: doclet.longname,
			name: doclet.name,
			summary: doclet.summary,
			description: doclet.classdesc || doclet.description
		} );
	} );

	// Build index and add data
	const index = lunr( function () {
			this.field( 'name', { boost: 1000 } );
			this.field( 'longname', { boost: 500 } );
			this.field( 'kind', { boost: 110 } );
			this.field( 'title', { boost: 100 } );
			this.field( 'summary', { boost: 70 } );
			this.field( 'description', { boost: 50 } );
			this.ref( 'id' );

			documents.forEach( function ( doc ) {
				this.add( doc );
			}, this );
		} ),

		// Write JSON and JS files
		lunrData = { index: index, documents: documents },
		jsFile = path.join( outdir, 'lunr-data.js' ),
		lunrDataJson = JSON.stringify( lunrData );

	fs.writeFileSync( jsFile, 'window.lunrData = ' + lunrDataJson + ';', 'utf8' );
};
