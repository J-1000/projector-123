const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');

router.post('/', (req, res) => {
  const { title, description, tasks = [] } = req.body;
  // const title = req.body.title;
  // const description = req.body.description;
  // const tasks = [];
  const owner = req.user._id;

  Project.create({
    title: title,
    description: description,
    tasks: tasks,
    owner: owner
  })
    .then(project => {
      res.status(201).json(project);
    })
    .catch(err => {
      res.json(err);
    });
});

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

// GET /api/projects/:id
// return a specific `project` resource with a given id
router.get('/:id', (req, res) => {
  // check if req.params.id is valid, if not respond with a 4xx status code
  Project.findById(req.params.id)
    .populate('tasks')
    .then(project => {
      if (!project) {
        res.status(404).json(project);
      } else {
        res.status(200).json(project);
      }
    })
    .catch(err => {
      res.json(err);
    });
});

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

module.exports = router;