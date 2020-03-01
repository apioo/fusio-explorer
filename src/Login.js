import React from 'react';

const FUSIO_URL = window.fusio_url;

class Navigation extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            username: '',
            password: '',
            scopes: '',
            error: null
        };

        this.onSubmit = this.onSubmit.bind(this);
        this.handleUsername = this.handleUsername.bind(this);
        this.handlePassword = this.handlePassword.bind(this);
        this.handleScopes = this.handleScopes.bind(this);
    }

    onSubmit() {
        let data = {
            username: this.state.username,
            password: this.state.password
        };

        let scopes = this.state.scopes;
        if (scopes) {
            data['scopes'] = scopes.split(',');
        }

        let config = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
        };

        fetch(FUSIO_URL + '/consumer/login', config)
            .then(res => res.json())
            .then(
                (result) => {
                    if (result.token) {
                        this.props.onLogin.call(null, result.token);
                    } else if (result.message) {
                        this.setState({
                            error: result.message
                        })
                    }
                },
                (error) => {
                    // @TODO handle error
                }
            );
    }

    handleUsername(event) {
        this.setState({
            username: event.target.value
        });
    }

    handlePassword(event) {
        this.setState({
            password: event.target.value
        });
    }

    handleScopes(event) {
        this.setState({
            scopes: event.target.value
        });
    }

    render() {
        let error;
        if (this.state.error) {
            error = <div className="alert alert-danger">{this.state.error}</div>
        }

        return (
            <div className="container fusio-login">
                {error}
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input type="username" className="form-control" id="username" value={this.state.username} onChange={this.handleUsername} />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" className="form-control" id="password" value={this.state.password} onChange={this.handlePassword} />
                </div>
                <div className="form-group">
                    <label htmlFor="scopes">Scopes</label>
                    <input type="text" className="form-control" id="scopes" value={this.state.scopes} onChange={this.handleScopes} />
                </div>
                <button onClick={this.onSubmit} className="btn btn-primary">Login</button>
            </div>
        );
    }
}

export default Navigation;
