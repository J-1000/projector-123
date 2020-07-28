https://en.wikipedia.org/wiki/Representational_state_transfer

One noun, four verbs - resful api design. REST is an architecture for client - server systems. A certain set or rules to design an API. The focus of REST is on machine to machine communication. 

https://stackoverflow.com/questions/36250615/cors-with-postman

# Projector

### First we create our backend as a REST API

```
$ irongenerate projector
$ cd projector
# Delete the views folder and the index routes
$ trash /views
$ trash routes/index.js
```

Now run the app - we will get an error 😩
```bash
$ npm run dev
```

```bash
internal/modules/cjs/loader.js:985
  throw err;
  ^

Error: Cannot find module './routes/index'
Require stack:
- /Users/jan/code/ironhack/bootcamp/lectures-templates/w8d1/projector/app.js
- /Users/jan/code/ironhack/bootcamp/lectures-templates/w8d1/projector/bin/www
```

Go to app.js and remove the reference to routes/index.js

Update the port in the .env file to 5555

```
// .env
PORT=5555
```

### Create the models

We need projects and tasks - let's create the files for these two entities.

```bash
touch models/Project.js
touch models/Task.js
```

And let's add the project model - later we will also add an owner field that references the User

```js
// models/Project.js
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const projectSchema = new Schema({
  title: String,
  description: String,
  tasks: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Task'
    }
  ]
});

const Project = model('Project', projectSchema);

module.exports = Project;
```

Let's also add the Task model

```js
// models/Task.js 
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const taskSchema = new Schema({
  title: String,
  description: String,
  project: { type: Schema.Types.ObjectId, ref: 'Project' }
});

const Task = model('Task', taskSchema);

module.exports = Task;
```

### Create the routes 

|     Route     | HTTP Verb |          Description          |
|---------------|-----------|-------------------------------|
|   `api/projects`    |    GET    | Returns all projects |
|   `api/projects`   |   POST    | Creates a new project  |
|   `api/projects/:id`   |   GET    | Returns a specific project  |
|   `api/projects/:id`   |   PUT    | Updates a specific project  |
|   `api/projects/:id`   |   DELETE    | Deletes a specific project  |

|     Route     | HTTP Verb |          Description          |
|---------------|-----------|-------------------------------|
|   `api/tasks`   |   POST    | Creates a new task  |
|   `api/tasks/:id`   |   GET    | Returns a specific task  |
|   `api/tasks/:id`   |   PUT    | Updates a specific task  |
|   `api/tasks/:id`   |   DELETE    | Deletes a specific task  |

Let's create a dedicated route file for every entity.

```bash
$ touch routes/project.js
$ touch routes/task.js
```

We add the route to create a project first - if the project got created we want to respond with the status code 201 - resource created.

```js
// routes/project.js
const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

router.post('/', (req, res) => {
  // const { title, description, tasks = [] } = req.body;
  const title = req.body.title;
  const description = req.body.description;
  const tasks = [];

  Project.create({
    title: title,
    description: description,
    tasks: tasks
  })
    .then(project => {
      res.status(201).json(project);
    })
    .catch(err => {
      res.json(err);
    });
});

module.exports = router;
```

And we also have to reference the file in app.js

```js
// app.js
//
app.use('/api/projects', require('./routes/project'));
//
```

Now we add the get route to get all the projects.

```js
// routes/project.js
//
// GET /api/projects
router.get('/', (req, res) => {
  Project.find()
    .populate('tasks')
    .then(projects => {
      res.status(200).json(projects);
    })
    .catch(err => {
      res.json(err);
    });
});
```

Now we add the route to get a specific project.

```js
// routes/project.js
//
// GET /api/projects/:id
router.get('/:id', (req, res) => {
  // check if req.params.id is valid, if not respond with a 4xx status code
  Project.findById(req.params.id)
    .populate('tasks')
    .then(project => {
      if (!project) {
        res.status(404).json(project);
      } else {
        res.json(project);
      }
    })
    .catch(err => {
      res.(200).json(err);
    });
});
```

Now we also add the routes to update a project.

```js
// routes/project.js
//
// PUT /api/projects/:id
router.put('/:id', (req, res) => {
  const { title, description } = req.body;

  Project.findByIdAndUpdate(
    req.params.id,
    { title, description },
    // { new: true } ensures that we are getting the updated document in the .then callback
    { new: true }
  )
    .then(project => {
      res.status(200).json(project);
    })
    .catch(err => {
      res.json(err);
    });
});
```

And the route to delete a project. 

We also have to take care of deleting all the tasks as soon as the associated project got deleted.

```js
// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  // delete the project
  Project.findByIdAndDelete(req.params.id)
    .then(project => {
      // Deletes all the documents in the Task collection where the value for the `_id` field is present in the `project.tasks` array
      return Task.deleteMany({ _id: { $in: project.tasks } }).then(() => {
        res.status(200).json({ message: 'ok' });
      });
    })
    .catch(err => {
      res.json(err);
    });
});
```

The routes for the projects are finished 💪

Let's also add the routes for the tasks.

In the post route to create a task we gonna send the project id in the post body.

```js
// routes/task.js

const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const router = express.Router();

router.get('/:id', (req, res) => {
  const id = req.params.id;

  Task.findById(id)
    .then(task => {
      res.status(200).json(task);
    })
    .catch(err => {
      res.json(err);
    });
});

router.post('/', (req, res) => {
  const { title, description, projectId } = req.body;

  Task.create({
    title,
    description,
    project: projectId
  })
    .then(task => {
      return Project.findByIdAndUpdate(projectId, {
        $push: { tasks: task._id }
      }).then(() => {
        res.status(201).json({
          message: `Task with id ${task._id} was successfully added to project with id ${projectId}`
        });
      });
    })
    .catch(err => {
      res.json(err);
    });
});

router.put('/:id', (req, res, next) => {
  const id = req.params.id;
  const { title, description } = req.body;

  Task.findByIdAndUpdate(id, { title, description }, { new: true })
    .then(task => {
      res.json(task);
    })
    .catch(err => {
      res.json(err);
    });
});

router.delete('/:id', (req, res, next) => {
  const id = req.params.id;

  Task.findByIdAndDelete(id)
    .then(task => {
      return Project.findByIdAndUpdate(task.project, {
        $pull: { tasks: id }
      }).then(() => {
        res.json({ message: 'ok' });
      });
    })
    .catch(err => {
      res.json(err);
    });
});

module.exports = router;
```

Your REST API is finished - let's proceed with the client.

### The client - a React app

In the root directory of our application we run create-react-app 

```bash
$ npx create-react-app client
```

We will need axios for the requests to the server and react router for our routing.

```bash
$ npm install axios react-router-dom
```

Also we will use bootstrap for the styling

```bash
$ npm install bootstrap react-bootstrap
```

Update the package.json file with a proxy.

```js
// package.json
  "name": "client",
  "version": "0.1.0",
  "proxy": "http://localhost:5555", 
  "private": true,
```

First we add the functionality to create a project and to see all projects.

We create two components for that Projects, that holds the projects in its state and ProjectList which renders all the projects.

```bash
$ mkdir src/components
$ touch src/components/ProjectList.js
$ touch src/components/Projects.js
```

Let's create the Projects component.

```js
// scr/components/Projects.js
import React, { Component } from 'react';
import ProjectList from './ProjectList';
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
    return (
      <div className='projects-container'>
        <ProjectList projects={this.state.projects} />
      </div>
    );
  }
}
```

Next we add the ProjectList component to render the projects.

```js
// src/components/ProjectList.js
import React from 'react';
import { Link } from 'react-router-dom';

const ProjectList = props => {
  return (
    <div>
      {props.projects.length > 0 && <h2>Projects:</h2>}

      {props.projects.map(project => {
        return (
          <div key={project._id}>
            <h3>
              {/* <Link to={`/projects/${project._id}`}>{project.title}</Link> */}
              {project.title}
            </h3>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectList;
```

And reference the Projects component in the App.js

We also have to add an import for bootstrap

```js
// App.js

import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import './App.css';
import Projects from './components/Projects';

function App() {
  return (
    <div className="App">
      <Projects />
    </div>
  );
}

export default App;
```



We don't want to reference the Projects component directly in App.js. Instead let's add Routing and a Navbar.

To add Routing we have to add everything with the Router - so we wrap the root component, this is App.js and it is referenced in index.js, the starting point of our app.

```js
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById('root')
);
```

Now let's create a Navbar component and add some routing logic to App.js

```bash
$ touch src/components/Navbar.js
```

The Navbar for now just holds a link to home and to the projects overview. We need to import the Link component from react-router-dom and the bootstrap navbar. 

```js
// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar as Nav } from 'react-bootstrap';

const Navbar = props => {
  return (
    <Nav className='nav justify-content-end' bg='primary'>
      <Nav.Brand>
        <Link to='/'>Home</Link>
      </Nav.Brand>
      <Nav.Brand>
        <Link to='/projects'>Projects</Link>
      </Nav.Brand>
    </Nav>
  );
};

export default Navbar;
```

Now we have to add the routing logic to App.js for these two routes and reference the Navbar.

```js
// src/App.js
//
import { Route } from 'react-router-dom';
import Projects from './components/Projects';
import Navbar from './components/Navbar';

function App() {
  return (
    <div className="App">

      <Navbar />

      <Route
        exact
        path="/projects"
        component={Projects}
      />
    </div>
  );
}

export default App;
```

Now let's add the functionality to add a project. We create a component AddProject.js. 

```bash
$ touch src/component/AddProject.js

```

The AddProject.js component will be used in the Projects component and will get the getData server call as a prop.

```js
// src/components/Projects.js
//
  render() {
    return (
      <div className='projects-container'>
        <AddProject getData={this.getData} />
        <ProjectList projects={this.state.projects} />
      </div>
    );
  }
//
```

Now let's build the AddProject component. First build the form, then the handleChange, then the handleSubmit function. 

After the axios post we call the getData function in Projects which causes the state there to be updated and new props will be passed to the ProjectList component. 

```js
// src/component/AddProject.js
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

    this.setState({
      [name]: value
    });
  };

  handleSubmit = event => {
    event.preventDefault();

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
```

Now let's add a Detail view for the project that we can reach by clicking on a project's title in the ProjectList component.

First we turn the title into a link.

```js
// src/component/ProjectList.js
// 
import { Link } from 'react-router-dom';
//
<div key={project._id}>
  <h3>
    <Link to={`/projects/${project._id}`}>{project.title}</Link>
  </h3>
</div>
```

And we also need to add a route to App.js.

```js
// App.js
import ProjectDetails from './components/ProjectDetails';
//
<Route
  exact
  path="/projects/:id"
  component={ProjectDetails}
/>
```

And of course create the conponent.

```bash
$ touch src/ProjectDetails.js
```

First let's just output title and description of the project.

```js
// src/components/ProjectDetails.js

import React, { Component } from "react";
import axios from "axios";

export default class ProjectDetails extends Component {

  state = {
    project: null,
    error: null
  }

  getData = () => {
    const id = this.props.match.params.id;
    axios
      .get(`/api/projects/${id}`)
      .then(response => {
        console.log(response.data);
        this.setState({
          project: response.data,
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
    else return (
      <div>
        <h1>{this.state.project.title}</h1>
        <p>{this.state.project.description}</p>
      </div>
    );
  }
}
```

Now let's add a delete button to the detail view.

With props.history.push('/projects') we navigate directly to the projects route.

```js
// src/components/ProjectDetails.js
//
deleteProject = () => {
  const id = this.props.match.params.id;
  axios.delete(`/api/projects/${id}`).then(() => {
    this.props.history.push("/projects");
  });
};
//
<h1>{this.state.project.title}</h1>
<p>{this.state.project.description}</p>
<Button variant="danger" onClick={this.deleteProject}>
  Delete project
</Button>
```

Now let's add an edit form. We want a button that when pressed toggles the edit form.

```js
// src/components/ProjectDetail.js

state = {
  project: null,
  editForm: false,
  error: null
};

toggleEditForm = () => {
  this.setState({
    editForm: !this.state.editForm
  });
};

<Button onClick={this.toggleEditForm}>Show Edit form</Button>
```

The edit form that gets displayed will be in a separate component.

Let's first reference it in ProjectDetails and then create it.

```js
// src/components/ProjectDetails.js
// 
import EditProject from './EditProject';
// 
    <div>
      <h1>{this.state.project.title}</h1>
      <p>{this.state.project.description}</p>
      <Button onClick={this.toggleEditForm}>Show Edit form</Button>
      <Button variant='danger' onClick={this.deleteProject}>
        Delete project
      </Button>
      {/* form that is displayed when the edit button is clicked */}
      {this.state.editForm && (
        <EditProject
          // spread props from the state (title and description will be needed in the child component)
          {...this.state}
          handleChange={this.handleChange}
          handleSubmit={this.handleSubmit}
        />
      )}
    </div>
// 
```

Now let's create the EditProject.js component.

```js
// src/components/EditProject.js
import React, { Component } from 'react';
import { Form, Button } from 'react-bootstrap';

class EditProject extends Component {
  render() {
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
```

The handleChange and handlesubmit methods in EditProject got passed in as a prop that's why we have to add these methods in the parent component. 

We also want to add the title and the description to the state of the ProjectDetail

```js
// src/components/ProjectDetails.js
//
  state = {
    project: null,
    error: null,
    editForm: false,
    title: '',
    description: ''
  }

  handleChange = event => {
      const { name, value } = event.target;

      this.setState({
        [name]: value
      });
    };

  handleSubmit = event => {
    event.preventDefault();
    const id = this.props.match.params.id;
    axios
      .put(`/api/projects/${id}`, {
        title: this.state.title,
        description: this.state.description
      })
      .then(response => {
        this.setState({
          project: response.data,
          title: response.data.title,
          description: response.data.description,
          editForm: false
        });
      })
      .catch(err => {
        console.log(err);
      });
  };
```

### Adding Tasks

Now let's also show the tasks in the ProjectDetails.js view and have a form to add tasks. To toggle the task form we use the same principle as we did for the edit form.

Let's add a button, a boolean for the taskForm in the state and the reference for a AddTask component in the render method.

```js
// src/components/ProjectDetail.js
//
import AddTask from './AddTask';
export default class ProjectDetails extends Component {

  state = {
    project: null,
    error: null,
    title: '',
    description: '',
    editForm: false,
    // boolean in the state
    taskForm: false
  }



  toggleEditForm = () => {
    this.setState({
      editForm: !this.state.editForm
    });
  };

  // toggle method
  toggleTaskForm = () => {
    this.setState({
      taskForm: !this.state.taskForm
    });
  }


  render() {
    if (this.state.error) return <div>{this.state.error}</div>;
    if (!this.state.project) return (<></>)
    else return (
      <div>
        <h1>{this.state.project.title}</h1>
        <p>{this.state.project.description}</p>
        <Button onClick={this.toggleEditForm}>Show Edit form</Button>
        
        // the button
        <Button onClick={this.toggleTaskForm}>Show Task form</Button>

        <Button variant='danger' onClick={this.deleteProject}>
          Delete project
        </Button>
        {/* form that is displayed when the edit button is clicked */}
        {
          this.state.editForm && (
            <EditProject
              // spread props from the state (title and description will be needed in the child component)
              {...this.state}
              handleChange={this.handleChange}
              handleSubmit={this.handleSubmit}
            />
          )
        }
        // and the task form 
        {this.state.taskForm && (
          <AddTask
            projectId={this.state.project._id}
            getData={this.getData}
            hideForm={() => this.setState({ taskForm: false })}
          />
        )}
      </div >
    );
  }
}
```

Now we have to create the AddTask component that we are referencing in the render method.

```bash
$ touch src/AddTask.js
```

```js
import React, { Component } from 'react';
import { Form, Button } from 'react-bootstrap';
import axios from 'axios';

export default class AddTask extends Component {
  state = {
    title: '',
    description: ''
  };

  handleChange = event => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handleSubmit = event => {
    event.preventDefault();

    const { title, description } = this.state;

    axios
      .post('/api/tasks', {
        title,
        description,
        projectId: this.props.projectId
      })
      .then(() => {
        this.props.getData();
        this.props.hideForm();
      })
      .catch(err => {
        console.log(err);
      });
  };

  render() {
    return (
      <div>
        <h2>Add task: </h2>
        <Form onSubmit={this.handleSubmit}>
          <Form.Group>
            <Form.Label>Title:</Form.Label>
            <Form.Control
              type='text'
              name='title'
              value={this.state.title}
              onChange={this.handleChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description:</Form.Label>
            <Form.Control
              type='text'
              name='description'
              value={this.state.description}
              onChange={this.handleChange}
            />
          </Form.Group>

          <Button type='submit'>Add</Button>
        </Form>
      </div>
    );
  }
}
```

Now try to add a project first and then a task. You shoul get an error. 

That is because in app.js the reference to the task routes is missing 🙃

Add it and proceed 🚀

We want to now also render the tasks. We create a component TaskList.js.

```bash
$ touch src/components/TaskList.js
```

```js
import React from "react";
import { Link } from "react-router-dom";

const TaskList = props => {
  return (
    <div>
      {props.tasks.length > 0 && <h2>Tasks:</h2>}
      {props.tasks.map(task => {
        return (
          <div key={task._id}>
            // <Link to={`/tasks/${task._id}`}>
              <h3>{task.title}</h3>
            // </Link>
          </div>
        );
      })}
    </div>
  );
};

export default TaskList;
```

We use it in the ProjectDetails.js

```js
// src/components/ProjectDetails
import TaskList from './TaskList';
//
      {this.state.taskForm && (
        <AddTask
          projectId={this.state.project._id}
          getData={this.getData}
          hideForm={() => this.setState({ taskForm: false })}
        />
      )}
      // add the tasklist
      <TaskList tasks={this.state.project.tasks} />
    </div>
```

Now we add a detail view for the task.

```bash
$ touch TaskDetail.js
```

In TaskList we turn the heading into a link.

```js
// src/components/TaskList.js
//
  <div key={task._id}>
    // <Link to={`/tasks/${task._id}`}>
      <h3>{task.title}</h3>
    // </Link>
  </div>
//
```

Then we need to add the route in App.js

```js
// src/App.js
import TaskDetails from './components/TaskDetails';
//
function App() {
  return (
    <div className="App">
      //
      <Route exact path="/tasks/:id" component={TaskDetails} />
    </div>
```

```js
// src/components/TaskDetails.js
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import axios from 'axios';

export default class ProjectDetails extends Component {
  state = {
    title: '',
    description: '',
    project: ''
  };

  componentDidMount() {
    const taskId = this.props.match.params.id;

    return axios
      .get(`/api/tasks/${taskId}`)
      .then(response => {
        const { title, description, project } = response.data;
        this.setState({ title, description, project });
      })
      .catch(err => {
        console.log(err);
      });
  }

  render() {
    const task = {
      title: this.state.title,
      description: this.state.description,
      project: this.state.project
    };

    return (
      <div>
        <h1>{task.title}</h1>
        <p>{task.description}</p>
        <Link to={`/projects/${task.project}`}>Back to project</Link>
      </div>
    );
  }
}
```

And we are done 🤩