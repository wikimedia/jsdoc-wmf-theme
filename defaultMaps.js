'use strict';

// Locally can be overidden to `false` to completely unregister,
// allowing the matcher to fall through to shorter sub-prefixes,
// and `true` if the prefix is used locally, so the matcher will
// recognise it, do nothing, and skip over any shorter sub-prefixes.
const prefixMap = {
	'OO.ui.': 'https://doc.wikimedia.org/oojs-ui/master/js/{type}.html',
	'OO.': 'https://doc.wikimedia.org/oojs/master/{type}.html'
};
const linkMap = {
	// jQuery
	jQuery: 'http://api.jquery.com/',
	'jQuery.Deferred': 'http://api.jquery.com/jQuery.Deferred/',
	'jQuery.Event': 'http://api.jquery.com/Types/#Event',
	'jQuery.jqXHR': 'http://api.jquery.com/Types/#jqXHR',
	'jQuery.Promise': 'http://api.jquery.com/Types/#Promise'
};

// Standard built-in objects
[
	// Scraped from https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects
	// Fundamental objects
	'Object',
	'Function',
	'Boolean',
	'Symbol',
	// Error objects
	'Error',
	'AggregateError',
	'EvalError',
	'RangeError',
	'ReferenceError',
	'SyntaxError',
	'TypeError',
	'URIError',
	// Numbers and dates
	'Number',
	'BigInt',
	'Math',
	'Date',
	// Text processing
	'String',
	'RegExp',
	// Indexed collections
	'Array',
	'Int8Array',
	'Uint8Array',
	'Uint8ClampedArray',
	'Int16Array',
	'Uint16Array',
	'Int32Array',
	'Uint32Array',
	'BigInt64Array',
	'BigUint64Array',
	'Float32Array',
	'Float64Array',
	// Keyed collections
	'Map',
	'Set',
	'WeakMap',
	'WeakSet',
	// Structured data
	'ArrayBuffer',
	'SharedArrayBuffer',
	'DataView',
	'Atomics',
	'JSON',
	// Managing memory
	'WeakRef',
	'FinalizationRegistry',
	// Control abstraction objects
	'Iterator',
	'AsyncIterator',
	'Promise',
	'GeneratorFunction',
	'AsyncGeneratorFunction',
	'Generator',
	'AsyncGenerator',
	'AsyncFunction',
	// Reflection
	'Reflect',
	'Proxy',
	// Internationalization
	'Intl',
	'Intl.Collator',
	'Intl.DateTimeFormat',
	'Intl.DisplayNames',
	'Intl.DurationFormat',
	'Intl.ListFormat',
	'Intl.Locale',
	'Intl.NumberFormat',
	'Intl.PluralRules',
	'Intl.RelativeTimeFormat',
	'Intl.Segmenter'
].forEach( ( type ) => {
	linkMap[ type ] = `https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/${ type.replace( '.', '/' ) }`;
} );

// Web APIs
// Scraped from https://developer.mozilla.org/en-US/docs/Web/API#interfaces
require( './data/webapis' ).forEach( ( type ) => {
	linkMap[ type ] = `https://developer.mozilla.org/docs/Web/API/${ type }`;
} );

module.exports = {
	prefixMap,
	linkMap
};
