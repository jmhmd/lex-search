/* eslint no_underscore_dangle:0 */

const fs = require('fs');
const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const elasticsearch = require('elasticsearch');

const esHost = 'localhost:9200';
const esClient = new elasticsearch.Client({
  host: esHost,
});
console.log(`Using elasticsearch host ${esHost}`);

/*
CORS
*/
/* const whitelist = [
  'http://localhost:8080',
  'http://pacsbin.com',
  'https://pacsbin.com',
  'http://dev.pacsbin.com',
  'https://dev.pacsbin.com',
];
const corsOptions = {
  origin: (origin, callback) => {
    const originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    console.log('cors check', origin, originIsWhitelisted);
    return callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
  },
};*/
app.use(cors());

/*
Config
 */
const resultLimit = 20;
app.use(morgan('short'));

/*
Lexicon Stats
*/
console.log('Calculate lexicon sizes...');
const lexiconSizes = {
  icd10: JSON.parse(fs.readFileSync(`${__dirname}/sources/icd10/icd10.json`)).length,
  radlex: JSON.parse(fs.readFileSync(`${__dirname}/sources/radlex/radlex.json`)).length,
};
console.log('...done');
console.log(lexiconSizes);

/*
Routes
 */
app.use(express.static('public'));

app.get('/search', (req, res) => {
  const query = req.query.q;
  const combinedLexicon = 'icd10, radlex';
  let lexicon = req.query.l;

  if (!query) {
    return res.status(400).send('Query string required');
  } else if (lexicon && ['icd10', 'radlex'].indexOf(lexicon) === -1) {
    return res.status(400).send('Requested lexicon is not available');
  }

  lexicon = lexicon || combinedLexicon;

  esClient.search(
    {
      index: lexicon,
      body: {
        query: {
          multi_match: {
            query,
            fields: ['description^2', 'notes'],
            type: 'phrase_prefix',
            slop: 10,
            max_expansions: 50,
          },
        },
        size: resultLimit,
      },
    },
    (err, searchResult) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error searching lexicons.');
      }
      const fullResult = {
        result: searchResult.hits.hits.map(hit => ({
          doc: {
            i: hit._source.lexID,
            d: hit._source.description,
            n: hit._source.notes,
          },
          lexicon: hit._index,
          score: hit._score,
        })),
        lexicon,
        perf: {
          numSearched: lexicon.split(',').reduce((prev, name) => prev + lexiconSizes[name], 0),
          milliseconds: searchResult.took,
        },
        query,
      };
      return res.send(fullResult);
    }
  );
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
