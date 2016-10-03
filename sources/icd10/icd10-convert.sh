#! bash

xml-json ./Tabular.xml section > icd10.json.intermediate1

node ./icd10-convert.js
