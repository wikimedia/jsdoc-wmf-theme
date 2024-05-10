/**
 * Redirect any inbound #! URLs to the old docs from JSDuck.
 * We want this to run as soon as possible; no need to wait
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
				/((?:^|\.)([^-.]+))-(?:static-(?:method|property)-(.+)|(?:method|property)-(.+)|event-(.+)|.+)$/,
				( ending, keep, namespaceOrClassName, staticName, instanceName, eventName ) => {
					if ( staticName ) {
						targetHash = `#.${ staticName }`;
					} else if ( instanceName ) {
						if ( /[a-z]/.test( namespaceOrClassName[ 0 ] ) ) {
							// JSDoc, unlike JSDuck, treats names under namespaces (which
							// start with a lowercase letter, e.g. mw.user) as static members.
							targetHash = `#.${ instanceName }`;
						} else if ( instanceName === 'constructor' ) {
							targetHash = `#${ namespaceOrClassName }`;
						} else {
							targetHash = `#${ instanceName }`;
						}
					} else if ( eventName ) {
						targetHash = `#event:${ eventName }`;
					}
					return keep;
				}
			);
			window.location.href = new URL( `${ extracted }.html${ targetHash }`, base );
		}
	}
}
