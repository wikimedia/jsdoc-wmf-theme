/* global FontFaceObserver */
if ( document.head && 'Promise' in window ) {
	const html = document.documentElement;

	if ( sessionStorage.getItem( 'fontsLoaded' ) ) {
		html.classList.add( 'fonts-loaded' );
	} else {
		const script = document.createElement( 'script' );
		script.src = './wmf/js/vendor/fontfaceobserver/fontfaceobserver.standalone.js';

		script.onload = function () {
			const sansSerif = new FontFaceObserver( 'Lato' ),
				serif = new FontFaceObserver( 'Charter' );

			Promise.all( [
				sansSerif.load(),
				serif.load()
			] ).then( () => {
				html.classList.add( 'fonts-loaded' );
				sessionStorage.setItem( 'fontsLoaded', 1 );
			} );
		};
		document.head.appendChild( script );
	}
}
