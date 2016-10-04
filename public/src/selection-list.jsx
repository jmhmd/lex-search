/* global $ */
const React = require('react');

class SelectionList extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      docs: this.props.docs || [],
    };
  }

  componentDidMount() {
    $(this.props.listenNode).on('typeahead:select', (e, doc) => {
      const newDocs = this.state.docs;
      newDocs.push(doc);
      this.setState({ docs: newDocs });
    });
  }

  handleRemove(i) {
    const newDocs = this.state.docs;
    newDocs.splice(i, 1);
    this.setState({ docs: newDocs });
  }

  render() {
    const docs = this.state.docs.map((doc, i) => (
      <div className="doc alert alert-info alert-dismissable" key={doc.i}>
        <div className="pull-right text-muted">{doc.i}</div>
        <button className="close pull-left" onClick={() => this.handleRemove(i)}>&times;</button>
        {doc.d}
      </div>
    ));
    return (
      <div className="lex-search-selections">
        {docs}
      </div>
    );
  }
}

SelectionList.propTypes = {
  docs: React.PropTypes.array,
  listenNode: React.PropTypes.object.isRequired,
};

module.exports = SelectionList;
