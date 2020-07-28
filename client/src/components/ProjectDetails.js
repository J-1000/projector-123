// src/components/ProjectDetails.js

import React, { Component } from "react";
import axios from "axios";
import { Button } from 'react-bootstrap';
import EditProject from './EditProject';
import AddTask from './AddTask';
import TaskList from './TaskList';

export default class ProjectDetails extends Component {

  state = {
    project: null,
    error: null,
    title: '',
    description: '',
    editForm: false,
    taskForm: false
  }

  deleteProject = () => {
    const id = this.props.match.params.id;
    axios.delete(`/api/projects/${id}`)
      .then(() => {
        this.props.history.push('/projects');
      })
  }

  handleChange = event => {
    const { name, value } = event.target;
    this.setState({
      [name]: value
    });
  };

  toggleTaskForm = () => {
    this.setState({
      taskForm: !this.state.taskForm
    })
  }

  handleSubmit = event => {
    event.preventDefault();
    const id = this.props.match.params.id;
    axios.put(`/api/projects/${id}`, {
      title: this.state.title,
      description: this.state.description
    })
      .then(response => {
        this.setState({
          project: response.data,
          title: response.data.title,
          description: response.data.description,
          editForm: false
        })
      })
      .catch(err => {
        console.log(err);
      })
  }

  toggleEditForm = () => {
    this.setState({
      editForm: !this.state.editForm
    })
  }

  getData = () => {
    const id = this.props.match.params.id;
    axios
      .get(`/api/projects/${id}`)
      .then(response => {
        console.log(response.data);
        this.setState({
          project: response.data,
          title: response.data.title,
          description: response.data.description
        });
      })
      .catch(err => {
        console.log(err.response);
        // handle err.response depending on err.response.status
        if (err.response.status === 404) {
          this.setState({ error: "Not found" });
        }
      });
  };

  componentDidMount = () => {
    this.getData();
  };

  render() {
    if (this.state.error) return <div>{this.state.error}</div>;
    if (!this.state.project) return (<></>)


    // we set a boolean if there is a loggedinUser and the user is also the owner of the project
    let allowedToDelete = false;
    const user = this.props.user;
    console.log(user);
    const owner = this.state.project.owner;
    if (user && user._id === owner) allowedToDelete = true;

    return (
      <div>
        <h1>{this.state.project.title}</h1>
        <p>{this.state.project.description}</p>
        {allowedToDelete && (
          <Button variant='danger' onClick={this.deleteProject}>Delete Project</Button>
        )}
        <Button onClick={this.toggleEditForm}>Show Edit Form</Button>
        <Button onClick={this.toggleTaskForm}>Show Task Form</Button>
        {this.state.editForm && (
          <EditProject
            {...this.state}
            handleChange={this.handleChange}
            handleSubmit={this.handleSubmit}
          />
        )}
        {this.state.taskForm && (
          <AddTask
            projectId={this.state.project._id}
            getData={this.getData}
            hideForm={() => this.setState({ taskForm: false })}
          />
        )}
        <TaskList tasks={this.state.project.tasks} />
      </div>
    );
  }
}