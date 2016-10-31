var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'es.lex.orionmd.com',
  log: 'trace',
});

client.ping({
  requestTimeout: 5000,

  // undocumented params are appended to the query string
  hello: 'elasticsearch',
}, (error) => {
  if (error) {
    console.error('elasticsearch cluster is down!');
  } else {
    console.log('All is well');
  }
});
