/* global lunr */

document.addEventListener( 'DOMContentLoaded', () => {
	const lunrIndex = lunr.Index.load( window.lunrData.index ),
		docs = window.lunrData.documents,
		UP = 'ArrowUp',
		DOWN = 'ArrowDown',
		ENTER = 'Enter',
		searchEl = document.getElementById( 'lunr-search' ),
		resultsEl = document.getElementById( 'search-results' );
	let resultDocs = [];

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

	document.addEventListener( 'click', () => {
		hideResults();
	} );

	searchEl.addEventListener( 'click', ( e ) => {
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
		const results = mergeResults(
			lunrIndex.search( term ),
			lunrIndex.search( term + '*' )
		);
		getResults( results.slice( 0, 100 ) );
	}

	function getResults( results ) {
		// Map result refs back to doc and their details
		// This must preserve the order of the results array (T405317)
		resultDocs = results.map( ( id ) => docs[ id ] ).map( ( d ) => ( {
			id: d.id,
			name: d.name,
			longname: d.longname,
			summary: d.summary || ''
		} ) );

		// Add results to the <ul>
		resultsEl.innerHTML = '';
		resultDocs.forEach( ( d, i ) => {
			const id = i === 0 ? 'selected-search-result' : '',
				className = 'search-result';
			let link = '';
			link += '<a href="' + d.id + '" id="' + id + '" class="' + className + '">';
			link += '<dt>' + d.name + ' &middot; <code>' + d.longname + '</code></dt>';

			// Get rid of any <a> tags; they will break the layout. See T357167.
			const doc = new DOMParser().parseFromString( d.summary, 'text/html' );
			const anchorTags = doc.querySelectorAll( 'a' );
			for ( const anchorTag of anchorTags ) {
				if ( anchorTag.parentNode ) {
					while ( anchorTag.firstChild ) {
						anchorTag.parentNode.insertBefore( anchorTag.firstChild, anchorTag );
					}
					anchorTag.parentNode.removeChild( anchorTag );
				}
			}
			const strippedHtml = doc.body.innerHTML;
			link += '<dd>' + strippedHtml + '</dd>';
			link += '</a>';
			resultsEl.innerHTML += '<li>' + link + '</li>';
		} );

		showResults();
	}

	function manageKeyboard( k ) {
		const currId = 'selected-search-result',
			curr = document.getElementById( currId );
		let next;
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
		let a = r1.concat( r2 );

		// Remove scores and metadata before looking for uniques
		a = a.map( ( r ) => r.ref );

		// Keep uniques
		for ( let i = 0; i < a.length; ++i ) {
			for ( let j = i + 1; j < a.length; ++j ) {
				if ( a[ i ] === a[ j ] ) {
					a.splice( j--, 1 );
				}
			}
		}
		return a;
	}
} );
