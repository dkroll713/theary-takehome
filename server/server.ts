// const app = require('./index.ts');
import app from './index';

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT}/api/tree to see the tree data`);
});