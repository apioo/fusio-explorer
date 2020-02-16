import React from 'react';
import Form from 'react-jsonschema-form';
import './App.css';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navigation from "./Navigation";
import Login from "./Login";
import DataTable from 'react-data-table-component';
import Modal from 'react-modal';
import linkParse from 'parse-link-header';

const FUSIO_URL = window.fusio_url;

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            title: '',
            path: '',
            // grid
            columns: [],
            totalResults: 0,
            itemsPerPage: 10,
            startIndex: 0,
            entry: [],
            // modal
            schema: null,
            form: null,
            selected: null, // the selected row
            showModal: false,
            error: null,
            // login
            token: null,
            showLogin: false
        };

        this.onClick = this.onClick.bind(this);
        this.addRecord = this.addRecord.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.submitForm = this.submitForm.bind(this);
        this.showLogin = this.showLogin.bind(this);
        this.onLogin = this.onLogin.bind(this);

        Modal.setAppElement('#root');
    }

    componentDidMount() {

    }

    onClick(navigation) {
        this.getSchema(navigation.path).then(() => {
            this.setState({
                title: navigation.title,
                path: navigation.path,
            });

            this.fetchData()
        });
    }

    fetchData() {
        fetch(FUSIO_URL + this.state.path + '?count=' + this.state.itemsPerPage + '&startIndex=' + this.state.startIndex)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        totalResults: result.totalResults,
                        itemsPerPage: result.itemsPerPage,
                        startIndex: result.startIndex,
                        entry: result.entry
                    });
                },
                (error) => {
                    // @TODO handle error
                }
            )
    }

    async getSchema(path) {
        // discover schema
        const optionsResponse = await fetch(FUSIO_URL + path, {
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

        // @TODO build columns based on JSON Schema

        this.setState({
            schema: data.schema,
            form: data.form,
            columns: this.buildColumnsFromJsonSchema(data.schema)
        });
    }

    buildColumnsFromJsonSchema(schema) {
        let columns = [];

        if (schema.properties) {
            for (let key in schema.properties) {
                let title = key;
                if (schema.properties[key].title) {
                    title = schema.properties[key].title;
                }

                columns.push({
                    name: title,
                    selector: key
                });
            }
        }

        return columns;
    }

    changePage(page, totalRows) {
        let startIndex = (page - 1) * this.state.itemsPerPage;

        fetch(FUSIO_URL + this.state.path + '?count=' + this.state.itemsPerPage + '&startIndex=' + startIndex)
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

        fetch(FUSIO_URL + this.state.path + '?count=' + currentRowsPerPage + '&startIndex=' + this.state.startIndex)
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
            selected: {}
        });
    }

    closeModal() {
        this.setState({
            showModal: false
        });
    }

    submitForm() {
        let config = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.state.token
            },
            body: JSON.stringify(this.state.selected)
        };

        fetch(FUSIO_URL + this.state.path, config)
            .then(res => res.json())
            .then(
                (result) => {
                    if (!result.success) {
                        let error = 'The server responded with an error message';
                        if (result.message) {
                            error = result.message;
                        }

                        this.setState({
                            error: error
                        });
                    } else {
                        this.setState({
                            showModal: false
                        });

                        this.fetchData()
                    }
                },
                (error) => {
                    // @TODO handle error
                }
            );
    }

    showLogin() {
        this.setState({
            showLogin: true
        })
    }

    onLogin(accessToken) {
        this.setState({
            token: accessToken,
            showLogin: false
        })
    }
    
    render() {
        if (this.state.showLogin) {
            return <Login onLogin={this.onLogin}/>
        }

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
            let schema = this.state.schema;
            if (schema['$schema']) {
                delete schema['$schema'];
            }

            if (this.state.form) {
                form = <Form schema={this.state.schema} uiSchema={this.state.form} formData={this.state.selected} onSubmit={this.submitForm}/>
            } else {
                form = <Form schema={this.state.schema} formData={this.state.selected} onSubmit={this.submitForm}/>
            }
        }

        let error;
        if (this.state.error) {
            error = <div className="alert alert-danger">{this.state.error}</div>
        }

        let login;
        if (!this.state.authorized) {
            login = <button className="btn btn-outline-info" type="button" onClick={this.showLogin}>Login</button>
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
                        {login}
                        <button className="btn btn-outline-info" type="button" onClick={this.addRecord} disabled={!this.state.path}>Add</button>
                    </nav>
                    {grid}
                </div>
                <Modal isOpen={this.state.showModal} contentLabel="Add record">
                    <button onClick={this.closeModal} className="btn btn-secondary float-right">×</button>
                    {error}
                    {form}
                </Modal>
            </div>
        );
    }
}

export default App;
