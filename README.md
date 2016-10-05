# lex-search
Fast search of standardized lexicons like ICD10 and Radlex, using Twitter typeahead.js and lunr.js

## Install
Clone the repository, then in the repo directory:

`npm install`

`npm install -g webpack`

`npm run build`

`npm start`

Go to `localhost:3000`

## Building
For development, use

`npm run watch`

This will use the development version of React, and watch for changes.

For prodution, use

`npm run build`

which just adds the NODE_ENV=production flag to the build, which builds the production version of React,
which is smaller and with fewer warnings.

## Sources
Two lexicons are currently included, ICD-10 and Radlex, the radiology lexicon.

The original source documents are parsed using the included scripts into JSON with the following format:
```js
[
  {
    "i": String, // Unique string identifier, i.e. id of element in lexicon
    "d": String, // Description of the element, i.e. the common name
    "n": Array, // ["extra notes", "or alternative phrases", "will also be indexed for search"]
  },
  {...}
]
```
The lunr index is pre-built with `node build-lunr-index.js`