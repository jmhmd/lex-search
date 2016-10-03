const fs = require('fs');
const lunr = require('lunr');

const lexicons = {
  icd10: JSON.parse(fs.readFileSync(__dirname + '/sources/icd10/icd10.json')),
  radlex: JSON.parse(fs.readFileSync(__dirname + '/sources/radlex/radlex.json')),
};
let combinedLexicons = [];
for (key in lexicons) {
  combinedLexicons = combinedLexicons.concat(lexicons[key]);
}
lexicons.combined = combinedLexicons;

for (lexicon in lexicons) {
  const lunrIndex = lunr(function () {
    this.field('i')
    this.field('d', { boost: 2 })
    this.field('n')
  });

  console.log(`building ${lexicon} index...`);

  lexicons[lexicon].forEach((entry, i) => {
    lunrIndex.add({
      id: i,
      i: entry.i,
      d: entry.d,
      n: entry.n ? entry.n.join(' ') : '',
    });
  });

  console.log('...done');

  console.log(`serializing and saving ${lexicon} index...`);
  fs.writeFileSync(`${__dirname}/lunr_index/${lexicon}_index.json`, JSON.stringify(lunrIndex.toJSON()));
  console.log('...done');
}
