# Releasing a new version of JSDoc WMF theme

This page provides instructions for releasing a new version of the JSDoc WMF theme.

## First time setup

1. [Create an NPM account](https://www.npmjs.com/signup), if you don't have one already.
2. Verify that you can [log into your NPM account](https://www.npmjs.com/login).
3. Verify that you are listed as a collaborator on the [jsdoc-wmf-theme package](https://www.npmjs.com/package/jsdoc-wmf-theme). If not, ask an existing collaborator to add you.
4. Make sure that you have two-factor authentication (2FA) set up.
5. Run `npm login` and follow the steps. You should only need to do this once on each computer.
  If you're not sure if you've already done this, you can run `npm whoami`; if it prints your
  NPM username, you're already logged in.

## Submit a release patch

Make sure you have the latest version of the theme repository locally, and create a patch ([example](https://gerrit.wikimedia.org/r/c/jsdoc/wmf-theme/+/981410)) with these changes:

### 1. Add release notes to HISTORY.md.

You can automatically generate a list of commit messages since the previous release using this command:

```
# Replace X.X.X with the previous release's version number
git log vX.X.X.. --reverse --no-merges --format="* %s (%aN)"
```

Copy the output into HISTORY.md as a bulleted list under a new heading with the version number and the date. Move any commits that only impact the internal workings of the theme (such as build changes) to below an em dash (—).

### 2. Update package.json

Update the `version` in package.json with the new version number.

### 3. Update package-lock.json

Run `npm install` to update package-lock.json.

Commit these changes, submit the patch, and ask a maintainer to +2 it.

## Publish the package

Once the release patch has been merged, follow these steps to publish the new version to the npm Registry:

1. Make sure you have the latest version of the theme repository, and verify that the release commit is the latest.

2. Create a tag for the release, and verify that the new tag appears in the [repository](https://gerrit.wikimedia.org/r/plugins/gitiles/jsdoc/wmf-theme/).

```
# Replace X.X.X with the new version number
git tag vX.X.X
git push --tags origin
```

3. Publish the package to npm, and verify that the new release appears on the [npm Registry](https://www.npmjs.com/package/jsdoc-wmf-theme).

```
npm publish
```

## Update MediaWiki core and other consumers

Once you've completed the release, you can follow these steps to update the package version used by other projects, such as MediaWiki core.

1. Update `jsdoc-wmf-theme` in package.json with the new version number.
2. Run `npm install` to update package-lock.json. Inspect the resulting diff to make sure the changes are as expected.
3. Run `npm run doc` to verify that the docs generate as expected.
4. Commit the changes to package.json and package-lock.json, and submit the patch ([example](https://gerrit.wikimedia.org/r/c/mediawiki/core/+/981414)).
