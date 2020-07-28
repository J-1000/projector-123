

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
  console.log('task');
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