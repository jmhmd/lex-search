require('dotenv').config()
const fs = require("fs");
const { MongoClient, ServerApiVersion } = require("mongodb");
const log = require("single-line-log").stdout;

const lexicons = {
  icd10: JSON.parse(fs.readFileSync(__dirname + "/sources/icd10/icd10.json")),
  radlex: JSON.parse(
    fs.readFileSync(__dirname + "/sources/radlex/radlex.json")
  ),
};
const allDocumentObjects = [];
for (lexicon in lexicons) {
  for (entry of lexicons[lexicon]) {
    allDocumentObjects.push({
      lexicon,
      lexID: entry.i,
      description: entry.d,
      notes: entry.n ? entry.n.join(" ") : "",
    });
  }
}
console.log("Adding ", allDocumentObjects.length, " documents");

const uri = `mongodb+srv://${process.env.MONGO_ATLAS_USER}:${encodeURIComponent(process.env.MONGO_ATLAS_PASSWORD)}@lexsearchcluster0.0c3ig.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
client.connect(async (err) => {
  const lexDocumentCollection = client.db("lexicons").collection("documents");

  const insertResponse = await lexDocumentCollection.insertMany(
    allDocumentObjects
  );

  console.log("Inserted: ", insertResponse);

  console.log("Finished importing all");
  client.close();
});
