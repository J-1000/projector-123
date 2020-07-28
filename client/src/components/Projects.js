import React, { Component } from 'react';
import ProjectList from './ProjectList';
import AddProject from './AddProject';
import axios from 'axios';

export default class Projects extends Component {
  state = {
    projects: []
  };

  componentDidMount = () => {
    this.getData();
  };

  getData = () => {
    axios
      .get('/api/projects')
      .then(response => {
        this.setState({
          projects: response.data
        });
      })
      .catch(err => {
        console.log(err);
      });
  };

  render() {
    console.log(this.state.projects);
    return (
      <div className='projects-container'>
        <AddProject getData={this.getData} />
        <ProjectList projects={this.state.projects} />
      </div>
    );
  }
}