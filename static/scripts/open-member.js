window.addEventListener( 'DOMContentLoaded', () => {
	if ( window.location.hash ) {
		openMember();
		window.setTimeout( () => {
			window.scrollTo( 0, ( window.pageYOffset || document.documentElement.scrollTop ) );
		}, 0 );
	}
} );

window.addEventListener( 'hashchange', ( e ) => {
	e.stopPropagation();
	openMember();
} );

function openMember() {
	const id = window.location.hash.slice( 1 );
	const toggler = document.getElementById( 'toggle-' + id );
	if ( toggler ) {
		const y = window.scrollY;
		toggler.open = true;
		window.scrollTo( 0, y );
	}
}
