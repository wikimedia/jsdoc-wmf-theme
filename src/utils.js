'use strict';

/**
 * Add support for {@link .shortName} and {@link #shortName}, as well
 * as link-ifying URLs.
 */
const tags = [
	'author',
	'classdesc',
	'description',
	'exceptions',
	'params',
	'properties',
	'returns',
	'see',
	'summary'
];

function expandModule( name, longname ) {
	return name.replace( /^[:~]/, () => longname.replace( /~.*/, '' ) + '~' );
}

function processText( rootDoclet, callback ) {
	const rootLongname = rootDoclet.longname;

	function process( doclet ) {
		if ( Array.isArray( doclet.augments ) ) {
			doclet.augments = doclet.augments.map( ( name ) => expandModule( name, rootLongname ) );
		}
		tags.forEach( ( tag ) => {
			if ( !Object.prototype.hasOwnProperty.call( doclet, tag ) ) {
				return;
			}
			if ( typeof doclet[ tag ] === 'string' ) {
				doclet[ tag ] = callback( doclet[ tag ], tag, rootLongname );
			} else if ( Array.isArray( doclet[ tag ] ) ) {
				doclet[ tag ].forEach( ( value, index, original ) => {
					const inner = {};

					inner[ tag ] = value;
					process( inner, rootLongname );
					original[ index ] = inner[ tag ];
				} );
			} else if ( doclet[ tag ] ) {
				process( doclet[ tag ], rootLongname );
			}
		} );
	}

	process( rootDoclet );
}

module.exports = {
	processText
};
