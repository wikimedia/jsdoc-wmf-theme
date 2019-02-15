var types = [ 'private', 'protected', 'inherited', 'deprecated' ];

function updateMethodsOf( type, checked ) {
	Array.prototype.slice.call( document.getElementsByClassName( 'method--' + type ) ).forEach( function ( methodEl ) {
		methodEl.style.display = checked === true ? 'block' : 'none';
	} );
}

function updateMethods() {
	// Show everything
	types.forEach( function ( type ) {
		updateMethodsOf( type, true );
	} );

	// Hide only the hidden ones
	types.forEach( function ( type ) {
		var checked = localStorage.getItem( type + '-check' );
		if ( checked !== 'true' ) {
			updateMethodsOf( type, false );
		}
	} );
}

function setUpListenerFor( type ) {
	var elemId = type + '-check',
		elem = document.getElementById( elemId );

	// Default is on
	if ( localStorage.getItem( elemId ) === null ) {
		localStorage.setItem( elemId, 'true' );
	}

	// Load current state and hide methods
	elem.checked = localStorage.getItem( elemId ) === 'true';
	updateMethods();

	elem.addEventListener( 'click', function () {
		// No booleans in localStorage
		localStorage.setItem( elemId, this.checked.toString() );
		updateMethods();
	} );
}

document.addEventListener( 'DOMContentLoaded', function () {
	types.forEach( function ( type ) {
		setUpListenerFor( type );
	} );
} );
