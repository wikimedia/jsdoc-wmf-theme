/*!
 * Based on https://github.com/jsdoc/jsdoc/blob/main/packages/jsdoc-plugins/summarize.js
 * Copyright 2014 the JSDoc Authors
 * License: https://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * This plugin creates a summary tag, if missing, from the first sentence in the description.
 */
'use strict';

exports.handlers = {
	/**
	 * Autogenerate summaries, if missing, from the description, if present.
	 *
	 * @param {Object} event
	 * @param {Object} event.doclet
	 */
	newDoclet( { doclet } ) {
		let endTag;
		let tags;
		let stack;
		let description;

		// If the summary is missing, grab the first sentence from the description
		// or the class description and use that.
		if ( doclet && !doclet.summary && ( doclet.description || doclet.classdesc ) ) {
			description = doclet.classdesc || doclet.description;
			// The summary may end with `.$`, `. `, or `.<` (a period followed by an HTML tag).
			const parts = description.split( /\.$|\.\s|\.</ );
			doclet.summary = parts[ 0 ];
			if ( parts.length > 1 ) {
				// Append `.` if it was removed
				doclet.summary += '.';
			}

			// This is an excerpt of something that is possibly HTML.
			// Balance it using a stack. Assume it was initially balanced.
			tags = doclet.summary.match( /<[^>]+>/g ) || [];
			stack = [];

			tags.forEach( ( tag ) => {
				const idx = tag.indexOf( '/' );

				if ( idx === -1 ) {
					// start tag -- push onto the stack
					stack.push( tag );
				} else if ( idx === 1 ) {
					// end tag -- pop off of the stack
					stack.pop();
				}

				// otherwise, it's a self-closing tag; don't modify the stack
			} );

			// stack should now contain only the start tags that lack end tags,
			// with the most deeply nested start tag at the top
			while ( stack.length > 0 ) {
				// pop the unmatched tag off the stack
				endTag = stack.pop();
				// get just the tag name
				endTag = endTag.slice( 1, endTag.search( /[ >]/ ) );
				// append the end tag
				doclet.summary += `</${ endTag }>`;
			}

			// and, finally, if the summary starts and ends with a <p> tag, remove it; let the
			// template decide whether to wrap the summary in a <p> tag
			doclet.summary = doclet.summary.replace( /^<p>(.*)<\/p>$/i, '$1' );
		}
	}
};
