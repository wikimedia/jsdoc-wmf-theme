# jsdoc-wmf-theme

A theme for JSDoc 3 conforming to the Codex design system. Forked from the
default template for JSDoc 3, which uses [the Taffy Database library](http://taffydb.com/)
and the [Underscore Template library](http://underscorejs.org/).

## Example
See https://doc.wikimedia.org/Parsoid/master/ for a sample demo. :rocket:

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

### Options
This theme supports the following options:
```
"templates": {
    "wmf": {
        "maintitle": [string, overrides name from package.json],
        "repository": [string, overrides repo from package.json],
        "hideSections": ["Events"…]
        // This could include Modules, Externals, Namespaces, Classes,
        // Interfaces, Events, Mixins, and Tutorials. The sections added
        // here will not be shown in the sidebar.
    }
}
```
Place them anywhere inside your `jsdoc.json` file.

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
git clone ssh://yourUserName@gerrit.wikimedia.org:29418/mediawiki/core
# ...or OOJS (or another repo of your choosing).
git clone ssh://yourUserName@gerrit.wikimedia.org:29418/oojs/core

# Get the JSDoc theme
git clone --recurse-submodules ssh://yourUserName@gerrit.wikimedia.org:29418/jsdoc/wmf-theme
cd wmf-theme
npm install
cd ..
```

#### Point to your local theme
In your local repository that uses JSDoc, edit the JSDoc config file (either `jsdoc.js` or
`.jsdoc.json`) and change the template to `../wmf-theme`.

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
