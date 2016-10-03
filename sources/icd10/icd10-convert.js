const through2 = require('through2');
const split2 = require('split2');
const fs = require('fs');

let j = 0;

const readStream = fs.createReadStream(__dirname + '/icd10.json.intermediate1')
  .pipe(split2())
  .pipe(through2(function (chunk, enc, callback) {
    chunk = JSON.parse(chunk.toString());

    const addElement = (element) => {
      if (j === 0) {
        this.push('[');
        j++;
      } else {
        this.push(',');
      }
      const el = {
        i: element.name,
        d: element.desc,
      }
      for (p in element) {
        // if (['name', 'desc', 'excludes1', 'excludes2'].indexOf(p) === -1) {
        if (p === 'inclusionTerm' && element[p].note) {
          if (typeof element[p].note === 'string') {
            el.n = [element[p].note];
          } else if (Array.isArray(element[p].note)) {
            el.n = element[p].note;
          }
        }
      }

      this.push(JSON.stringify(el));
    }

    function handleChild (child) {
      if (child.diag && child.diag.length > 0) {
        walkChildren(child.diag);
      }
      addElement(child);
    }

    function walkChildren (childArray) {
      for (let i = 0; i < childArray.length; i++) {
        handleChild(childArray[i]);
      }
    }

    handleChild(chunk);
    this.push('\n');
    callback();
  }))
  .on('end', function () {
    fs.appendFile(__dirname + '/icd10.json', ']');
  })
  .pipe(fs.createWriteStream(__dirname + '/icd10.json'));
