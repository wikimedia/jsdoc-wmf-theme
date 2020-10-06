/* eslint-disable vars-on-top */
/* global exports, require, TAFFY, Tutorial */
'use strict';

var domino = require( 'domino' ),
	doop = require( 'jsdoc/util/doop' ),
	env = require( 'jsdoc/env' ),
	fs = require( 'jsdoc/fs' ),
	helper = require( 'jsdoc/util/templateHelper' ),
	logger = require( 'jsdoc/util/logger' ),
	path = require( 'jsdoc/path' ),
	taffy = require( 'taffydb' ).taffy,
	template = require( 'jsdoc/template' ),
	util = require( 'util' ),
	lunrHelper = require( './lunrHelper' ),

	resolveLinkFilename = '<unknown>',
	rLiteral = /^(null|undefined|true|false|NaN|Infinity)$/,
	// These are built-in types and classes in ECMAScript.
	// Our Wikimedia-specific rule of requiring a linkMap entry will allow these,
	// to be absence, resulting in the default JSDoc behaviour of a type without
	// hyperlink (without printing warning).
	rGeneric = /^(boolean|number|string|function|symbol|Array|Object|Function|Date|RegExp|Error|Promise|Map|Set|WeakMap|WeakSet)$/,

	htmlsafe = helper.htmlsafe,
	linkto = function ( longname, linkText, cssClass, fragmentId ) {
		if ( longname === 'any' ) {
			return longname;
		}
		if ( rLiteral.test( longname ) ) {
			return '<code>' + linkText + '</code>';
		}
		var isGeneric = rGeneric.test( longname ),
			r = helper.linkto( longname, linkText, cssClass, fragmentId );
		if ( isGeneric ) {
		// Allow linking of generic types, e.g. to MDN.
			longname = longname[ 0 ].toUpperCase() + longname.slice( 1 );
		}
		if ( !isGeneric && !/^(<a href=|<p|{@)/.test( r ) ) {
			logger.warn( 'Unknown link %s in %s', longname, resolveLinkFilename );
		}
		return r;
	},
	resolveAuthorLinks = helper.resolveAuthorLinks,
	hasOwnProp = Object.prototype.hasOwnProperty,

	data,
	view,
	aliases = {},

	// eslint-disable-next-line no-restricted-properties
	outdir = path.normalize( env.opts.destination );

function addAlias( name, url ) {
	if ( helper.longnameToUrl[ name ] ) {
		return;
	}
	helper.registerLink( name, url );
	aliases[ name ] = true;
}

// eslint-disable-next-line no-redeclare
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
	var url;

	if ( !/^(#.+)/.test( hash ) ) {
		return hash;
	}

	url = helper.createLink( doclet );
	url = url.replace( /(#.+|$)/, hash );

	return '<a href="' + url + '">' + hash + '</a>';
}

/* eslint-disable brace-style */
function needsSignature( doclet ) {
	var needsSig = false,
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
	var attributes = [];

	if ( item.optional ) {
		attributes.push( 'opt' );
	}

	if ( item.nullable === true ) {
		attributes.push( 'nullable' );
	} else if ( item.nullable === false ) {
		attributes.push( 'non-null' );
	}

	return attributes;
}

function updateItemName( item ) {
	var attributes = getSignatureAttributes( item ),
		itemName = item.name || '';

	if ( item.variable ) {
		itemName = '&hellip;' + itemName;
	}

	if ( attributes && attributes.length ) {
		itemName = util.format( '%s<span class="signature-attributes">%s</span>', itemName,
			attributes.join( ', ' ) );
	}

	return itemName;
}

function addParamAttributes( params ) {
	return params.filter( function ( param ) {
		return param.name && param.name.indexOf( '.' ) === -1;
	} ).map( updateItemName );
}

function buildItemTypeStrings( item ) {
	var types = [];

	if ( item && item.type && item.type.names ) {
		item.type.names.forEach( function ( name ) {
			types.push( linkto( name, htmlsafe( name ) ) );
		} );
	}

	return types;
}

function buildAttribsString( attribs ) {
	var attribsString = '';

	if ( attribs && attribs.length ) {
		attribsString = htmlsafe( util.format( '(%s) ', attribs.join( ', ' ) ) );
	}

	return attribsString;
}

function addNonParamAttributes( items ) {
	var types = [];

	items.forEach( function ( item ) {
		types = types.concat( buildItemTypeStrings( item ) );
	} );

	return types;
}

function addSignatureParams( f ) {
	var params = f.params ? addParamAttributes( f.params ) : [];

	f.signature = util.format( '%s(%s)', ( f.signature || '' ), params.join( ', ' ) );
}

function addSignatureReturns( f ) {
	var attribs = [],
		attribsString = '',
		returnTypes = [],
		returnTypesString = '',
		source = f.yields || f.returns;

	// jam all the return-type attributes into an array. this could create odd results (for example,
	// if there are both nullable and non-nullable return types), but let's assume that most people
	// who use multiple @return tags aren't using Closure Compiler type annotations, and vice-versa.
	if ( source ) {
		source.forEach( function ( item ) {
			helper.getAttribs( item ).forEach( function ( attrib ) {
				if ( attribs.indexOf( attrib ) === -1 ) {
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
	var types = f.type ? buildItemTypeStrings( f ) : [];

	f.signature = ( f.signature || '' ) + '<span class="type-signature">' +
		( types.length ? ' :' + types.join( '|' ) : '' ) + '</span>';
}

function addClassNames( f ) {
	var attribs = helper.getAttribs( f ),
		classNames = attribs.map( function ( a ) {
			return 'method--' + a;
		} ).join( ' ' );
	classNames += f.inherited ? ' method--inherited' : '';
	classNames += f.deprecated ? ' method--deprecated' : '';
	f.attribsClassName = classNames;
}

function addAttribs( f ) {
	var attribs = helper.getAttribs( f ),
		attribsString = buildAttribsString( attribs );
	f.attribs = util.format( '<span class="type-signature">%s</span>', attribsString );
	addClassNames( f );
}

function shortenPaths( files, commonPrefix ) {
	Object.keys( files ).forEach( function ( file ) {
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
	var docData,
		html,
		outpath;

	resolveLinks = resolveLinks !== false;

	docData = {
		env: env,
		title: title,
		filename: filename,
		docs: docs
	};

	outpath = path.join( outdir, filename );
	// shortpath / name / longname in docData.docs[x]
	resolveLinkFilename = docData.title || filename;
	html = view.render( 'container.tmpl', docData );

	if ( resolveLinks ) {
		html = helper.resolveLinks( html ); // turn {@link foo} into <a href="foodoc.html">foo</a>
	}
	resolveLinkFilename = '<unknown>';

	fs.writeFileSync( outpath, html, 'utf8' );
}

function generateSourceFiles( sourceFiles, encoding ) {
	encoding = encoding || 'utf8';
	Object.keys( sourceFiles ).forEach( function ( file ) {
		var source,
			// links are keyed to the shortened path in each doclet's `meta.shortpath` property
			sourceOutfile = helper.getUniqueFilename( sourceFiles[ file ].shortened );

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
	var symbols = {};

	// build a lookup table
	doclets.forEach( function ( symbol ) {
		symbols[ symbol.longname ] = symbols[ symbol.longname ] || [];
		symbols[ symbol.longname ].push( symbol );
	} );

	modules.forEach( function ( module ) {
		if ( symbols[ module.longname ] ) {
			module.modules = symbols[ module.longname ]
				// Only show symbols that have a description. Make an exception for classes, because
				// we want to show the constructor-signature heading no matter what.
				.filter( function ( symbol ) {
					return symbol.description || symbol.kind === 'class';
				} )
				.map( function ( symbol ) {
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
	var a,
		li = doc.createElement( 'li' );
	li.classList.add( navItemData.sub ? 'nav__sub-item' : 'nav__item' );
	if ( navItemData.tag === 'a' ) {
		a = doc.createElement( 'a' );
		li.appendChild( a );
		if ( navItemData.href ) {
			a.setAttribute( 'href', navItemData.href );
		}
		a.textContent = navItemData.title;
	} else if ( typeof ( navItemData.html ) === 'string' ) {
		li.innerHTML = navItemData.html;
	}
	return li;
}

function addNavItem( parent, navItemData ) {
	parent.appendChild( makeNavItem( parent.ownerDocument, navItemData ) );
	return parent;
}

function buildMemberNav( parent, items, itemHeading, itemsSeen, linktoFn ) {
	var nav = '',
		li,
		ul;

	if ( items.length ) {
		li = makeNavItem( parent.ownerDocument, { tag: 'a', title: itemHeading } );
		ul = parent.ownerDocument.createElement( 'ul' );
		ul.classList.add( 'nav__sub-items' );
		li.appendChild( ul );

		items.forEach( function ( item ) {
			var displayName;

			if ( !hasOwnProp.call( item, 'longname' ) ) {
				addNavItem( ul, { sub: true, html: linktoFn( '', item.name ) } );
			} else if ( !hasOwnProp.call( itemsSeen, item.longname ) ) {
				if ( env.conf.templates.default.useLongnameInNav ) {
					displayName = item.longname;
				} else {
					displayName = item.name;
				}
				addNavItem( ul, { sub: true, html: linktoFn( item.longname, displayName.replace( /\b(module|event):/g, '' ) ) } );

				itemsSeen[ item.longname ] = true;
			}
		} );

		if ( ul.firstChild ) {
			parent.appendChild( li );
		}
	}

	return nav;
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
function buildMemberNavIfConf( nav, member, name, seen, linktoFn ) {
	if (
		env.conf.templates.wmf.hideSections === undefined ||
	env.conf.templates.wmf.hideSections.indexOf( name ) < 0
	) {
		buildMemberNav( nav, member, name, seen, linktoFn );
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
 * @return {string} The HTML for the navigation sidebar.
 */
function buildNav( members ) {
	var globalNav,
		doc = domino.createDocument(),
		nav = doc.createElement( 'ol' ),
		seen = {},
		seenTutorials = {},
		h3;
	doc.body.appendChild( nav );
	addNavItem( nav, { tag: 'a', href: 'index.html', title: 'Home' } );

	buildMemberNavIfConf( nav, members.modules, 'Modules', {}, linkto );
	buildMemberNavIfConf( nav, members.externals, 'Externals', seen, linktoExternal );
	buildMemberNavIfConf( nav, members.namespaces, 'Namespaces', seen, linkto );
	buildMemberNavIfConf( nav, members.classes, 'Classes', seen, linkto );
	buildMemberNavIfConf( nav, members.interfaces, 'Interfaces', seen, linkto );
	buildMemberNavIfConf( nav, members.events, 'Events', seen, linkto );
	buildMemberNavIfConf( nav, members.mixins, 'Mixins', seen, linkto );
	buildMemberNavIfConf( nav, members.tutorials, 'Tutorials', seenTutorials, linktoTutorial );

	// eslint-disable-next-line no-constant-condition
	if ( members.globals.length && false ) {
		globalNav = doc.createElement( 'ul' );

		members.globals.forEach( function ( g ) {
			if ( g.kind !== 'typedef' && !hasOwnProp.call( seen, g.longname ) ) {
				addNavItem( globalNav, { sub: true, html: linkto( g.longname, g.name ) } );
			}
			seen[ g.longname ] = true;
		} );

		h3 = doc.createElement( h3 );
		if ( !globalNav.firstChild ) {
			// turn the heading into a link so you can actually get to the global page
			h3.innerHTML = linkto( 'global', 'Global' );
			nav.appendChild( h3 );
		} else {
			h3.textContent = 'Global';
			nav.appendChild( h3 );
			nav.appendChild( globalNav );
		}
	}

	return function ( filename ) {
		var nav2 = nav.cloneNode( true ),
			el = nav2.querySelector( 'a[href="' + filename + '"]' );
		while ( el ) {
			if ( el.tagName === 'LI' ) {
				el.classList.add( 'is-on' );
			}
			el = el.parentNode;
		}
		return nav2.outerHTML;
	};
}

/**
	@param {TAFFY} taffyData See <http://taffydb.com/>.
	@param {Object} opts
	@param {Tutorial} tutorials
 */
exports.publish = function ( taffyData, opts, tutorials ) {
	var classes,
		conf,
		externals,
		files,
		fromDir,
		globalUrl,
		indexUrl,
		interfaces,
		members,
		mixins,
		modules,
		namespaces,
		outputSourceFiles,
		packageInfo,
		packages,
		sourceFilePaths = [],
		sourceFiles = {},
		staticFileFilter,
		staticFilePaths,
		staticFiles,
		staticFileScanner,
		templatePath;

	data = taffyData;

	conf = env.conf.templates || {};
	conf.default = conf.default || {};
	conf.wmf = conf.wmf || {};

	// eslint-disable-next-line no-restricted-properties
	templatePath = path.normalize( opts.template );
	view = new template.Template( path.join( templatePath, 'tmpl' ) );

	// claim some special filenames in advance, so the All-Powerful Overseer of Filename Uniqueness
	// doesn't try to hand them out later
	indexUrl = helper.getUniqueFilename( 'index' );
	// don't call registerLink() on this one! 'index' is also a valid longname

	globalUrl = helper.getUniqueFilename( 'global' );
	helper.registerLink( 'global', globalUrl );

	// Manually-requested links (to external documentation)
	conf.wmf.linkMap = conf.wmf.linkMap || {};
	Object.keys( conf.wmf.linkMap ).forEach( function ( longname ) {
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

	data().each( function ( doclet ) {
		var sourcePath;

		doclet.attribs = '';

		if ( doclet.examples ) {
			doclet.examples = doclet.examples.map( function ( example ) {
				var $caption,
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
			doclet.see.forEach( function ( seeItem, i ) {
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
			if ( sourceFilePaths.indexOf( sourcePath ) === -1 ) {
				sourceFilePaths.push( sourcePath );
			}
		}
	} );

	// update outdir if necessary, then create outdir
	packageInfo = ( find( { kind: 'package' } ) || [] )[ 0 ];
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
	fs.mkPath( outdir );

	// Copy the WMF style guide files to outdir
	[ path.join( 'css', 'build' ), 'js', 'fonts' ].forEach( function ( d ) {
		fromDir = path.join( templatePath, 'WikimediaUI-Style-Guide', d );
		fs.ls( fromDir, 3 ).forEach( function ( fileName ) {
			var toDir = fs.toDir(
				fileName.replace( fromDir, path.join( outdir, 'wmf', d ) )
			);
			fs.mkPath( toDir );
			fs.copyFileSync( fileName, toDir );
		} );
	} );

	// copy the template's static files to outdir
	fromDir = path.join( templatePath, 'static' );
	staticFiles = fs.ls( fromDir, 3 );

	staticFiles.forEach( function ( fileName ) {
		var toDir = fs.toDir( fileName.replace( fromDir, outdir ) );

		fs.mkPath( toDir );
		fs.copyFileSync( fileName, toDir );
	} );

	// copy user-specified static files to outdir
	if ( conf.default.staticFiles ) {
		// The canonical property name is `include`. We accept `paths` for backwards compatibility
		// with a bug in JSDoc 3.2.x.
		staticFilePaths = conf.default.staticFiles.include ||
			conf.default.staticFiles.paths ||
			[];
		staticFileFilter = new ( require( 'jsdoc/src/filter' ) ).Filter( conf.default.staticFiles );
		staticFileScanner = new ( require( 'jsdoc/src/scanner' ) ).Scanner();

		staticFilePaths.forEach( function ( filePath ) {
			var extraStaticFiles;

			filePath = path.resolve( env.pwd, filePath );
			extraStaticFiles = staticFileScanner.scan( [ filePath ], 10, staticFileFilter );

			extraStaticFiles.forEach( function ( fileName ) {
				var sourcePath = fs.toDir( filePath ),
					toDir = fs.toDir( fileName.replace( sourcePath, outdir ) );

				fs.mkPath( toDir );
				fs.copyFileSync( fileName, toDir );
			} );
		} );
	}

	if ( sourceFilePaths.length ) {
		sourceFiles = shortenPaths( sourceFiles, path.commonPrefix( sourceFilePaths ) );
	}
	data().each( function ( doclet ) {
		var docletPath,
			url = helper.createLink( doclet );

		helper.registerLink( doclet.longname, url );

		// add a shortened version of the full path
		if ( doclet.meta ) {
			docletPath = getPathFromDoclet( doclet );
			docletPath = sourceFiles[ docletPath ].shortened;
			if ( docletPath ) {
				doclet.meta.shortpath = docletPath;
			}
		}
	} );

	// Add synthetic names
	// eslint-disable-next-line one-var
	var count = {},
		shorten = function ( longname ) {
			var pieces = longname.split( '~', 2 );
			return pieces.length < 2 ? null : pieces[ 1 ];
		};
	// Find ambiguous shortnames
	Object.keys( helper.longnameToUrl ).forEach( function ( longname ) {
		var s = shorten( longname );
		if ( s ) {
			// Prefix '$' so we don't conflict w/ built-ins like 'prototype'
			count[ '$' + s ] = ( count[ '$' + s ] || 0 ) + 1;
		}
	} );
	// Ok, add non-ambiguous shortnames
	Object.keys( helper.longnameToUrl ).forEach( function ( longname ) {
		var s = shorten( longname );
		if ( s && count[ '$' + s ] === 1 ) {
			addAlias( s, helper.longnameToUrl[ longname ] );
		} else if ( s ) {
			logger.warn( 'Ambiguous shortname:', s );
		}
	} );

	data().each( function ( doclet ) {
		var url = helper.longnameToUrl[ doclet.longname ];

		if ( url.indexOf( '#' ) > -1 ) {
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
	data().each( function ( doclet ) {
		doclet.ancestors = getAncestorLinks( doclet );

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

	members = helper.getMembers( data );
	members.tutorials = tutorials.children;

	// output pretty-printed source files by default
	outputSourceFiles = conf.default && conf.default.outputSourceFiles !== false;

	// add template helpers
	view.find = find;
	view.linkto = linkto;
	view.resolveAuthorLinks = resolveAuthorLinks;
	view.tutoriallink = tutoriallink;
	view.htmlsafe = htmlsafe;
	view.outputSourceFiles = outputSourceFiles;

	// once for all
	view.nav = buildNav( members );
	attachModuleSymbols( find( { longname: { left: 'module:' } } ), members.modules );

	// generate the pretty-printed source files first so other pages can link to them
	if ( outputSourceFiles ) {
		generateSourceFiles( sourceFiles, opts.encoding );
	}

	if ( members.globals.length ) {
		generate( 'Global', [ { kind: 'globalobj' } ], globalUrl );
	}

	// index page displays information from package.json and lists files
	files = find( { kind: 'file' } );
	packages = find( { kind: 'package' } );

	generate( 'Home',
		packages.concat(
			[ {
				kind: 'mainpage',
				readme: opts.readme,
				longname: ( opts.mainpagetitle ) ? opts.mainpagetitle : 'Main Page'
			} ]
		).concat( files ), indexUrl );

	// set up the lists that we'll use to generate pages
	classes = taffy( members.classes );
	modules = taffy( members.modules );
	namespaces = taffy( members.namespaces );
	mixins = taffy( members.mixins );
	externals = taffy( members.externals );
	interfaces = taffy( members.interfaces );

	Object.keys( helper.longnameToUrl ).forEach( function ( longname ) {
		if ( hasOwnProp.call( aliases, longname ) ) {
			return; /* skip alias */
		}
		var myClasses = helper.find( classes, { longname: longname } ),
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

	// TODO: move the tutorial functions to templateHelper.js
	function generateTutorial( title, tutorial, filename ) {
		var tutorialData = {
				env: env,
				title: title,
				filename: filename,
				header: tutorial.title,
				content: tutorial.parse(),
				children: tutorial.children
			},
			tutorialPath = path.join( outdir, filename ),
			html = view.render( 'tutorial.tmpl', tutorialData );

		// yes, you can use {@link} in tutorials too!
		html = helper.resolveLinks( html ); // turn {@link foo} into <a href="foodoc.html">foo</a>

		fs.writeFileSync( tutorialPath, html, 'utf8' );
	}

	// tutorials can have only one parent so there is no risk for loops
	function saveChildren( node ) {
		node.children.forEach( function ( child ) {
			generateTutorial( 'Tutorial: ' + child.title, child, helper.tutorialToUrl( child.name ) );
			saveChildren( child );
		} );
	}

	saveChildren( tutorials );
};
