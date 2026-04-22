'use strict';

const proxyquire = require( 'proxyquire' ).noPreserveCache().noCallThru();

QUnit.module( 'Externals plugin', () => {
	const defaultMaps = {
		linkMap: { 'jQuery.Promise': 'https://jquery.com' },
		prefixMap: { 'OO.ui.': 'https://doc.wikimedia.org/ooui/{type}' }
	};

	const mocks = {
		'../src/defaultMaps': defaultMaps,
		'jsdoc/util/templateHelper': {},
		'jsdoc/tag/type': {}
	};

	QUnit.test.each( 'conf', {
		'extend wmfConf with defaultMaps when wmfConf already has some entries': {
			conf: {
				templates: {
					wmf: {
						linkMap: { 'jQuery.Deferred': 'https://jquery.com' },
						prefixMap: { 'OO.': 'https://doc.wikimedia.org/oo/{type}' }
					}
				}
			},
			expected: {
				linkMap: {
					'jQuery.Promise': 'https://jquery.com',
					'jQuery.Deferred': 'https://jquery.com'
				},
				prefixMap: {
					'OO.ui.': 'https://doc.wikimedia.org/ooui/{type}',
					'OO.': 'https://doc.wikimedia.org/oo/{type}'
				}
			}
		},
		'initialize wmfConf with defaultMaps when wmfConf is empty': {
			conf: {
				templates: {
					wmf: {}
				}
			},
			expected: {
				linkMap: {
					'jQuery.Promise': 'https://jquery.com'
				},
				prefixMap: {
					'OO.ui.': 'https://doc.wikimedia.org/ooui/{type}'
				}
			}
		},
		'initialize templates and wmfConf when they do not exist': {
			conf: {},
			expected: {
				linkMap: {
					'jQuery.Promise': 'https://jquery.com'
				},
				prefixMap: {
					'OO.ui.': 'https://doc.wikimedia.org/ooui/{type}'
				}
			}
		}
	}, ( assert, { conf, expected } ) => {
		// Override the mock for jsdoc/env with the current test case's conf
		proxyquire( '../plugins/externals.js', {
			'jsdoc/env': { conf: conf },
			...mocks
		} );

		const { linkMap, prefixMap } = conf.templates.wmf;

		assert.deepEqual( linkMap, expected.linkMap );
		assert.deepEqual( prefixMap, expected.prefixMap );
	} );
} );
