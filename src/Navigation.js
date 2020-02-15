import React from 'react';

class Navigation extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            paths: []
        };
    }

    findPaths(result) {
        let paths = [];
        for (let path in result.routes) {
            let match = true;
            for (let method in result.routes[path]) {
                if (result.routes[path][method] !== 'Fusio\\Adapter\\Sql\\Action\\SqlTable') {
                    match = false;
                    break;
                }
            }

            if (match) {
                paths.push(path);
            }
        }

        let data = [];
        for (let i = 0; i < paths.length; i++) {
            let found = false;
            for (let j = 0; j < paths.length; j++) {
                if (paths[j] === paths[i] + '/:id') {
                    found = true;
                    break;
                }
            }

            if (found) {
                let title = paths[i].substr(1).replace('/', '.');
                title = title.charAt(0).toUpperCase() + title.substr(1);

                data.push({
                    title: title,
                    path: paths[i]
                });
            }
        }

        return data;
    }
    
    componentDidMount() {
        fetch('http://127.0.0.1/projects/fusio/public/index.php/export/routes')
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        paths: this.findPaths(result)
                    });
                },
                (error) => {
                }
            )
    }

    onClick(path) {
        this.props.onClick.call(null, path);
    }
    
    render() {
        const { paths } = this.state;

        return (
            <ul>
                {paths.map(item => (
                    <li key={item.path}><button className="btn btn-link" onClick={this.onClick.bind(this, item)}>{item.title}</button></li>
                ))}
            </ul>
        );

    }
}

export default Navigation;
