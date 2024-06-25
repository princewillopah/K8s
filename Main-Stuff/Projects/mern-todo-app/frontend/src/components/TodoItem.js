import React from 'react';

function TodoItem({ todo }) {
  return (
    <li>
      <span>{todo.title}</span>
      <input type="checkbox" checked={todo.completed} />
    </li>
  );
}

export default TodoItem;
