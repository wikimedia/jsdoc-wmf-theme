/* global lunr */
document.addEventListener( 'DOMContentLoaded', function () {
	var lunrIndex = lunr.Index.load( window.lunrData.index ),
		docs = window.lunrData.documents,
		UP = 38,
		DOWN = 40,
		ENTER = 13,
		searchEl = document.getElementById( 'lunr-search' ),
		resultsEl = document.getElementById( 'search-results' );

	searchEl.addEventListener( 'keyup', function ( e ) {
		if (
			e.keyCode === UP ||
			e.keyCode === DOWN ||
			e.keyCode === ENTER
		) {
			manageKeyboard( e.keyCode );
			e.preventDefault();
			return false;
		}

		if ( this.value === '' ) {
			hideResults();
		} else {
			search( this.value );
		}
	} );

	searchEl.addEventListener( 'focus', function () {
		// eslint-disable-next-line no-self-assign
		this.value = this.value; // Hack to move the cursor to the end of text
		if ( this.value === '' ) {
			hideResults();
		} else {
			search( this.value );
		}
	} );

	document.addEventListener( 'click', function () {
		hideResults();
	} );

	function search( term ) {
		// We want exact matches as well as prefix search
		// So we get both, merge and de-duplicate
		var results = mergeResults(
			lunrIndex.search( term ),
			lunrIndex.search( term + '*' )
		);
		showResults( results.slice( 0, 100 ) );
	}

	function showResults( results ) {
		// Get details of results
		var resultDocs = docs.filter( function ( d ) {
			return results.indexOf( d.id ) > -1;
		} ).map( function ( d ) {
			return {
				id: d.id,
				name: d.name,
				longname: d.longname,
				summary: d.summary || ''
			};
		} );

		// Add results to the <ul>
		resultsEl.style.display = 'block';
		resultsEl.innerHTML = '';
		resultDocs.forEach( function ( d, i ) {
			var link = '',
				id = i === 0 ? 'selected-search-result' : '';
			link += '<a href="' + d.id + '" id="' + id + '">';
			link += '<dt>' + d.name + ' &middot; <code>' + d.longname + '</code></dt>';
			link += '<dd>' + d.summary + '</dd>';
			link += '</a>';
			resultsEl.innerHTML += '<li>' + link + '</li>';
		} );
	}

	function hideResults() {
		resultsEl.style.display = 'none';
	}

	function manageKeyboard( k ) {
		var currId = 'selected-search-result',
			curr = document.getElementById( currId ),
			next;
		if ( k === ENTER ) {
			curr.click();
		} else if ( k === DOWN && curr.parentNode.nextElementSibling !== null ) {
			next = curr.parentNode.nextElementSibling.childNodes[ 0 ];
			curr.removeAttribute( 'id' );
			next.id = currId;
		} else if ( k === UP && curr.parentNode.previousElementSibling !== null ) {
			next = curr.parentNode.previousElementSibling.childNodes[ 0 ];
			curr.removeAttribute( 'id' );
			next.id = currId;
		}
	}

	function mergeResults( r1, r2 ) {
		var a = r1.concat( r2 ),
			i,
			j;

		// Remove scores and metadata before looking for uniques
		a = a.map( function ( r ) {
			return r.ref;
		} );

		// Keep uniques
		for ( i = 0; i < a.length; ++i ) {
			for ( j = i + 1; j < a.length; ++j ) {
				if ( a[ i ] === a[ j ] ) {
					a.splice( j--, 1 );
				}
			}
		}
		return a;
	}
} );
