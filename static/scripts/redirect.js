/**
 * Redirect any inbound #! URLs to the old docs from JSDuck.
 * We wnat this to run as soon as possible; no need to wait
 * for DOMContentLoaded / load / etc.
 */
{
	const hash = window.location.hash;
	const base = window.location.origin + window.location.pathname;

	if ( hash.startsWith( '#!' ) ) {
		const regex = /#!\/api\/(.+)/;
		const match = hash.match( regex );

		if ( match ) {
			const extracted = match[ 1 ];
			window.location.href = new URL( `${ extracted }.html`, base );
		}
	}
}
