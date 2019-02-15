/* global env, exports, require */
var lunr = require( 'lunr' ),
	fs = require( 'jsdoc/fs' ),
	path = require( 'jsdoc/path' ),
	helper = require( 'jsdoc/util/templateHelper' );

exports.makeIndex = function ( data ) {
	// eslint-disable-next-line no-restricted-properties
	var outdir = path.normalize( env.opts.destination ),
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
	// eslint-disable-next-line one-var, vars-on-top
	var index = lunr( function () {
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
		// eslint-disable-next-line no-redeclare
		data = { index: index, documents: documents },
		jsFile = path.join( outdir, 'lunr-data.js' ),
		dataJson = JSON.stringify( data );
	fs.writeFileSync( jsFile, 'window.lunrData = ' + dataJson + ';', 'utf8' );
};
