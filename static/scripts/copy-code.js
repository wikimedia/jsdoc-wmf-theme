( function () {
	/**
	 * Support copying code from examples
	 *
	 * Authors:
	 * - Derk-Jan Hartman <hartman.wiki@gmail.com>,
	 * - Timo Tijhof <krinkle@fastmail.com>
	 * Based on: https://www.mediawiki.org/wiki/MediaWiki:Gadget-site-tpl-copy.js
	 */

	const hasFeature = navigator.clipboard && 'writeText' in navigator.clipboard;

	function onCopy( mouseevent ) {
		const btn = mouseevent.currentTarget;
		const wrapper = btn.closest( '.copy-code-wrapper' ).querySelector( 'code' );
		const content = wrapper && wrapper.textContent.trim();
		try {
			navigator.clipboard.writeText( content );
		} catch ( e ) {
			return;
		}
		const prevLabel = btn.textContent;
		btn.textContent = 'Copied!';
		setTimeout( () => {
			btn.textContent = prevLabel;
		}, 5000 );
	}

	function generateButton() {
		const btn = document.createElement( 'button' );
		btn.setAttribute( 'type', 'button' );
		btn.textContent = 'Copy';
		btn.addEventListener( 'click', onCopy );
		return btn;
	}

	if ( hasFeature ) {
		document.addEventListener( 'DOMContentLoaded', () => {
			document.body.querySelectorAll( 'pre.prettyprint:not(.sourcefile), pre:has(>code)' ).forEach( ( codeExample ) => {
				codeExample.appendChild( generateButton() );
				codeExample.classList.add( 'copy-code-wrapper' );
			} );
		} );
	}
}() );
