const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const todoRoutes = require('./routes/todo');

const app = express();
const port = 5000;

mongoose.connect('mongodb://mongo:27017/todos', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(bodyParser.json());
app.use('/api/todos', todoRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
