const express = require('express');
const Todo = require('../models/todo');

const router = express.Router();

router.get('/', async (req, res) => {
  const todos = await Todo.find();
  res.json(todos);
});

router.post('/', async (req, res) => {
  const todo = new Todo({
    title: req.body.title,
    completed: req.body.completed,
  });
  await todo.save();
  res.json(todo);
});

router.put('/:id', async (req, res) => {
  const todo = await Todo.findById(req.params.id);
  todo.title = req.body.title;
  todo.completed = req.body.completed;
  await todo.save();
  res.json(todo);
});

router.delete('/:id', async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.json({ message: 'Todo deleted' });
});

module.exports = router;
