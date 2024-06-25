'use strict';

const assert = require( 'assert' );
const proxyquire = require( 'proxyquire' ).noPreserveCache().noCallThru();

describe( 'Externals plugin', () => {
	const defaultMaps = {
		linkMap: { 'jQuery.Promise': 'https://jquery.com' },
		prefixMap: { 'OO.ui.': 'https://doc.wikimedia.org/ooui/{type}' }
	};

	const mockConfigs = [
		{
			description: 'should extend wmfConf with defaultMaps when wmfConf already has some entries',
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
		{
			description: 'should initialize wmfConf with defaultMaps when wmfConf is empty',
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
		{
			description: 'should initialize templates and wmfConf when they do not exist',
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
	];

	const mocks = {
		'../defaultMaps': defaultMaps,
		'jsdoc/util/templateHelper': {},
		'jsdoc/tag/type': {}
	};

	// eslint-disable-next-line mocha/no-setup-in-describe
	mockConfigs.forEach( ( { description, conf, expected } ) => {
		it( description, () => {
			// Override the mock for jsdoc/env with the current test case's conf
			proxyquire( '../plugins/externals.js', {
				'jsdoc/env': { conf: conf },
				...mocks
			} );

			const { linkMap, prefixMap } = conf.templates.wmf;

			// Assertions
			assert.deepStrictEqual( linkMap, expected.linkMap );
			assert.deepStrictEqual( prefixMap, expected.prefixMap );
		} );
	} );
} );
