const through2 = require('through2');
const fs = require('fs');

/*
Using csvtojson package better handles dirty csv, i.e. newlines in quoted
fields, which are present in the radlex csv and the csv2 package does not
correctly handle.
 */
const Converter = require('csvtojson').Converter;
const csvConverter = new Converter({ constructResult: false });

let j = 0;

const cols = {
  id: {
    header: 'Class ID',
    index: null,
  },
  preferred: {
    header: 'Preferred Label',
    index: null,
  },
  synonyms: {
    header: 'Synonym',
    index: null,
  },
  status: {
    header: 'Term_Status',
    index: null,
  },
};

const inFile = `${__dirname}/RADLEX 3.13.1.csv`;
const outFile = `${__dirname}/radlex.json`;

function getRID(string) {
  return string.substring(string.indexOf('#RID') + 1);
}

const readStream = fs.createReadStream(inFile)
  // .pipe(csv2())
  .pipe(csvConverter)
  .pipe(through2(function (chunk, enc, callback) {
    chunk = JSON.parse(chunk.toString());

    const addElement = (element) => {
      if (j === 0) {
        this.push('[');
      } else {
        this.push(',');
      }
      j++;

      const el = {
        i: getRID(element[cols.id.header]),
        d: element[cols.preferred.header],
      };

      if (element[cols.synonyms.header]) {
        el.n = element[cols.synonyms.header].split('|');
      }

      this.push(JSON.stringify(el));
    };

    addElement(chunk);
    // this.push('\n');
    callback();
  }))
  .on('end', function () {
    fs.appendFile(outFile, ']');
  })
  .pipe(fs.createWriteStream(outFile));
