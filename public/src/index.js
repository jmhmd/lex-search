/* global $, Bloodhound, naturalSort */

const React = require('react');
const ReactDOM = require('react-dom');

const SelectionList = require('./selection-list.jsx');
ReactDOM.render(
  <SelectionList
    listenNode={$('.typeahead').get(0)}
  />,
  document.getElementById('typeahead-selections')
);

const remoteHost = 'http://localhost:3000';

const transformFunc = function (response) {
  let result = response.result.map((e) => {
    e.doc.perf = response.perf;
    return e.doc;
  });
  // sort if icd10
  if (response.lexicon === 'icd10') {
    result = result.sort((a, b) => naturalSort(a.i, b.i));
  }
  return result;
};

const icd10 = new Bloodhound({
  datumTokenizer: Bloodhound.tokenizers.obj.whitespace('i', 'd', 'n'),
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  prefetch: `${remoteHost}/prefetch?l=icd10`,
  remote: {
    url: `${remoteHost}/search?l=icd10&q=%QUERY`,
    wildcard: '%QUERY',
    transform: transformFunc,
  },
});

const radlex = new Bloodhound({
  datumTokenizer: Bloodhound.tokenizers.obj.whitespace('i', 'd', 'n'),
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  prefetch: `${remoteHost}/prefetch?l=radlex`,
  remote: {
    url: `${remoteHost}/search?l=radlex&q=%QUERY`,
    wildcard: '%QUERY',
    transform: transformFunc,
  },
});

$('.typeahead')
  .typeahead({
    hint: true,
    highlight: true,
    minLength: 1,
  },
  {
    name: 'radlex',
    display: 'd',
    source: radlex,
    limit: Infinity,
    templates: {
      header(data) {
        return `<div class="lex-name-note text-muted pull-right" style="font-size:12px">
          ${data.suggestions[0].perf.numSearched.toLocaleString()}
          documents in ${data.suggestions[0].perf.milliseconds.toLocaleString()} ms</div>
        <div class="lex-name">RADLEX</div>`;
      },
      suggestion(data) {
        const el = `<div class="lex-listing">
          <div class="text-muted pull-right">${data.i}</div>
          ${data.d}
        </div>`;
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
      header(data) {
        return `<div class="lex-name-note text-muted pull-right" style="font-size:12px">
          ${data.suggestions[0].perf.numSearched.toLocaleString()}
          documents in ${data.suggestions[0].perf.milliseconds.toLocaleString()} ms</div>
        <div class="lex-name">ICD10</div>`;
      },
      suggestion(data) {
        const el = `<div class="lex-listing">
          <div class="text-muted pull-right">${data.i}</div>
          ${data.d}
        </div>`;
        return el;
      },
    },
  });

// $('.typeahead').on('typeahead:select', (ev, suggestion) => {
//   console.log(suggestion);
// });

const emptyMessage = `<div class="empty-message">
    No matches found.
  </div>`;
const emptyMessageNode = $(emptyMessage);
// hide empty message by default
emptyMessageNode.hide();
// get menu element and append hidden empty messsage element
const menuNode = $('.typeahead.tt-input').data('tt-typeahead').menu.$node;
menuNode.append(emptyMessageNode);

$('.typeahead').on('typeahead:asyncreceive', function () {
  if ($(this).data('tt-typeahead').menu._allDatasetsEmpty()) {
    // hide dataset result containers
    menuNode.find('.tt-dataset').hide();
    // show empty message and menu
    emptyMessageNode.show();
    menuNode.show();
  } else {
    // show dataset result containers
    menuNode.find('.tt-dataset').show();
    // hide empty message
    emptyMessageNode.hide();
  }
});
