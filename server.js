const fs = require('fs');
const express = require('express');
const app = express();
const morgan = require('morgan');

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
let combinedLexicons = [];
for (key in lexicons) {
  combinedLexicons = combinedLexicons.concat(lexicons[key]);
}
lexicons.combined = combinedLexicons;
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

app.get('/search', function (req, res) {
  const query = req.query.q;
  const lexicon = req.query.l || 'combined';

  const start = new Date();

  const result = indices[lexicon].search(query).slice(0, resultLimit);
  const fullResult = {
    result: result.map((r) => {
      return {
        doc: lexicons[lexicon][r.ref],
        score: r.score,
      }
    }),
    lexicon,
    perf: {
      numSearched: lexicons[lexicon].length,
      milliseconds: new Date() - start,
    }
  };
  return res.send(fullResult);
});

app.get('/prefetch', function (req, res) {
  const lexicon = req.query.l || 'combined';
  return res.send([]);
})

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log(`Lex-search server listening on port ${port}`);
});
