# jsdoc-wmf-theme

A theme for JSDoc 3 conforming to the Wikimedia Design Style Guide.  Forked from
the default template for JSDoc 3, which uses
[the Taffy Database library](http://taffydb.com/) and the
[Underscore Template library](http://underscorejs.org/).

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

## Options
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

## Thanks
Thanks to the [default JSDoc theme](https://github.com/jsdoc3/jsdoc)
and to the
[Wikimedia User Interface Style Guide](https://wikimedia.github.io/WikimediaUI-Style-Guide/).

## License
Licensed under [the Apache License, version 2.0](LICENSE.md).
