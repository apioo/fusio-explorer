import React from 'react';
import {Fusio} from "fusio-sdk";

const FUSIO_URL = window.fusio_url;

class Navigation extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            username: '',
            password: '',
            error: null
        };

        this.onSubmit = this.onSubmit.bind(this);
        this.handleUsername = this.handleUsername.bind(this);
        this.handlePassword = this.handlePassword.bind(this);
    }

    onSubmit() {
        let config = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: this.state.username,
                password: this.state.password
            }),
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

                    // window.localStorage.setItem("token", accessToken);
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
                <button onClick={this.onSubmit} className="btn btn-primary">Login</button>
            </div>
        );
    }
}

export default Navigation;
