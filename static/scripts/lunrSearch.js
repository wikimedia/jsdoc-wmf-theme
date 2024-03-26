/* global lunr */
document.addEventListener( 'DOMContentLoaded', function () {
	var lunrIndex = lunr.Index.load( window.lunrData.index ),
		docs = window.lunrData.documents,
		UP = 'ArrowUp',
		DOWN = 'ArrowDown',
		ENTER = 'Enter',
		searchEl = document.getElementById( 'lunr-search' ),
		resultsEl = document.getElementById( 'search-results' ),
		resultDocs = [];

	function showResults() {
		resultsEl.style.display = 'block';
		searchEl.setAttribute( 'aria-expanded', 'true' );
	}

	function hideResults() {
		resultsEl.style.display = 'none';
		searchEl.setAttribute( 'aria-expanded', 'false' );
	}

	searchEl.addEventListener( 'keyup', function ( e ) {
		if (
			e.key === UP ||
			e.key === DOWN ||
			e.key === ENTER
		) {
			manageKeyboard( e.key );
			e.preventDefault();
			return false;
		}

		if ( e.key === 'Escape' ) {
			hideResults();
			return false;
		}

		if ( this.value === '' ) {
			hideResults();
		} else {
			search( this.value );
		}
	} );

	document.addEventListener( 'click', function () {
		hideResults();
	} );

	searchEl.addEventListener( 'click', function ( e ) {
		/* Don't hide results on search input click. */
		e.stopPropagation();
	} );

	searchEl.addEventListener( 'focus', function () {
		// eslint-disable-next-line no-self-assign
		this.value = this.value; // Hack to move the cursor to the end of text
		if ( this.value !== '' && resultDocs.length > 0 ) {
			showResults();
		}
	} );

	function search( term ) {
		// We want exact matches as well as prefix search
		// So we get both, merge and de-duplicate
		var results = mergeResults(
			lunrIndex.search( term ),
			lunrIndex.search( term + '*' )
		);
		getResults( results.slice( 0, 100 ) );
	}

	function getResults( results ) {
		// Get details of results
		resultDocs = docs.filter( function ( d ) {
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
		resultsEl.innerHTML = '';
		resultDocs.forEach( function ( d, i ) {
			var link = '',
				id = i === 0 ? 'selected-search-result' : '',
				className = 'search-result';
			link += '<a href="' + d.id + '" id="' + id + '" class="' + className + '">';
			link += '<dt>' + d.name + ' &middot; <code>' + d.longname + '</code></dt>';

			// Get rid of any <a> tags; they will break the layout. See T357167.
			var doc = new DOMParser().parseFromString( d.summary, 'text/html' );
			var anchorTags = doc.querySelectorAll( 'a' );
			for ( var anchorTag of anchorTags ) {
				if ( anchorTag.parentNode ) {
					while ( anchorTag.firstChild ) {
						anchorTag.parentNode.insertBefore( anchorTag.firstChild, anchorTag );
					}
					anchorTag.parentNode.removeChild( anchorTag );
				}
			}
			var strippedHtml = doc.body.innerHTML;
			link += '<dd>' + strippedHtml + '</dd>';
			link += '</a>';
			resultsEl.innerHTML += '<li>' + link + '</li>';
		} );

		showResults();
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
