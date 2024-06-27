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
const defaultMaps = require( '../src/defaultMaps' );
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

function pushTypesFromList( types, list ) {
	list.forEach( ( node ) => {
		if ( node.type && node.type.names ) {
			node.type.names.forEach( ( name ) => types.add( name ) );
		}
	} );
}

/**
 * Automatically register links to known external types when they are encountered
 */
exports.handlers = {
	newDoclet: function ( e ) {
		const rawTypes = new Set();

		if ( e.doclet.kind === 'class' ) {
			if ( e.doclet.augments ) {
				e.doclet.augments.forEach( ( name ) => rawTypes.add( name ) );
			}

			if ( e.doclet.implements ) {
				e.doclet.implements.forEach( ( name ) => rawTypes.add( name ) );
			}

			if ( e.doclet.mixes ) {
				e.doclet.mixes.forEach( ( name ) => rawTypes.add( name ) );
			}
		}

		if ( e.doclet.kind === 'class' || e.doclet.kind === 'function' ) {
			if ( e.doclet.params ) {
				pushTypesFromList( rawTypes, e.doclet.params );
			}

			if ( e.doclet.returns ) {
				pushTypesFromList( rawTypes, e.doclet.returns );
			}
		}

		const types = Array.from( rawTypes ).reduce( ( acc, val ) => {
			if ( /^[a-z0-9.]+$/i.test( val ) ) {
				// Optimisation: If the type is (namespaced) alphanumeric, then
				// the value itself is the type, e.g. 'foo.bar.Baz1'
				acc.push( val );
			} else {
				// A more complex type, parse and extract types recursively,
				// e.g. 'Object.<string,Foo[]>'
				const parsedType = parseType( '{' + val + '}', false, true ).parsedType;
				acc.push( ...extractNames( parsedType ) );
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
