#!/usr/bin/node
let fs = require('fs');
let path = require('path');
let PACKAGEPATH = path.join(__dirname, '..', 'package.json');
let PACKAGELOCKPATH = path.join(__dirname, '..', 'package-lock.json');

for (const pkgpath of [ PACKAGEPATH, PACKAGELOCKPATH ] ) {
    let package = require(pkgpath);
    if (!/\+git$/.test(package.version)) {
        package.version += '+git';
        fs.writeFileSync(pkgpath, JSON.stringify(package, null, 2)+'\n', 'utf8');
    }
}
