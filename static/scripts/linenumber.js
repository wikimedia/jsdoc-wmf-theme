( function () {
	const source = document.getElementsByClassName( 'prettyprint sourcefile linenums' );

	if ( source && source[ 0 ] ) {
		const anchorHash = document.location.hash.slice( 1 );
		const lines = source[ 0 ].getElementsByTagName( 'li' );
		const totalLines = lines.length;

		for ( let i = 0; i < totalLines; i++ ) {
			const lineId = 'line' + ( i + 1 );
			lines[ i ].id = lineId;
			if ( lineId === anchorHash ) {
				lines[ i ].className += ' selected';
			}
		}
	}
}() );
