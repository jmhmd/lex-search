const fs = require('fs');
const express = require('express');
const app = express();

/*
Set up lunr
 */
const lunr = require('lunr');
const indices = {
  icd10: lunr.Index.load(JSON.parse(fs.readFileSync('./lunr_index/icd10_index.json'))),
  radlex: lunr.Index.load(JSON.parse(fs.readFileSync('./lunr_index/radlex_index.json'))),
  combined: lunr.Index.load(JSON.parse(fs.readFileSync('./lunr_index/combined_index.json'))),
}

/*
Set up lexicons
 */
const lexicons = {
  icd10: JSON.parse(fs.readFileSync('./sources/icd10/icd10.json')),
  radlex: JSON.parse(fs.readFileSync('./sources/radlex/radlex.json')),
};
let combinedLexicons = [];
for (key in lexicons) {
  combinedLexicons = combinedLexicons.concat(lexicons[key]);
}
lexicons.combined = combinedLexicons;

/*
Config
 */
const resultLimit = 20;

/*
Routes
 */
app.use(express.static('public'));

app.get('/search', function (req, res) {
  const query = req.query.q;
  const lexicon = req.query.l || 'combined';

  const result = indices[lexicon].search(query).slice(0, resultLimit);
  const fullResult = {
    result: result.map((r) => {
      return {
        doc: lexicons[lexicon][r.ref],
        score: r.score,
      }
    }),
    lexicon
  };
  return res.send(fullResult);
});

app.get('/prefetch', function (req, res) {
  const lexicon = req.query.l || 'combined';
  return res.send([]);
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
