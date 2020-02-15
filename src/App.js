import React from 'react';
import Form from 'react-jsonschema-form';
import './App.css';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navigation from "./Navigation";
import DataTable from 'react-data-table-component';
import Modal from 'react-modal';
import linkParse from 'parse-link-header';

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            title: '',
            path: '',
            schema: null,
            form: null,
            totalResults: 0,
            itemsPerPage: 10,
            startIndex: 0,
            entry: {},
            columns: [],
            selected: null,
            showModal: false
        };

        this.onClick = this.onClick.bind(this);
        this.addRecord = this.addRecord.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.submitForm = this.submitForm.bind(this);

        Modal.setAppElement('#root');
    }

    componentDidMount() {

    }

    getColumns(result) {
        let columns = [];
        let entry = result.entry[0];

        for (let key in entry) {
            columns.push({
                name: key,
                selector: key
            });
        }

        return columns;
    }

    onClick(navigation) {
        this.getSchema(navigation.path).then(() => {
            this.fetchData(navigation)
        });
    }

    fetchData(navigation) {
        fetch('http://127.0.0.1/projects/fusio/public/index.php/' + navigation.path + '?count=' + this.state.itemsPerPage + '&startIndex=' + this.state.startIndex)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        title: navigation.title,
                        path: navigation.path,
                        totalResults: result.totalResults,
                        itemsPerPage: result.itemsPerPage,
                        startIndex: result.startIndex,
                        entry: result.entry,
                        columns: this.getColumns(result)
                    });
                },
                (error) => {
                    // @TODO handle error
                }
            )
    }

    async getSchema(path) {
        // discover schema
        const optionsResponse = await fetch('http://127.0.0.1/projects/fusio/public/index.php/' + path, {
            method: 'OPTIONS'
        });

        let link = optionsResponse.headers.get('Link');
        let result = linkParse(link);
        let schemaUrl = result['post-schema'].url;

        if (!schemaUrl) {
            // could not determine schema url
            return;
        }

        const response = await fetch(schemaUrl);
        const data = await response.json();

        this.setState({
            schema: data.schema,
            form: data.form
        });
    }

    changePage(page, totalRows) {
        let startIndex = (page - 1) * this.state.itemsPerPage;

        fetch('http://127.0.0.1/projects/fusio/public/index.php/' + this.state.path + '?count=' + this.state.itemsPerPage + '&startIndex=' + startIndex)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        entry: result.entry
                    });
                },
                (error) => {
                    // @TODO handle error
                }
            )
    }

    changeRows(currentRowsPerPage, currentPage) {
        this.setState({
            itemsPerPage: currentRowsPerPage
        });

        fetch('http://127.0.0.1/projects/fusio/public/index.php/' + this.state.path + '?count=' + currentRowsPerPage + '&startIndex=' + this.state.startIndex)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        entry: result.entry
                    });
                },
                (error) => {
                    // @TODO handle error
                }
            )
    }

    clickRow(row) {
        this.setState({
            showModal: true,
            selected: row
        });
    }

    addRecord() {
        this.setState({
            showModal: true,
            selected: null
        });
    }

    closeModal() {
        this.setState({
            showModal: false
        });
    }

    submitForm() {

    }

    render() {
        let grid;
        if (this.state.path) {
            grid = <DataTable
                columns={this.state.columns}
                data={this.state.entry}
                striped={true}
                noHeader={true}
                highlightOnHover={true}
                pagination={true}
                paginationServer={true}
                paginationDefaultPage={this.state.startIndex + 1}
                paginationTotalRows={this.state.totalResults}
                paginationPerPage={this.state.itemsPerPage}
                onChangePage={this.changePage.bind(this)}
                onChangeRowsPerPage={this.changeRows.bind(this)}
                onRowDoubleClicked={this.clickRow.bind(this)}
            />;
        } else {
            grid = <div className="alert alert-info">Please select an entity</div>
        }

        let form;
        if (this.state.schema) {
            if (this.state.form) {
                form = <Form schema={this.state.schema} uiSchema={this.state.form} formData={this.state.selected} onSubmit={this.submitForm}/>
            } else {
                form = <Form schema={this.state.schema} formData={this.state.selected} onSubmit={this.submitForm}/>
            }
        }

        return (
            <div className="fusio-container">
                <div className="fusio-navigation">
                    <p>Entities</p>
                    <Navigation onClick={this.onClick}/>
                </div>
                <div className="fusio-grid">
                    <nav className="navbar navbar-expand-lg navbar-light bg-light">
                        {this.state.title}
                        <div className="collapse navbar-collapse">
                        </div>
                        <form className="form-inline">
                            <button className="btn btn-outline-success" type="button" onClick={this.addRecord} disabled={!this.state.path}>Add</button>
                        </form>
                    </nav>
                    {grid}
                </div>
                <Modal isOpen={this.state.showModal} contentLabel="Add record">
                    <button onClick={this.closeModal} className="btn btn-secondary float-right">×</button>
                    {form}
                </Modal>
            </div>
        );
    }
}

export default App;
