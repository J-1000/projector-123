import React, { Component } from 'react';
import axios from 'axios';
import { Form, Button } from 'react-bootstrap';

export default class AddProject extends Component {
  state = {
    title: '',
    description: ''
  };

  handleChange = event => {
    const name = event.target.name;
    const value = event.target.value;
    // const value =
    //   event.target.type === 'checkbox'
    //     ? event.target.checked
    //     : event.target.value;

    this.setState({
      [name]: value
    });
  };

  handleSubmit = event => {
    event.preventDefault();

    // http://localhost:5555/api/projects
    axios
      .post('/api/projects', {
        title: this.state.title,
        description: this.state.description
      })
      .then(() => {
        this.setState({
          title: '',
          description: ''
        });
        // updates the parent's component's state, which causes new props to be passed to the <ProjectList/> component
        this.props.getData();
      })
      .catch(err => {
        console.log(err);
      });
  };

  render() {
    return (
      <Form onSubmit={this.handleSubmit}>
        {/* all groups (label + input) are grouped in a Form.Group */}
        <Form.Group>
          {/* <label></label> */}
          <Form.Label htmlFor='title'>Title: </Form.Label>
          {/* <input /> */}
          <Form.Control
            type='text'
            id='title'
            name='title'
            value={this.state.title}
            onChange={this.handleChange}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label htmlFor='description'>Description: </Form.Label>
          <Form.Control
            type='text'
            name='description'
            id='description'
            value={this.state.description}
            onChange={this.handleChange}
          />
        </Form.Group>

        <Button type='submit'>Add Project</Button>
      </Form>
    );
  }
}