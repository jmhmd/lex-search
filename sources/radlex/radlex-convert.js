const through2 = require('through2');
const csv2 = require('csv2');
const fs = require('fs');

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


function getRID (string) {
  return string.substring(string.indexOf('#RID') + 1);
}

const readStream = fs.createReadStream(__dirname + '/RADLEX 3.13.1.csv')
  .pipe(csv2())
  .pipe(through2.obj(function (chunk, enc, callback) {

    if (j === 0) {
      for (p in cols) {
        cols[p].index = chunk.indexOf(cols[p].header);
      }
      j++;
      return callback();
    }

    const addElement = (element) => {
      if (j === 1) {
        this.push('[');
        j++;
      } else {
        this.push(',');
      }

      const el = {
        i: getRID(element[cols.id.index]),
        d: element[cols.preferred.index],
      }

      if (element[cols.synonyms.index]) {
        el.n = element[cols.synonyms.index].split('|');
      }

      this.push(JSON.stringify(el));
    }

    addElement(chunk);
    this.push('\n');
    callback();
  }))
  .on('end', function () {
    fs.appendFile(__dirname + '/radlex.json', ']');
  })
  .pipe(fs.createWriteStream(__dirname + '/radlex.json'));
