'use strict';

const utils = require( '../src/utils' );
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

// eslint-disable-next-line security/detect-unsafe-regex
const typeAndMethodPattern = /^[a-z0-9.]+(#[^ }]+)?$/i;

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

		if ( e.doclet.see ) {
			e.doclet.see.forEach( ( name ) => {
				// @see can bee a full text description, but we also commonly
				// use `@see Type` or `@see Type#method`, so support this as well.
				if ( name && typeAndMethodPattern.test( name ) ) {
					rawTypes.add( name );
				}
			} );
		}

		utils.processText( e.doclet, ( text ) => {
			// eslint-disable-next-line security/detect-unsafe-regex
			const linkPattern = /\{\s*@link\s+([a-z0-9.]+(#[^ }]+)?)[ }]/ig;
			let match;
			while ( ( match = linkPattern.exec( text ) ) !== null ) {
				rawTypes.add( match[ 1 ] );
			}
			return text;
		} );

		const types = Array.from( rawTypes ).reduce( ( acc, val ) => {
			if ( typeAndMethodPattern.test( val ) ) {
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

		types.forEach( ( fullType ) => {
			const [ type, method ] = fullType.split( '#' );
			prefixMapsKeys.some( ( prefix ) => {
				const prefixMapTarget = prefixMap[ prefix ];
				if (
					// Ignore anything explicitly defined in the linkMap
					!linkMap[ type ] &&
					type.startsWith( prefix ) &&
					prefixMapTarget !== false
				) {
					if ( prefixMapTarget === true ) {
						return true;
					}
					let hash = '';
					if ( method && !prefixMapTarget.includes( '#' ) ) {
						// If the type contains a #method, the pefix map target doesn't
						// contain a hashlink, assume that we can get to the method using
						// #<method> (in the default JSDoc style).
						// TODO: Come up with a notation for the linkMap that allows for
						// more complex mappings.
						hash = '#' + method;
					}
					helper.registerLink( fullType, prefixMapTarget.replace( /\{type\}/g, type ) + hash );
					// Break, so we don't match a shorter prefix
					return true;
				}
				return false;
			} );
		} );
	}
};
