# JSDoc WMF theme

A theme for JSDoc 4 conforming to the [Codex](https://doc.wikimedia.org/codex/latest/) design system.
Forked from the default template for JSDoc 3, which uses the [Underscore Template library](http://underscorejs.org/).

## Example
See the [EventLogging docs](https://doc.wikimedia.org/EventLogging/master/js/index.html) for a sample demo. :rocket:

## Install
```bash
$ npm install --save jsdoc-wmf-theme
```

## Usage
In your `jsdoc.json` file, add a template option.
```json
"opts": {
  "template": "node_modules/jsdoc-wmf-theme"
}
```

To load the standard set of plugins, use:
```json
"plugins": {
  "node_modules/jsdoc-wmf-theme/plugins/default"
}
```

### Options
For information about options and plugins, see the [wiki page](https://www.mediawiki.org/wiki/Special:MyLanguage/JSDoc).

## Contributing
Contributions to the theme are welcome! See the [JSDoc WMF theme](https://phabricator.wikimedia.org/tag/jsdoc_wmf_theme/)
board on Phabricator to view open tasks or open new tasks, bug reports, or requests.

### Local development
These steps assume that you have [Gerrit](https://www.mediawiki.org/wiki/Gerrit/Tutorial) set up.

To set up a development environment, you'll need a repository that can generate JSDoc documentation,
and this theme itself.

#### Initial setup

```bash
# Create a local folder
mkdir jsdoc-test
# Enter that new local folder
cd jsdoc-test

# Download a repository that uses JSDoc. Either MediaWiki core...
git clone https://gerrit.wikimedia.org/r/mediawiki/core
# ...or OOJS (or another repo of your choosing).
git clone https://gerrit.wikimedia.org/r/oojs/core

# Get the JSDoc theme
git clone https://gerrit.wikimedia.org/r/jsdoc/wmf-theme
cd wmf-theme
npm install
cd ..
```

#### Point to your local theme
In your local repository that uses JSDoc, edit the JSDoc config file (either `jsdoc.json` or
`.jsdoc.json`):

- Change the template to `../wmf-theme`.
- Change the plugins to point to `../wmf-theme`. For example, for the default plugin set, use `../wmf-theme/plugins/default`.

#### Edit defaultPlugins.json
In your local wmf-theme repository, edit defaultPlugins.json to point to the local plugins.

- For theme plugins, replace `node_modules/jsdoc-wmf-theme/` with `../wmf-theme/`.
- For third-party plugins, replace `node_modules/` with `../wmf-theme/node_modules/`.
- JSDoc plugins (starting with `plugins/`) can remain unchanged.

#### Build and view your local docs
Build the docs in your test repo and view the generated site in the browser. E.g. for MediaWiki
core, run `npm run doc` in the root of the core repository. Then find the full path to your local
`index.html` file, e.g. `file://path-to-local-mediawiki-core/docs/js/index.html`, and open it in a
browser.

### Writing styles
This theme uses [Codex design tokens](https://doc.wikimedia.org/codex/latest/design-tokens/overview.html)
for CSS values. View the Codex docs to see all of the tokens available for use as CSS custom
properties.

## Thanks
Thanks to:
- The [default JSDoc theme](https://github.com/jsdoc3/jsdoc)
- The [Wikimedia User Interface Style Guide](https://wikimedia.github.io/WikimediaUI-Style-Guide/),
  on which this theme was originally based

## License
Licensed under [the Apache License, version 2.0](LICENSE.md).
