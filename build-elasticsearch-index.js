const fs = require('fs');
const async = require('async');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  host: 'es.lex.orionmd.com',
  // log: 'trace',
});

const lexicons = {
  icd10: JSON.parse(fs.readFileSync(__dirname + '/sources/icd10/icd10.json')),
  // radlex: JSON.parse(fs.readFileSync(__dirname + '/sources/radlex/radlex.json')),
};

async.eachOfSeries(lexicons, (lexiconDocs, lexiconName, cb) => {
  // delete current index
  client.indices.delete({
    index: lexiconName,
  }, (delErr) => {
    if (delErr) { return cb(delErr); }
    console.log(`deleted index ${lexiconName}`);

    async.eachOf(lexiconDocs, (entry, key, cb2) => {
      client.create({
        index: lexiconName,
        type: 'lexicon-entry',
        id: key,
        body: {
          lexID: entry.i,
          description: entry.d,
          notes: entry.n ? entry.n.join(' ') : '',
        },
      }, (err) => {
        console.log(`Added entry ${entry.i}: ${key} of ${lexiconDocs.length}`);
        cb2(err);
      });
    }, (err) => {
      console.log(`finished importing lexicon ${lexiconName}`);
      return cb(err);
    });
  });
}, (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log('finished importing all lexicons');
  }
});
