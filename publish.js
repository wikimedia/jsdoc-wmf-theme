/* global TAFFY, Tutorial */
'use strict';

let data, view,
	resolveLinkFilename = '<unknown>';

const domino = require( 'domino' ),
	/* eslint-disable n/no-missing-require */
	doop = require( 'jsdoc/util/doop' ),
	{ marked } = require( 'marked' ),
	env = require( 'jsdoc/env' ),
	fs = require( 'jsdoc/fs' ),
	helper = require( 'jsdoc/util/templateHelper' ),
	logger = require( 'jsdoc/util/logger' ),
	path = require( 'jsdoc/path' ),
	template = require( 'jsdoc/template' ),
	/* eslint-enable n/no-missing-require */
	taffy = require( '@jsdoc/salty' ).taffy,
	util = require( 'util' ),
	lunrHelper = require( './lunrHelper' ),

	rLiteral = /^(null|undefined|true|false|NaN|Infinity|'[^']*')$/,
	// These are built-in types and classes in ECMAScript.
	// Our Wikimedia-specific rule of requiring a linkMap entry will allow these,
	// to be absence, resulting in the default JSDoc behaviour of a type without
	// hyperlink (without printing warning).
	rGeneric = /^(boolean|number|string|function|symbol|Object|Function|Date|RegExp|Error)$/,
	rGenericWithArgs = /^(Array|Promise|Map|Set|WeakMap|WeakSet|Object)\.<(.*)>$/,

	htmlsafe = helper.htmlsafe,
	linkto = function ( longname, linkText, cssClass, fragmentId ) {
		if ( longname === 'any' ) {
			return longname;
		}
		if ( rLiteral.test( longname ) ) {
			return '<code>' + linkText + '</code>';
		}
		const isGeneric = rGeneric.test( longname ),
			isGenericWithArgs = longname.match( rGenericWithArgs ),
			r = helper.linkto( longname, linkText, cssClass, fragmentId );

		if ( isGeneric ) {
			// Allow linking of generic types, e.g. to MDN.
			longname = longname[ 0 ].toUpperCase() + longname.slice( 1 );
		}
		if ( isGenericWithArgs ) {
			const argName = isGenericWithArgs[ 2 ];
			// Check that the argument is valid
			const argLink = argName.split( ',' ).map( ( name ) => linkto( name.trim(), linkText, cssClass, fragmentId ) ).join( ' ' ).trim();
			if ( argLink !== '' ) {
				return r;
			}
		}
		if ( !isGeneric && !/^(<a href=|<p|{@)/.test( r ) ) {
			logger.warn( 'Unknown link %s in %s', longname, resolveLinkFilename );
			return '';
		}
		return r;
	},
	resolveAuthorLinks = helper.resolveAuthorLinks,
	hasOwnProp = Object.prototype.hasOwnProperty,

	aliases = {};

let outdir = path.normalize( env.opts.destination );

function getAttribs( doclet ) {
	const attribs = helper.getAttribs( doclet );

	if ( doclet.tags ) {
		doclet.tags.forEach( ( tag ) => {
			if ( tag.originalTitle === 'chainable' ) {
				attribs.push( 'chainable' );
			}
		} );
	}

	return attribs;
}

function addAlias( name, url ) {
	if ( helper.longnameToUrl[ name ] ) {
		return;
	}
	helper.registerLink( name, url );
	aliases[ name ] = true;
}

function find( spec ) {
	return helper.find( data, spec );
}

function tutoriallink( tutorial ) {
	return helper.toTutorial( tutorial, null, {
		tag: 'em',
		classname: 'disabled',
		prefix: 'Tutorial: '
	} );
}

function getAncestorLinks( doclet ) {
	return helper.getAncestorLinks( data, doclet );
}

function hashToLink( doclet, hash ) {
	let url;

	if ( !/^(#.+)/.test( hash ) ) {
		return hash;
	}

	url = helper.createLink( doclet );
	url = url.replace( /(#.+|$)/, hash );

	return '<a href="' + url + '">' + hash + '</a>';
}

/* eslint-disable brace-style */
function needsSignature( doclet ) {
	let needsSig = false,
		i,
		l;

	// function and class definitions always get a signature
	if (
		doclet.kind === 'function' ||
		doclet.kind === 'class' ||
		doclet.kind === 'event'
	) {
		needsSig = true;
	}
	// typedefs that contain functions get a signature, too
	else if ( doclet.kind === 'typedef' && doclet.type && doclet.type.names &&
		doclet.type.names.length ) {
		for ( i = 0, l = doclet.type.names.length; i < l; i++ ) {
			if ( doclet.type.names[ i ].toLowerCase() === 'function' ) {
				needsSig = true;
				break;
			}
		}
	}
	// and namespaces that are functions get a signature (but finding them is a
	// bit messy)
	else if ( doclet.kind === 'namespace' && doclet.meta && doclet.meta.code &&
		doclet.meta.code.type && doclet.meta.code.type.match( /[Ff]unction/ ) ) {
		needsSig = true;
	}

	return needsSig;
}
/* eslint-enable brace-style */

function getSignatureAttributes( item ) {
	const attributes = [];

	if ( item.nullable === true ) {
		attributes.push( 'nullable' );
	} else if ( item.nullable === false ) {
		attributes.push( 'non-null' );
	}

	return attributes;
}

function updateItemName( item ) {
	const attributes = getSignatureAttributes( item );

	let itemName = item.name || '';

	if ( item.variable ) {
		itemName = '&hellip;' + itemName;
	}

	if ( item.optional ) {
		itemName = '[' + itemName + ']';
	}

	if ( attributes && attributes.length ) {
		itemName = util.format( '%s<span class="signature-attributes">%s</span>', itemName,
			attributes.join( ', ' ) );
	}

	return itemName;
}

function addParamAttributes( params ) {
	return params.filter( ( param ) => param.name && !param.name.includes( '.' ) ).map( updateItemName );
}

function buildItemTypeStrings( item ) {
	const types = [];

	if ( item && item.type && item.type.names ) {
		item.type.names.forEach( ( name ) => {
			types.push( linkto( name, htmlsafe( name ) ) );
		} );
	}

	return types;
}

function buildAttribsString( attribs ) {
	let attribsString = '';

	if ( attribs && attribs.length ) {
		attribsString = htmlsafe( util.format( '(%s) ', attribs.join( ', ' ) ) );
	}

	return attribsString;
}

function addNonParamAttributes( items ) {
	let types = [];

	items.forEach( ( item ) => {
		types = types.concat( buildItemTypeStrings( item ) );
	} );

	return types;
}

function addSignatureParams( f ) {
	const params = f.params ? addParamAttributes( f.params ) : [];

	f.signature = util.format( '%s(%s)', ( f.signature || '' ), params.join( ', ' ) );
}

function addSignatureReturns( f ) {
	const attribs = [],
		source = f.yields || f.returns;

	let attribsString = '',
		returnTypes = [],
		returnTypesString = '';

	// jam all the return-type attributes into an array. this could create odd results (for example,
	// if there are both nullable and non-nullable return types), but let's assume that most people
	// who use multiple @return tags aren't using Closure Compiler type annotations, and vice-versa.
	if ( source ) {
		source.forEach( ( item ) => {
			getAttribs( item ).forEach( ( attrib ) => {
				if ( !attribs.includes( attrib ) ) {
					attribs.push( attrib );
				}
			} );
		} );

		attribsString = buildAttribsString( attribs );
	}

	if ( source ) {
		returnTypes = addNonParamAttributes( source );
	}
	if ( returnTypes.length ) {
		returnTypesString = util.format( ' &rarr; %s{%s}', attribsString, returnTypes.join( '|' ) );
	}

	f.signature = '<span class="signature">' + ( f.signature || '' ) + '</span>' +
		'<span class="type-signature">' + returnTypesString + '</span>';
}

function addSignatureTypes( f ) {
	const types = f.type ? buildItemTypeStrings( f ) : [];

	f.signature = ( f.signature || '' ) + '<span class="type-signature">' +
		( types.length ? ' :' + types.join( '|' ) : '' ) + '</span>';
}

function addClassNames( f ) {
	const attribs = getAttribs( f );
	let classNames = attribs.map( ( a ) => 'method--' + a ).join( ' ' );
	classNames += f.inherited ? ' method--inherited' : '';
	classNames += f.deprecated ? ' method--deprecated' : '';
	f.attribsClassName = classNames;
}

function addAttribs( f ) {
	const attribs = getAttribs( f );
	let attribsMarkup = '';

	attribs.forEach( ( attrib ) => {
		attribsMarkup += `<span class="type-signature__attrib type-signature__attrib--${ attrib }">${ attrib }</span>`;
	} );

	f.attribs = util.format( '<span class="type-signature">%s</span>', attribsMarkup );
	addClassNames( f );
}

function shortenPaths( files, commonPrefix ) {
	Object.keys( files ).forEach( ( file ) => {
		files[ file ].shortened = files[ file ].resolved.replace( commonPrefix, '' )
			// always use forward slashes
			.replace( /\\/g, '/' );
	} );

	return files;
}

function getPathFromDoclet( doclet ) {
	if ( !doclet.meta ) {
		return null;
	}

	return doclet.meta.path && doclet.meta.path !== 'null' ?
		path.join( doclet.meta.path, doclet.meta.filename ) :
		doclet.meta.filename;
}

function generate( title, docs, filename, resolveLinks ) {
	resolveLinks = resolveLinks !== false;

	const docData = {
		env: env,
		title: title,
		filename: filename,
		docs: docs
	};

	const outpath = path.join( outdir, filename );
	// shortpath / name / longname in docData.docs[x]
	resolveLinkFilename = docData.title || filename;
	let html = view.render( 'container.tmpl', docData );

	if ( resolveLinks ) {
		html = helper.resolveLinks( html ); // turn {@link foo} into <a href="foodoc.html">foo</a>
	}
	resolveLinkFilename = '<unknown>';

	fs.writeFileSync( outpath, html, 'utf8' );
}

function generateSourceFiles( sourceFiles, encoding ) {
	encoding = encoding || 'utf8';
	Object.keys( sourceFiles ).forEach( ( file ) => {
		let source;
		// links are keyed to the shortened path in each doclet's `meta.shortpath` property
		const sourceOutfile = helper.getUniqueFilename( sourceFiles[ file ].shortened );

		helper.registerLink( sourceFiles[ file ].shortened, sourceOutfile );

		try {
			source = {
				kind: 'source',
				code: helper.htmlsafe( fs.readFileSync( sourceFiles[ file ].resolved, encoding ) )
			};
		} catch ( e ) {
			logger.error( 'Error while generating source file %s: %s', file, e.message );
		}

		generate( 'Source: ' + sourceFiles[ file ].shortened, [ source ], sourceOutfile,
			false );
	} );
}

/**
 * Look for classes or functions with the same name as modules (which indicates that the module
 * exports only that class or function), then attach the classes or functions to the `module`
 * property of the appropriate module doclets. The name of each class or function is also updated
 * for display purposes. This function mutates the original arrays.
 *
 * @private
 * @param {Array.<module:jsdoc/doclet.Doclet>} doclets - The array of classes and functions to
 * check.
 * @param {Array.<module:jsdoc/doclet.Doclet>} modules - The array of module doclets to search.
 */
function attachModuleSymbols( doclets, modules ) {
	const symbols = {};

	// build a lookup table
	doclets.forEach( ( symbol ) => {
		symbols[ symbol.longname ] = symbols[ symbol.longname ] || [];
		symbols[ symbol.longname ].push( symbol );
	} );

	modules.forEach( ( module ) => {
		if ( symbols[ module.longname ] ) {
			module.modules = symbols[ module.longname ]
				// Only show symbols that have a description. Make an exception for classes, because
				// we want to show the constructor-signature heading no matter what.
				.filter( ( symbol ) => symbol.description || symbol.kind === 'class' )
				.map( ( symbol ) => {
					symbol = doop( symbol );

					if ( symbol.kind === 'class' || symbol.kind === 'function' ) {
						symbol.name = symbol.name.replace( 'module:', '(require("' ) + '"))';
					}

					return symbol;
				} );
		}
	} );
}

function makeNavItem( doc, navItemData ) {
	const li = doc.createElement( 'li' );
	li.classList.add( navItemData.sub ? 'nav__sub-item' : 'nav__item' );
	if ( navItemData.tag === 'a' ) {
		const a = doc.createElement( 'a' );
		li.appendChild( a );
		if ( navItemData.href ) {
			a.setAttribute( 'href', navItemData.href );
		}
		a.textContent = navItemData.title;
		li.appendChild( a );
	} else if ( typeof ( navItemData.html ) === 'string' ) {
		li.innerHTML = navItemData.html;
	}
	return li;
}

function addNavItem( parent, navItemData ) {
	parent.appendChild( makeNavItem( parent.ownerDocument, navItemData ) );
	return parent;
}

/**
 * @param {*} parent
 * @param {*} items
 * @param {*} itemHeading
 * @param {*} itemsSeen
 * @param {*} linktoFn
 * @param {number} [depth] how deep down the stack to go. 1 == only globals e.g. "mw".
 *  2 === include member functions e.g. "mw.Api"
 * @param {string} [href] to item
 */
function buildMemberNav( parent, items, itemHeading, itemsSeen, linktoFn, depth, href = '' ) {
	if ( items.length ) {
		const li = makeNavItem( parent.ownerDocument, { tag: 'a', title: itemHeading, href } );
		const ul = parent.ownerDocument.createElement( 'ul' );
		ul.classList.add( 'nav__sub-items' );
		li.appendChild( ul );

		items.forEach( ( item ) => {
			let displayName;
			// Limit the navigation to items that match the requested depth.
			if ( depth !== undefined ) {
				const itemDepth = item.longname.split( '.' ).length;
				// if 0 this is a global.
				if ( itemDepth > depth ) {
					return;
				}
			}

			if ( !hasOwnProp.call( item, 'longname' ) ) {
				addNavItem( ul, { sub: true, html: linktoFn( '', item.name ) } );
			} else if ( !hasOwnProp.call( itemsSeen, item.longname ) ) {
				if ( env.conf.templates.default.useLongnameInNav ) {
					displayName = item.displayName;
				} else {
					displayName = item.name;
				}
				addNavItem( ul, { sub: true, html: linktoFn( item.longname, displayName ) } );

				itemsSeen[ item.longname ] = true;
			}
		} );

		if ( ul.firstChild ) {
			parent.appendChild( li );
		}
	}
}

function linktoTutorial( longName, name ) {
	return tutoriallink( name );
}

function linktoExternal( longName, name ) {
	return linkto( longName, name.replace( /(^"|"$)/g, '' ) );
}

/*
 * Builds the member navigation if the configuration allows.
 *
 * Takes the same arguments as `buildMemberNav`.
 */
function buildMemberNavIfConf( nav, member, name, seen, linktoFn, depth, href ) {
	if (
		env.conf.templates.wmf.hideSections === undefined ||
	!env.conf.templates.wmf.hideSections.includes( name )
	) {
		buildMemberNav( nav, member, name, seen, linktoFn, depth, href );
	}
}

/**
 * Create the navigation sidebar.
 *
 * @param {Object} members The members that will be used to create the sidebar.
 * @param {Array<Object>} members.classes
 * @param {Array<Object>} members.externals
 * @param {Array<Object>} members.globals
 * @param {Array<Object>} members.mixins
 * @param {Array<Object>} members.modules
 * @param {Array<Object>} members.namespaces
 * @param {Array<Object>} members.tutorials
 * @param {Array<Object>} members.events
 * @param {Array<Object>} members.interfaces
 * @param {Object} customPages array of additional pages that exist.
 * @return {string} The HTML for the navigation sidebar.
 */
function buildNav( members, customPages = {} ) {
	const doc = domino.createDocument(),
		nav = doc.createElement( 'ol' ),
		seen = {};
	doc.body.appendChild( nav );
	addNavItem( nav, { tag: 'a', href: 'index.html', title: 'Home' } );

	const linkIfExists = ( filename ) => {
		if ( customPages[ filename ] ) {
			return `${ filename }.html`;
		} else {
			return undefined;
		}
	};
	[ 'modules', 'externals', 'namespaces', 'classes', 'interfaces', 'events', 'mixins', 'tutorials' ].forEach( ( type ) => {
		const opts = customPages[ type ] || {};
		let linker;
		switch ( type ) {
			case 'tutorials':
				linker = linktoTutorial;
				break;
			case 'externals':
				linker = linktoExternal;
				break;
			default:
				linker = linkto;
				break;
		}
		const heading = opts.longname || ( type.charAt( 0 ).toUpperCase() + type.slice( 1 ) );
		buildMemberNavIfConf(
			nav, members[ type ], heading, seen, linker, opts.depth, linkIfExists( type )
		);
	} );
	if ( env.conf.templates.wmf.siteMap ) {
		addNavItem( nav, { tag: 'a', href: 'sitemap.html', title: 'Sitemap' } );
	}

	return function ( filename ) {
		const nav2 = nav.cloneNode( true );
		let el = nav2.querySelector( 'a[href="' + filename + '"]' );
		while ( el ) {
			if ( el.tagName === 'LI' ) {
				el.classList.add( 'is-on' );
			}
			el = el.parentNode;
		}
		return nav2.outerHTML;
	};
}

function buildSiteMapSection( items, subsection ) {
	const heading = subsection ? `<h2 class="sitemap-heading">${ subsection }</h2>` : '';
	return `${ heading }
<ul class="sitemap">
	${ items.sort( ( a, b ) => a.name < b.name ? -1 : 1 ).map( ( a ) => `<li>${ a }</li>` ).join( '\n' ) }
</ul>`;
}

function buildSiteMap( items, options = {} ) {
	let index = [];
	let html = '<h1>Sitemap</h1>';
	const sortLongName = ( a, b ) => a.longname < b.longname ? -1 : 1;
	Object.keys( items ).forEach( ( key ) => {
		if ( options.include && !options.include.includes( key ) ) {
			return;
		}
		items[ key ].sort( sortLongName ).forEach( ( doclet ) => {
			index.push( linkto( doclet.longname, doclet.displayName ) );
		} );
		if ( options.sections && index.length ) {
			html += buildSiteMapSection( index, key );
			index = [];
		}
	} );

	if ( index.length ) {
		html += buildSiteMapSection( index.sort( sortLongName ) );
	}
	return html;
}

/**
 * @param {TAFFY} taffyData See <http://taffydb.com/>.
 * @param {Object} opts
 * @param {Tutorial} tutorials
 */
exports.publish = function ( taffyData, opts, tutorials ) {
	const sourceFilePaths = [];
	let sourceFiles = {};

	data = taffyData;

	const conf = env.conf.templates || {};
	conf.default = conf.default || {};
	conf.wmf = conf.wmf || {};

	const templatePath = path.normalize( opts.template );
	view = new template.Template( path.join( templatePath, 'tmpl' ) );

	// claim some special filenames in advance, so the All-Powerful Overseer of Filename Uniqueness
	// doesn't try to hand them out later
	const indexUrl = helper.getUniqueFilename( 'index' );
	// don't call registerLink() on this one! 'index' is also a valid longname

	const globalUrl = helper.getUniqueFilename( 'global' );
	helper.registerLink( 'global', globalUrl );

	// Manually-requested links (to external documentation)
	conf.wmf.linkMap = conf.wmf.linkMap || {};
	Object.keys( conf.wmf.linkMap ).forEach( ( longname ) => {
		addAlias( longname, conf.wmf.linkMap[ longname ] );
	} );

	// set up templating
	view.layout = conf.default.layoutFile ?
		path.getResourcePath( path.dirname( conf.default.layoutFile ),
			path.basename( conf.default.layoutFile ) ) :
		'layout.tmpl';

	// set up tutorials for helper
	helper.setTutorials( tutorials );

	data = helper.prune( data );
	data.sort( 'longname, version, since' );
	helper.addEventListeners( data );

	data().each( ( doclet ) => {
		let sourcePath;

		doclet.attribs = '';

		if ( doclet.examples ) {
			doclet.examples = doclet.examples.map( ( example ) => {
				let $caption,
					$code;

				if ( example.match( /^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i ) ) {
					$caption = RegExp.$1;
					$code = RegExp.$3;
				}

				return {
					caption: $caption || '',
					code: $code || example
				};
			} );
		}
		if ( doclet.see ) {
			doclet.see.forEach( ( seeItem, i ) => {
				doclet.see[ i ] = hashToLink( doclet, seeItem );
			} );
		}

		// build a list of source files
		if ( doclet.meta ) {
			sourcePath = getPathFromDoclet( doclet );
			sourceFiles[ sourcePath ] = {
				resolved: sourcePath,
				shortened: null
			};
			if ( !sourceFilePaths.includes( sourcePath ) ) {
				sourceFilePaths.push( sourcePath );
			}
		}
	} );

	// update outdir if necessary, then create outdir
	const packageInfo = ( find( { kind: 'package' } ) || [] )[ 0 ];
	if ( packageInfo && packageInfo.name ) {
		env.conf.templates.wmf.maintitle =
			env.conf.templates.wmf.maintitle || packageInfo.name;
		if ( packageInfo.repository && packageInfo.repository.url ) {
			env.conf.templates.wmf.repository =
				env.conf.templates.wmf.repository || packageInfo.repository.url;
		}
		if ( env.conf.templates.wmf.useVersionedDirectory ) {
			outdir = path.join( outdir, packageInfo.name, ( packageInfo.version || '' ) );
		}
	}
	if ( !env.conf.templates.wmf.repository ) {
		logger.warn( 'No contribution link found (in package.json>repository.url, or jsdoc.json>templates.wmf.repository)' );
	}
	fs.mkPath( outdir );

	const fromDir = path.join( templatePath, 'static' );
	const cssLibDir = path.join( fromDir, 'styles/lib' );
	fs.mkPath( cssLibDir );

	// Copy CSS dependencies to the static dir.
	fs.copyFileSync( require.resolve( '@wikimedia/codex-design-tokens/theme-wikimedia-ui.css' ), cssLibDir );
	fs.copyFileSync( require.resolve( 'normalize.css' ), cssLibDir );

	// copy the template's static files to outdir
	const staticFiles = fs.ls( fromDir, 4 );
	staticFiles.forEach( ( fileName ) => {
		const toDir = fs.toDir( fileName.replace( fromDir, outdir ) );

		fs.mkPath( toDir );
		fs.copyFileSync( fileName, toDir );
	} );

	// copy user-specified static files to outdir
	if ( conf.default.staticFiles ) {
		// The canonical property name is `include`. We accept `paths` for backwards compatibility
		// with a bug in JSDoc 3.2.x.
		const staticFilePaths = conf.default.staticFiles.include ||
			conf.default.staticFiles.paths ||
			[];
		// eslint-disable-next-line n/no-missing-require
		const staticFileFilter = new ( require( 'jsdoc/src/filter' ) ).Filter( conf.default.staticFiles );
		// eslint-disable-next-line n/no-missing-require
		const staticFileScanner = new ( require( 'jsdoc/src/scanner' ) ).Scanner();

		staticFilePaths.forEach( ( filePath ) => {
			filePath = path.resolve( env.pwd, filePath );
			const extraStaticFiles = staticFileScanner.scan( [ filePath ], 10, staticFileFilter );

			extraStaticFiles.forEach( ( fileName ) => {
				const sourcePath = fs.toDir( filePath ),
					toDir = fs.toDir( fileName.replace( sourcePath, outdir ) );

				fs.mkPath( toDir );
				fs.copyFileSync( fileName, toDir );
			} );
		} );
	}

	if ( sourceFilePaths.length ) {
		sourceFiles = shortenPaths( sourceFiles, path.commonPrefix( sourceFilePaths ) );
	}
	data().each( ( doclet ) => {
		const url = helper.createLink( doclet );

		helper.registerLink( doclet.longname, url );

		// add a shortened version of the full path
		if ( doclet.meta ) {
			const docletPath = getPathFromDoclet( doclet );
			const shortpath = sourceFiles[ docletPath ].shortened;
			if ( shortpath ) {
				doclet.meta.shortpath = shortpath;
			}
		}
	} );

	// Add synthetic names

	const count = {},
		shorten = function ( longname ) {
			const pieces = longname.split( '~', 2 );
			return pieces.length < 2 ? null : pieces[ 1 ];
		};
	// Find ambiguous shortnames
	Object.keys( helper.longnameToUrl ).forEach( ( longname ) => {
		const s = shorten( longname );
		if ( s ) {
			// Prefix '$' so we don't conflict w/ built-ins like 'prototype'
			count[ '$' + s ] = ( count[ '$' + s ] || 0 ) + 1;
		}
	} );
	// Ok, add non-ambiguous shortnames
	Object.keys( helper.longnameToUrl ).forEach( ( longname ) => {
		const s = shorten( longname );
		if ( s && count[ '$' + s ] === 1 ) {
			addAlias( s, helper.longnameToUrl[ longname ] );
		} else if ( s ) {
			logger.warn( 'Ambiguous shortname:', s );
		}
	} );

	// T363523
	const allowedGlobals = [].concat( opts.allowedGlobals || [] );
	allowedGlobals.push( 'window' );

	data().each( ( doclet ) => {
		const isUnexpectedGlobal = doclet && doclet.meta &&
			doclet.kind !== 'class' && doclet.kind !== 'namespace' &&
			doclet.scope === 'global' && !allowedGlobals.includes( doclet.name );
		if ( isUnexpectedGlobal ) {
			throw new Error( `***
Unexpected global detected. Add the following to a module, namespace, or class:
NAME: ${ doclet.name }
FILE: ${ doclet.meta.path }/${ doclet.meta.filename }
See https://www.mediawiki.org/wiki/JSDoc#Globals
***
` );
		}
		const url = helper.longnameToUrl[ doclet.longname ];

		if ( url.includes( '#' ) ) {
			doclet.id = helper.longnameToUrl[ doclet.longname ].split( /#/ ).pop();
		} else {
			doclet.id = doclet.name;
		}

		resolveLinkFilename = doclet.longname;
		if ( needsSignature( doclet ) ) {
			addSignatureParams( doclet );
			addSignatureReturns( doclet );
			addAttribs( doclet );
		}
		resolveLinkFilename = '<unknown>';
	} );

	// do this after the urls have all been generated
	data().each( ( doclet ) => {
		doclet.breadcrumbLinks = getAncestorLinks( doclet );

		doclet.displayName = doclet.longname.replace( /\b(module|event):/g, '' );

		if ( doclet.kind === 'member' ) {
			addSignatureTypes( doclet );
			addAttribs( doclet );
		}

		if ( doclet.kind === 'constant' ) {
			addSignatureTypes( doclet );
			addAttribs( doclet );
			doclet.kind = 'member';
		}
	} );

	// make lunr index for search
	lunrHelper.makeIndex( data() );

	const members = helper.getMembers( data );
	members.tutorials = tutorials.children;

	// output pretty-printed source files by default
	const outputSourceFiles = conf.default && conf.default.outputSourceFiles !== false;

	// add template helpers
	view.find = find;
	view.linkto = linkto;
	view.resolveAuthorLinks = resolveAuthorLinks;
	view.tutoriallink = tutoriallink;
	view.htmlsafe = htmlsafe;
	view.outputSourceFiles = outputSourceFiles;

	// Find any custom pages defined by jsdoc.json
	const customPages = opts.pages || {};

	// once for all
	view.nav = buildNav( members, customPages );
	attachModuleSymbols( find( { longname: { left: 'module:' } } ), members.modules );

	// generate the pretty-printed source files first so other pages can link to them
	if ( outputSourceFiles ) {
		generateSourceFiles( sourceFiles, opts.encoding );
	}

	if ( members.globals.length ) {
		generate( 'Global', [ { kind: 'globalobj' } ], globalUrl );
	}

	// index page displays information from package.json and lists files
	const files = find( { kind: 'file' } );
	const packages = find( { kind: 'package' } );

	generate( 'Home',
		packages.concat(
			[ {
				kind: 'mainpage',
				readme: opts.readme,
				longname: ( opts.mainpagetitle ) ? opts.mainpagetitle : 'Main Page'
			} ]
		).concat( files ), indexUrl );

	// generate custom pages
	Object.keys( customPages ).forEach( ( key ) => {
		const desc = customPages[ key ];
		const readme = desc.readme ?
			marked.parse( fs.readFileSync( desc.readme ).toString() ) : '';
		if ( !readme ) {
			return;
		}
		const longname = desc.longname;
		const url = helper.getUniqueFilename( key );
		generate( longname,
			[ {
				kind: 'mainpage',
				readme
			} ], url );
	} );

	// set up the lists that we'll use to generate pages
	const classes = taffy( members.classes );
	const modules = taffy( members.modules );
	const namespaces = taffy( members.namespaces );
	const mixins = taffy( members.mixins );
	const externals = taffy( members.externals );
	const interfaces = taffy( members.interfaces );

	Object.keys( helper.longnameToUrl ).forEach( ( longname ) => {
		if ( hasOwnProp.call( aliases, longname ) ) {
			return; /* skip alias */
		}
		const myClasses = helper.find( classes, { longname: longname } ),
			myExternals = helper.find( externals, { longname: longname } ),
			myInterfaces = helper.find( interfaces, { longname: longname } ),
			myMixins = helper.find( mixins, { longname: longname } ),
			myModules = helper.find( modules, { longname: longname } ),
			myNamespaces = helper.find( namespaces, { longname: longname } );

		if ( myModules.length ) {
			generate( 'Module: ' + myModules[ 0 ].name, myModules, helper.longnameToUrl[ longname ] );
		}

		if ( myClasses.length ) {
			generate( 'Class: ' + myClasses[ 0 ].name, myClasses, helper.longnameToUrl[ longname ] );
		}

		if ( myNamespaces.length ) {
			generate( 'Namespace: ' + myNamespaces[ 0 ].name, myNamespaces, helper.longnameToUrl[ longname ] );
		}

		if ( myMixins.length ) {
			generate( 'Mixin: ' + myMixins[ 0 ].name, myMixins, helper.longnameToUrl[ longname ] );
		}

		if ( myExternals.length ) {
			generate( 'External: ' + myExternals[ 0 ].name, myExternals, helper.longnameToUrl[ longname ] );
		}

		if ( myInterfaces.length ) {
			generate( 'Interface: ' + myInterfaces[ 0 ].name, myInterfaces, helper.longnameToUrl[ longname ] );
		}
	} );

	if ( env.conf.templates.wmf.siteMap ) {
		generate( 'Sitemap',
			[ {
				kind: 'mainpage',
				readme: buildSiteMap( members, env.conf.templates.wmf.siteMap )
			} ], helper.getUniqueFilename( 'sitemap' ) );
	}

	// TODO: move the tutorial functions to templateHelper.js
	function generateTutorial( title, tutorial, filename ) {
		const tutorialData = {
				env: env,
				title: title,
				filename: filename,
				header: tutorial.title,
				content: tutorial.parse(),
				children: tutorial.children
			},
			tutorialPath = path.join( outdir, filename );

		let html = view.render( 'tutorial.tmpl', tutorialData );
		// yes, you can use {@link} in tutorials too!
		html = helper.resolveLinks( html ); // turn {@link foo} into <a href="foodoc.html">foo</a>

		fs.writeFileSync( tutorialPath, html, 'utf8' );
	}

	// tutorials can have only one parent so there is no risk for loops
	function saveChildren( node ) {
		node.children.forEach( ( child ) => {
			generateTutorial( 'Tutorial: ' + child.title, child, helper.tutorialToUrl( child.name ) );
			saveChildren( child );
		} );
	}

	saveChildren( tutorials );
};
