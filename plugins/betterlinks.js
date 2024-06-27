'use strict';

/**
 * Add support for {@link .shortName} and {@link #shortName}, as well
 * as link-ifying URLs.
 */
const utils = require( '../src/utils' );
// eslint-disable-next-line n/no-missing-require
const env = require( 'jsdoc/env' );

// (Gruber's "Liberal Regex Pattern for Web URLs)
// https://gist.github.com/gruber/8891611
// eslint-disable-next-line no-useless-escape, security/detect-unsafe-regex
const reWeburl = /\b((?:https?:(?:\/{1,3}|[a-z0-9%])|[a-z0-9.\-]+[.](?:com|net|org|edu|gov|mil|aero|asia|biz|cat|coop|info|int|jobs|mobi|museum|name|post|pro|tel|travel|xxx|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cs|cu|cv|cx|cy|cz|dd|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|Ja|sk|sl|sm|sn|so|sr|ss|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw)\/)(?:[^\s()<>{}\[\]]+|\([^\s()]*?\([^\s()]+\)[^\s()]*?\)|\([^\s]+?\))+(?:\([^\s()]*?\([^\s()]+\)[^\s()]*?\)|\([^\s]+?\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’])|(?:[a-z0-9]+(?:[.\-][a-z0-9]+)*[.](?:com|net|org|edu|gov|mil|aero|asia|biz|cat|coop|info|int|jobs|mobi|museum|post|pro|tel|travel|xxx|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cs|cu|cv|cx|cy|cz|dd|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|Ja|sk|sl|sm|sn|so|sr|ss|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw)\b\/?(?!@)))/ig;

exports.handlers = {
	newDoclet: function ( e ) {
		utils.processText( e.doclet, ( text, tag, longname ) => {
			// we only want to process `@author` and `@see` tags that contain '{@link}'
			if ( ( tag === 'author' || tag === 'see' ) && !/{@link/.test( text ) ) {
				return text;
			}

			const basename = longname.replace( /[#.].*$/, '' ),
				// Link up phabricator tickets. The default is WMF-specific, and so
				// should probably be tweaked if this theme were to be more generally
				// used.
				conf = ( env.conf.templates && env.conf.templates.betterlinks ) || {},
				phabBase = conf.phabricator || 'https://phabricator.wikimedia.org/';
			// Replace shortnames with appropriate longname
			text = text.replace( /\{\s*@link\s+([#.])([\w$]+)\s*\}/g, ( m, mod, name ) => '{@link ' + basename + mod + name + ' ' + mod + name + '}' );
			// Ensure that things which look like http/https URLs are {@link}-ified
			text = text.replace( reWeburl, ( match, _, offset, innerText ) => {
				const before = innerText.slice( 0, offset );
				if ( /(\{@link |@|=['"])$/.test( before ) ) {
					return match; // don't linkify
				}
				return '{@link ' + match + '}';
			} );
			if ( /^http/.test( phabBase ) ) {
				text = text.replace( /\bT\d+\b/g, ( task ) => '{@link ' + phabBase + task + ' ' + task + '}' );
			}
			return text;
		} );
	}
};
