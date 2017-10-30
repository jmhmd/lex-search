const fs = require('fs');
const async = require('async');
const elasticsearch = require('elasticsearch');
const log = require('single-line-log').stdout;
const client = new elasticsearch.Client({
  host: 'localhost:9200',
});

const lexicons = {
  icd10: JSON.parse(fs.readFileSync(__dirname + '/sources/icd10/icd10.json')),
  radlex: JSON.parse(fs.readFileSync(__dirname + '/sources/radlex/radlex.json')),
};

const buildIndex = function(params, cb) {
  const { lexiconDocs, lexiconName } = params;
  client.indices.create(
    {
      index: lexiconName,
    },
    err => {
      if (err) { return cb(err); }

      async.eachOfSeries(
        lexiconDocs,
        (entry, key, cb2) => {
          client.index(
            {
              index: lexiconName,
              type: 'lexicon-entry',
              id: key,
              body: {
                lexID: entry.i,
                description: entry.d,
                notes: entry.n ? entry.n.join(' ') : '',
              },
            },
            err => {
              log(`Added entry ${entry.i}\n${key} of ${lexiconDocs.length}`);
              cb2(err);
            }
          );
        },
        err => {
          console.log(`finished importing lexicon ${lexiconName}`);
          return cb(err);
        }
      );
    }
  );
};

async.eachOfSeries(
  lexicons,
  (lexiconDocs, lexiconName, cb) => {
    client.indices.exists({ index: lexiconName }, (err, exists) => {
      if (err) {
        return cb(err);
      }
      if (exists) {
        // delete current index
        client.indices.delete(
          {
            index: lexiconName,
          },
          delErr => {
            if (delErr) {
              return cb(delErr);
            }
            console.log(`deleted index ${lexiconName}`);
            return buildIndex({ lexiconDocs, lexiconName }, cb);
          }
        );
      } else {
        return buildIndex({ lexiconDocs, lexiconName }, cb);
      }
    });
  },
  err => {
    if (err) {
      console.error(err);
    } else {
      console.log('finished importing all lexicons');
    }
  }
);
