import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TodoItem from './TodoItem';

function Home() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    axios.get('/api/todos')
      .then(response => setTodos(response.data))
      .catch(error => console.error(error));
  }, []);

  const addTodo = () => {
    axios.post('/api/todos', { title: newTodo, completed: false })
      .then(response => setTodos([...todos, response.data]))
      .catch(error => console.error(error));
  };

  return (
    <div>
      <h1>ToDo List</h1>
      <input
        type="text"
        value={newTodo}
        onChange={(e) => setNewTodo(e.target.value)}
        placeholder="Add a new todo"
      />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map(todo => (
          <TodoItem key={todo._id} todo={todo} />
        ))}
      </ul>
    </div>
  );
}

export default Home;
