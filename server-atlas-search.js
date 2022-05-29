/* eslint no_underscore_dangle:0 */
require("dotenv").config();
const fs = require("fs");
const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require("cors");

const uri = `mongodb+srv://${process.env.MONGO_ATLAS_USER}:${encodeURIComponent(
  process.env.MONGO_ATLAS_PASSWORD
)}@lexsearchcluster0.0c3ig.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

app.use(cors());

/*
Config
 */
const resultLimit = 20;
app.use(morgan("short"));

/*
Lexicon Stats
*/
console.log("Calculate lexicon sizes...");
const lexiconSizes = {
  icd10: JSON.parse(fs.readFileSync(`${__dirname}/sources/icd10/icd10.json`))
    .length,
  radlex: JSON.parse(fs.readFileSync(`${__dirname}/sources/radlex/radlex.json`))
    .length,
};
lexiconSizes.all = Object.values(lexiconSizes).reduce(
  (total, size) => total + size,
  0
);
console.log("...done");
console.log(lexiconSizes);

/*
Routes
 */
app.use(express.static("public"));

app.get("/search", async (req, res) => {
  const lexDocumentCollection = client.db("lexicons").collection("documents");
  const { q: query, l: lexicon } = req.query;

  if (!query) {
    return res.status(400).send("Query string required");
  } else if (lexicon && ["icd10", "radlex"].indexOf(lexicon) === -1) {
    return res.status(400).send("Requested lexicon is not available");
  }

  const lexiconToSearch = lexicon || "all";

  let searchObject = {
    index: "all-documents",
    compound: {
      should: [
        // {
        //   autocomplete: {
        //     query,
        //     path: "description",
        //     fuzzy: {},
        //     score: {
        //       boost: {
        //         value: 100,
        //       },
        //     },
        //   },
        // },
        {
          text: {
            query,
            path: "description",
            fuzzy: {},
            score: { boost: { value: 10 } },
          },
        },
        {
          text: {
            query,
            path: "notes",
            fuzzy: {},
          },
        },
      ],
    },
  };

  if (lexiconToSearch !== "all") {
    searchObject.compound.filter = [
      {
        text: {
          path: "lexicon",
          query: lexiconToSearch,
        },
      },
    ];
  }

  try {
    const startTime = performance.now();
    const result = await lexDocumentCollection
      .aggregate([
        {
          $search: searchObject,
        },
        {
          $limit: resultLimit,
        },
        {
          $project: {
            lexID: 1,
            description: 1,
            notes: 1,
            lexicon: 1,
            score: { $meta: "searchScore" },
          },
        },
        {
          $match: {
            score: { $gt: 0 },
          },
        },
      ])
      .toArray();
    const endTime = performance.now();

    const fullResult = {
      result: result.map((hit) => ({
        doc: {
          i: hit.lexID,
          d: hit.description,
          n: hit.notes,
        },
        lexicon: hit.lexicon,
        score: hit.score,
      })),
      lexicon: lexiconToSearch,
      perf: {
        numSearched: lexiconSizes[lexiconToSearch],
        milliseconds: endTime - startTime,
      },
      query,
    };
    return res.send(fullResult);
  } catch (err) {
    console.error(err);
    return res.status(500).send("There was an error processing the query.");
  }
});

app.get("/prefetch", (req, res) => {
  /* eslint no-unused-vars: 0 */
  const lexicon = req.query.l || "combined";
  // use lexicon query string to return default
  // prepopulated suggestions, like maybe most popular
  // or most common.
  return res.send([]);
});

const port = process.env.PORT || 3000;
client.connect(async (err) => {
  if (err) {
    console.error(err);
  }
  app.listen(port, () => {
    console.log(`Lex-search server listening on port ${port}`);
  });
});
