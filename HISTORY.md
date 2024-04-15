# Release History

## jsdoc-wmf-theme 1.0.0 (2024-04-16)

* styles: Remove line separation from source files (apaskulin)
* titles: Remove parameters (apaskulin)
* templates: Use sentence case for detail fields (apaskulin)
* tables: Add horizontal scroll (Anne Tomasevich)
* headings: Remove optional indicator (apaskulin)
* headings: Style properties heading for subparameters (apaskulin)
* styles: Increase margin for h2 headings in Markdown descriptions (apaskulin)
* styles: Style code captions like regular text (apaskulin)
* Limit classes and namespaces to top level functions (Jon Robson)
* Add breadcrumb navigation (Jon Robson)
* Support generation of site map (Jon Robson)
* Support the creation of custom pages for top level nav items (Jon Robson)
* styles: Fix inconsistent margin in definition lists (apaskulin)
* plugins: Move plugin from Core (apaskulin)
* styles: Reduce padding-left/right on `<pre>` to fix apparent indentation (Timo Tijhof)
* search: Strip anchor elements from search results (Anne Tomasevich)
* templates: Simplify attributes (apaskulin)
* content: Prevent long words from overflowing their containers (Anne Tomasevich)
* build: Clarify error message and link to docs (apaskulin)
* templates: Consistent page organization (apaskulin)
* styles: Add styles to sitemap (apaskulin)
* layout: Remove links from titles in favor of breadcrumbs (apaskulin)
* publish: Simplify sitemap items (apaskulin)
* templates: Fix typo (apaskulin)
* template: Better handling for incorrect @classdesc tags (apaskulin)
* plugins: Fork summarize plugin from JSDoc (apaskulin)
* templates: Handle class-description summaries (apaskulin)
* templates: Remove source link from main page description (apaskulin)

—
* plugins: Set up plugins directory (apaskulin)
* Delete dead code block (Jon Robson)
* docs: Update README (apaskulin)

## jsdoc-wmf-theme 0.0.13 (2024-03-04)

* Fix hash navigation for non-existing elements (Derk-Jan Hartman)
* Introduce separate CSS style for visited links (Kamil Bach)
* Flag globals to stop them appearing in search results (Jon Robson)
* templates: Remove duplicate summary on module pages (apaskulin)
* css: Separate class used in displaying source files (apaskulin)
* Make the sidebar scrollable (Kamil Bach)
* Guard against creation of global.html (Jon Robson)
* Ensure proper scroll position for anchor links (Anne Tomasevich)
* templates: Display examples in class description (apaskulin)
* css: Use link styles for links in titles (apaskulin)
* nav: Add scroll to mobile nav menu (Anne Tomasevich)

—
* build: Update package-lock with npm audit --fix results (James D. Forrester)
* db: Replace TaffyDB with Salty (apaskulin)

## jsdoc-wmf-theme 0.0.12 (2024-01-25)

* Ensure prettify is copied from the template (Derk-Jan Hartman)
* styles: Use paragraph font size for introductions (apaskulin)
* templates: Add clickable anchors for members and methods (apaskulin)

## jsdoc-wmf-theme 0.0.11 (2023-12-19)

—
* Fix path to Codex and normalize.css (Roan Kattouw)
* docs: Add release instructions (apaskulin)

## jsdoc-wmf-theme 0.0.10 (2023-12-18)
* styles: Reorganize existing styles (Anne Tomasevich)
* Remove WikimediaUI-Style-Guide and add Codex tokens (Anne Tomasevich)
* Include styles from the style guide repository (Anne Tomasevich)
* Use Codex tokens throughout custom code (Anne Tomasevich)
* Make attributes (static, protected) more visually distinct (Anne Tomasevich)
* Improve toggle-box markup and design (Anne Tomasevich)
* Styles: Small typographic improvements (Eric Gardner)
* js: Add redirect.js (Eric Gardner)
* Refactor and restyle the header and menu; fix search (Anne Tomasevich)
* search: Exclude members of "anonymous" items from search index (Eric Gardner)
* Refactor headings and site title (Anne Tomasevich)

—
* Update README with contributing info (Anne Tomasevich)

## jsdoc-wmf-theme 0.0.9 (2023-12-07)
* Make properties tables of objects look like wikitables (Derk-Jan Hartman)
* Remove ... when summary is missing (Derk-Jan Hartman)
* Move JSDoc examples to be directly after the description. (Derk-Jan Hartman)
* Remove unnecessary heading margins (Derk-Jan Hartman)
* Style module description consistently with class description (Jon Robson)
* Remove message filters (Jon Robson)
* Improve spacing of members (properties and methods) (Roan Kattouw)
* ui: Use longname instead of name for constructors (Roan Kattouw)
* ui: Change Members subheading to Properties (apaskulin)
* ui: Use alias instead of name for header (when it exists) (Roan Kattouw)

—
* Only publish the required resources (Derk-Jan Hartman)
* Fix typo in publish.js (Ed Sanders)
* build: Move client libraries to /lib to simplify eslint config (Ed Sanders)
* build: Improve linter config, fix linting errors (Ed Sanders)
* build: git-ignore .DS_Store files (Anne Tomasevich)


## jsdoc-wmf-theme 0.0.8 (2023-08-23)
* Bump WikimediaUI-Style-Guide submodule from 2020 to 2023 (James D. Forrester)

## jsdoc-wmf-theme 0.0.7 (2023-08-23)
* Some minor search improvements (TheDJ)

—
* build: Update linters (Ed Sanders)

## jsdoc-wmf-theme 0.0.6 (2023-05-25)
* Make search results scrollable (Ed Sanders)
* Fix typo in search code that was causing it to be mostly broken (Ed Sanders)
* Don't perform search on an empty term (Ed Sanders)
* Truncate search results for performance (Ed Sanders)
* Add "wikitable" styling to params table (Ed Sanders)
* Allow Object args in generic types (Jon Robson)

—
* docs: Shorten and rewrite HISTORY.md changelog (Timo Tijhof)

## jsdoc-wmf-theme 0.0.5 (2022-02-08)
* Support generic types with arguments (Bernard Wang)
* Add code of conduct (C. Scott Ananian)

## jsdoc-wmf-theme 0.0.4 (2020-10-07)
* Add visibility and return tags to "event" blocks (Prateek Saxena) [T214101](https://phabricator.wikimedia.org/T214101)
* Bump WikimediaUI-Style-Guide submodule to be less old (James D. Forrester)

## jsdoc-wmf-theme 0.0.3 (2019-07-15)
* Add expanding of member description by default for current hash fragment target (Prateek Saxena)
* Add Lunr-based site search (Prateek Saxena) [T187672](https://phabricator.wikimedia.org/T187672)
* Add toggle buttons for method visibility types (Prateek Saxena) [T187672](https://phabricator.wikimedia.org/T187672)
* Change page title capitalizing of class names (Prateek Saxena)
* Change page title order (arcayn) [T207380](https://phabricator.wikimedia.org/T207380)
* Change page title delimiter from ":" to "/". (Mogmog123) [T207379](https://phabricator.wikimedia.org/T207379)
* Change colors and fonts to latest WikimediaUI Base (Volker E.) [T209562](https://phabricator.wikimedia.org/T209562)
* Fix inaccessible UI above headings due to padding hack (Prateek Saxena)
* Remove broken link on `Mixed` param type (arcayn) [T206734](https://phabricator.wikimedia.org/T206734)
* Remove redundant `Class:` page heading (stibba) [T207381](https://phabricator.wikimedia.org/T207381)

## jsdoc-wmf-theme 0.0.2 (2018-07-13)
* Improve overall design (Prateek Saxena)
* Add sticky header and sidebar (Prateek Saxena)
* Change class constructor to expand description by default (Prateek Saxena)
* Change `<pre` to break sentences (Prateek Saxena)

## jsdoc-wmf-theme 0.0.1 (2018-02-23)
* Initial version, forked from the JSDoc3 default template. (C. Scott Ananian)
* Adopt Wikimedia Design Style Guide. (C. Scott Ananian)
* Add automatic linking of Phabricator tasks. (C. Scott Ananian)
* Add support for `~Class` as synonym for "Class, in my same module" (C. Scott Ananian)
