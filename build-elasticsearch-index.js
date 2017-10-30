const fs = require('fs');
const async = require('async');
const elasticsearch = require('elasticsearch');
const log = require('single-line-log').stdout;
const client = new elasticsearch.Client({
  // host: 'localhost:9200',
  host: 'https://search-lex-search-u63ythgk42vuqzggcvbukznzqa.us-east-2.es.amazonaws.com/',
});

const resetIndex = false;
const bulk = true;

const lexicons = {
  icd10: JSON.parse(fs.readFileSync(__dirname + '/sources/icd10/icd10.json')),
  // radlex: JSON.parse(fs.readFileSync(__dirname + '/sources/radlex/radlex.json')),
};

const buildIndexSequentially = function(params, cb) {
  const { lexiconDocs, lexiconName } = params;

  async.eachOfSeries(
    lexiconDocs,
    (entry, key, cb2) => {
      client.index(
        {
          index: lexiconName,
          type: 'lexicon-entry',
          // opType: 'create',
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
};

const bulkUpdate = (params, cb) => {
  const { lexiconDocs, lexiconName } = params;

  let updateObjects = [];
  lexiconDocs.forEach((entry, key) => {
    updateObjects.push({
      index: {
        _index: lexiconName,
        _type: 'lexicon-entry',
        _id: key,
      },
    });
    updateObjects.push({
      lexID: entry.i,
      description: entry.d,
      notes: entry.n ? entry.n.join(' ') : '',
    });
  });

  client.bulk(
    {
      body: updateObjects,
    },
    (err, res) => {
      if (err) {
        return cb(err);
      }
      console.log(`finished bulk importing lexicon ${lexiconName}`);
      return cb();
    }
  );
};

const buildIndex = bulk ? bulkUpdate : buildIndexSequentially;

async.eachOfSeries(
  lexicons,
  (lexiconDocs, lexiconName, cb) => {
    client.indices.exists({ index: lexiconName }, (err, exists) => {
      if (err) {
        return cb(err);
      }
      if (exists && resetIndex) {
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
            client.indices.create(
              {
                index: lexiconName,
              },
              err => {
                if (err) {
                  return cb(err);
                }
                return buildIndex({ lexiconDocs, lexiconName }, cb);
              }
            );
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
