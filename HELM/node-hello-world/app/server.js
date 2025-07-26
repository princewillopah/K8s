// app/server.js
const http = require('http');
const port = process.env.PORT || 3000;
const message = process.env.MESSAGE || "Hello from Helm!";

const server = http.createServer((req, res) => {
  res.end(message);
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

