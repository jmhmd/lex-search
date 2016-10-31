const through2 = require('through2');
const split2 = require('split2');
const fs = require('fs');

let j = 0;
let k = 0;

const inFile = `${__dirname}/icd10.json.intermediate1`;
const outFile = `${__dirname}/icd10.json`;

const readStream = fs.createReadStream(inFile)
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
      };
      for (const p in element) {
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
    };

    function handleChild(child) {
      if (child.diag) {
        if (Array.isArray(child.diag) && child.diag.length > 0) {
          walkChildren(child.diag);
        } else {
          handleChild(child.diag);
        }
      }
      if (child.name && child.desc) {
        addElement(child);
      }
    }

    function walkChildren(children) {
      for (let i = 0; i < children.length; i++) {
        handleChild(children[i]);
      }
    }

    handleChild(chunk);
    callback();
  }))
  .on('end', () => {
    fs.appendFile(outFile, ']');
  })
  .pipe(fs.createWriteStream(outFile));
