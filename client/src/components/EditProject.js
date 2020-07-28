import React, { Component } from 'react';
import { Form, Button } from 'react-bootstrap';

class EditProject extends Component {
  render() {
    console.log(this.props.title);
    return (
      <div>
        <h2>Edit project: </h2>
        <Form onSubmit={this.props.handleSubmit}>
          <Form.Group>
            <Form.Label>Title:</Form.Label>
            <Form.Control
              type='text'
              name='title'
              value={this.props.title}
              onChange={this.props.handleChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description:</Form.Label>
            <Form.Control
              type='text'
              name='description'
              value={this.props.description}
              onChange={this.props.handleChange}
            />
          </Form.Group>

          <Button type='submit'>Edit</Button>
        </Form>
      </div>
    );
  }
}

export default EditProject;