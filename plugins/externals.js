'use strict';

// eslint-disable-next-line n/no-missing-require
const helper = require( 'jsdoc/util/templateHelper' );
// eslint-disable-next-line n/no-missing-require
const { conf } = require( 'jsdoc/env' );
// If no wmf config exists, we need to initialise it in-place
conf.templates = conf.templates || {};
conf.templates.wmf = conf.templates.wmf || {};
const wmfConf = conf.templates.wmf;

// Copy from wmfConf to defaultMaps (to override defaults) then back
// to wmfConf to modify the original config object (which is also
// loaded later in publish.js)
const defaultMaps = require( '../defaultMaps' );
wmfConf.linkMap = { ...defaultMaps.linkMap, ...wmfConf.linkMap };
wmfConf.prefixMap = { ...defaultMaps.prefixMap, ...wmfConf.prefixMap };

const { prefixMap, linkMap } = wmfConf;

// Sort prefixes, longest first
const prefixMapsKeys = Object.keys( prefixMap ).sort( ( a, b ) => b.length - a.length );

// eslint-disable-next-line n/no-missing-require
const parseType = require( 'jsdoc/tag/type' ).parse;

function extractNames( parsedType, names = [] ) {
	if ( parsedType.type === 'NameExpression' ) {
		names.push( parsedType.name );
	} else if ( parsedType.type === 'TypeApplication' ) {
		parsedType.applications.forEach( ( p ) => extractNames( p, names ) );
	}
	return names;
}

/**
 * Automatically register links to known external types when they are encountered
 */
exports.handlers = {
	newDoclet: function ( e ) {
		let types = [];

		if ( e.doclet.kind === 'class' ) {
			if ( e.doclet.augments ) {
				types.push.apply( types, e.doclet.augments );
			}

			if ( e.doclet.implements ) {
				types.push.apply( types, e.doclet.implements );
			}

			if ( e.doclet.mixes ) {
				types.push.apply( types, e.doclet.mixes );
			}

			if ( e.doclet.params ) {
				e.doclet.params.forEach( ( param ) => {
					if ( param.type && param.type.names ) {
						types.push.apply( types, param.type.names );
					}
				} );
			}

			// Check if the class returns the target class type
			if ( e.doclet.returns ) {
				e.doclet.returns.forEach( ( returnType ) => {
					if ( returnType.type && returnType.type.names ) {
						types.push.apply( types, returnType.type.names );
					}
				} );
			}
		} else if ( e.doclet.kind === 'function' ) { // Check if this is a function/method
			// Check if the function/method has parameters with the target class type
			if ( e.doclet.params ) {
				e.doclet.params.forEach( ( param ) => {
					if ( param.type && param.type.names ) {
						types.push.apply( types, param.type.names );
					}
				} );
			}

			// Check if the function/method returns the target class type
			if ( e.doclet.returns ) {
				e.doclet.returns.forEach( ( returnType ) => {
					if ( returnType.type && returnType.type.names ) {
						types.push.apply( types, returnType.type.names );
					}
				} );
			}
		}

		types = types.reduce( ( acc, val ) => {
			if ( /^[a-z0-9.]+$/i.test( val ) ) {
				// Optimisation: If the type is (namespaced) alphanumeric, then
				// the value itself is the type, e.g. 'foo.bar.Baz1'
				acc.push( val );
			} else {
				// A more complex type, parse and extract types recursively,
				// e.g. 'Object.<string,Foo[]>'
				const parsedType = parseType( '{' + val + '}', false, true ).parsedType;
				acc.push.apply( acc, extractNames( parsedType ) );
			}
			return acc;
		}, [] );

		types.forEach( ( type ) => {
			prefixMapsKeys.some( ( prefix ) => {
				if (
					// Ignore anything explicitly defined in the linkMap
					!linkMap[ type ] &&
					type.startsWith( prefix ) &&
					prefixMap[ prefix ] !== false
				) {
					if ( prefixMap[ prefix ] === true ) {
						return true;
					}
					helper.registerLink( type, prefixMap[ prefix ].replace( /\{type\}/g, type ) );
					// Break, so we don't match a shorter prefix
					return true;
				}
				return false;
			} );
		} );
	}
};
