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

addEventListener( 'DOMContentLoaded', () => {
	Array.prototype.forEach.call( document.getElementsByClassName( 'toggle-all' ), ( toggleAll ) => {
		let allOpen = false;
		toggleAll.addEventListener( 'click', ( e ) => {
			e.preventDefault();
			allOpen = !allOpen;
			Array.prototype.forEach.call( document.getElementsByTagName( 'details' ), ( detail ) => {
				detail.open = allOpen;
			} );
			toggleAll.textContent = allOpen ? 'Collapse all' : 'Expand all';
		} );
	} );
} );
