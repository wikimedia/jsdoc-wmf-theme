( function () {
	var source = document.getElementsByClassName( 'prettyprint sourcefile linenums' );

	if ( source && source[ 0 ] ) {
		var anchorHash = document.location.hash.slice( 1 );
		var lines = source[ 0 ].getElementsByTagName( 'li' );
		var totalLines = lines.length;

		for ( var i = 0; i < totalLines; i++ ) {
			var lineId = 'line' + ( i + 1 );
			lines[ i ].id = lineId;
			if ( lineId === anchorHash ) {
				lines[ i ].className += ' selected';
			}
		}
	}
}() );
