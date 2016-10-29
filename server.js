const fs = require('fs');
const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');

/*
CORS
*/
const whitelist = [
  'http://localhost:8080',
  'http://pacsbin.com',
  'https://pacsbin.com',
  'http://dev.pacsbin.com',
  'https://dev.pacsbin.com',
];
const corsOptions = {
  origin: (origin, callback) => {
    const originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
  },
};

/*
Set up lunr
 */
console.info('Load indices...');
const lunr = require('lunr');
const indices = {
  icd10: lunr.Index.load(JSON.parse(fs.readFileSync('./lunr_index/icd10_index.json'))),
  radlex: lunr.Index.load(JSON.parse(fs.readFileSync('./lunr_index/radlex_index.json'))),
  combined: lunr.Index.load(JSON.parse(fs.readFileSync('./lunr_index/combined_index.json'))),
};
console.info('...done');

/*
Set up lexicons
 */
console.info('Load lexicons...');
const lexicons = {
  icd10: JSON.parse(fs.readFileSync('./sources/icd10/icd10.json')),
  radlex: JSON.parse(fs.readFileSync('./sources/radlex/radlex.json')),
};
let combined = [];
Object.keys(lexicons).forEach((key) => {
  combined = combined.concat(lexicons[key]);
});
lexicons.combined = combined;
console.info('...done');

/*
Config
 */
const resultLimit = 20;
app.use(morgan('short'));

/*
Routes
 */
app.use(express.static('public'));

app.get('/search', (req, res) => {
  const query = req.query.q;
  const lexicon = req.query.l || 'combined';

  if (!query) {
    return res.status(400).send('Query string required');
  }

  const start = new Date();

  const result = indices[lexicon].search(query).slice(0, resultLimit);
  const fullResult = {
    result: result.map((r) => ({
      doc: lexicons[lexicon][r.ref],
      score: r.score,
    })),
    lexicon,
    perf: {
      numSearched: lexicons[lexicon].length,
      milliseconds: new Date() - start,
    },
  };
  return res.send(fullResult);
});

app.get('/prefetch', (req, res) => {
  /* eslint no-unused-vars: 0 */
  const lexicon = req.query.l || 'combined';
  // use lexicon query string to return default
  // prepopulated suggestions, like maybe most popular
  // or most common.
  return res.send([]);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Lex-search server listening on port ${port}`);
});
