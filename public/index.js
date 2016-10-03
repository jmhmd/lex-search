var remoteHost = 'http://localhost:3000';
var transformFunc = function (response) {
  var result = response.result.map(function (e) {
    return e.doc;
  })
  // sort if icd10
  if (response.lexicon === 'icd10') {
    result = result.sort(function (a, b) {
      return naturalSort(a.i, b.i);
    });
  }
  return result;
}

var icd10 = new Bloodhound({
  datumTokenizer: Bloodhound.tokenizers.obj.whitespace('i', 'd', 'n'),
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  prefetch: remoteHost + '/prefetch?l=icd10',
  remote: {
    url: remoteHost + '/search?l=icd10&q=%QUERY',
    wildcard: '%QUERY',
    transform: transformFunc,
  }
});

var radlex = new Bloodhound({
  datumTokenizer: Bloodhound.tokenizers.obj.whitespace('i', 'd', 'n'),
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  prefetch: remoteHost + '/prefetch?l=radlex',
  remote: {
    url: remoteHost + '/search?l=radlex&q=%QUERY',
    wildcard: '%QUERY',
    transform: transformFunc,
  }
});

$('.typeahead').typeahead({
  hint: true,
  highlight: true,
  minLength: 1
},
{
  name: 'radlex',
  display: 'd',
  source: radlex,
  limit: Infinity,
  templates: {
    header: '<h3 class="lex-name">RADLEX</h3>',
    suggestion: function (data) {
      var el = '<div class="lex-listing">' +
        '<div class="text-muted pull-right">' + data.i + '</div>' +
        data.d + '</div>';
      return el;
    },
  },
},
{
  name: 'icd10',
  display: 'd',
  source: icd10,
  limit: Infinity,
  templates: {
    header: '<h3 class="lex-name">ICD10</h3>',
    suggestion: function (data) {
      var el = '<div class="lex-listing">' +
        '<div class="text-muted pull-right">' + data.i + '</div>' +
        data.d + '</div>';
      return el;
    },
  },
});
