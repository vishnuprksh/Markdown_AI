# Markdown AI Editor

A simple, elegant markdown editor built with React that supports images and LaTeX math expressions.

## Features

- ✅ **Live Preview**: See your markdown rendered in real-time
- ✅ **LaTeX Support**: Write mathematical expressions using KaTeX
- ✅ **Image Support**: Upload and embed images directly
- ✅ **Syntax Highlighting**: Code blocks with beautiful syntax highlighting
- ✅ **GitHub Flavored Markdown**: Tables, strikethrough, task lists, and more
- ✅ **Toolbar**: Quick access buttons for common formatting
- ✅ **Responsive Design**: Works on desktop and mobile devices

## LaTeX Examples

The editor supports both inline and block math expressions:

- Inline: `$E = mc^2$` renders as $E = mc^2$
- Block: `$$\frac{d}{dx}\left( \int_{0}^{x} f(u) \, du\right) = f(x)$$`

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd markdown-ai-editor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

1. **Writing Markdown**: Type your markdown content in the left panel
2. **Live Preview**: See the rendered output in the right panel
3. **Toolbar Shortcuts**: Use the toolbar buttons for quick formatting
4. **Image Upload**: Click the camera icon to upload images
5. **Math Expressions**: Use `$...$` for inline math and `$$...$$` for block math

## Supported Markdown Features

- Headers (H1-H6)
- **Bold** and *italic* text
- `Inline code` and code blocks with syntax highlighting
- [Links](https://example.com)
- Images
- Lists (ordered and unordered)
- Tables
- Blockquotes
- Strikethrough
- Task lists
- Mathematical expressions (LaTeX)

## Tech Stack

- **React** - UI framework
- **react-markdown** - Markdown parser and renderer
- **KaTeX** - LaTeX math rendering
- **react-syntax-highlighter** - Code syntax highlighting
- **remark-gfm** - GitHub Flavored Markdown support
- **remark-math** & **rehype-katex** - Math expression support

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- [react-markdown](https://github.com/remarkjs/react-markdown) for the markdown rendering
- [KaTeX](https://katex.org/) for beautiful math typesetting
- [Prism.js](https://prismjs.com/) for syntax highlighting
