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
			let targetHash = '';
			const extracted = match[ 1 ].replace(
				/(\.([^-]+))-(?:static-(?:method|property)-(.+)|(?:method|property)-(.+)|.+)$/g,
				( postfix, keep, className, staticName, instanceName ) => {
					if ( staticName ) {
						targetHash = `#.${ staticName }`;
					} else if ( instanceName ) {
						if ( instanceName === 'constructor' ) {
							targetHash = `#${ className }`;
						} else {
							targetHash = `#${ instanceName }`;
						}
					}
					return keep;
				}
			);
			window.location.href = new URL( `${ extracted }.html${ targetHash }`, base );
		}
	}
}
