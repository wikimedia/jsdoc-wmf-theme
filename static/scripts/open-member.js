window.addEventListener( 'DOMContentLoaded', function () {
	if ( window.location.hash ) {
		openMember();
		window.setTimeout( function () {
			window.scrollTo( 0, ( window.pageYOffset || document.documentElement.scrollTop ) - 72 );
		}, 0 );
	}
} );

window.addEventListener( 'hashchange', function ( e ) {
	e.stopPropagation();
	openMember();
} );

function openMember() {
	const id = window.location.hash.slice( 1 );
	const toggler = document.getElementById( 'toggle-' + id );
	if ( toggler ) {
		const offset = toggler.getBoundingClientRect().top;
		const y = window.scrollY + offset;
		toggler.open = true;
		window.scrollTo( 0, y );
	}
}
