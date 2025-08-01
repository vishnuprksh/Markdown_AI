import React, { useState } from 'react';
import MarkdownEditor from './components/MarkdownEditor';
import 'katex/dist/katex.min.css'; // Import KaTeX CSS

function App() {
  return (
    <div className="App">
      <MarkdownEditor />
    </div>
  );
}

export default App;
