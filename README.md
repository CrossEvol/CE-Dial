
# Before
this project used the template from [chrome-extension-boilerplate-react-vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite).

# Speed Dial - Chrome Extension

A modern, customizable speed dial extension for Chrome that helps you organize your favorite websites with a clean, intuitive interface.

![Speed Dial](pages/new-tab/public/logo_horizontal.svg)

## Features

- **Customizable Speed Dial**: Organize your favorite websites in a visually appealing grid
- **Group Management**: Create and manage groups to categorize your bookmarks
- **Drag and Drop**: Easily rearrange your speed dials with intuitive drag and drop functionality
- **Custom Thumbnails**: Upload your own thumbnails or use automatically generated ones
- **Dark Mode Support**: Seamless switching between light and dark themes
- **GitHub Sync**: Synchronize your speed dials across devices using GitHub

## Tech Stack

- **React 19**: Modern UI library for building the interface
- **TypeScript**: Type-safe JavaScript for robust code
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Dexie.js**: IndexedDB wrapper for client-side storage
- **Zustand**: Lightweight state management
- **Radix UI**: Accessible UI components
- **DND Kit**: Drag and drop functionality
- **Lucide React**: Beautiful, consistent icons
- **React Hook Form**: Form validation and handling
- **Zod**: Schema validation
- **Octokit**: GitHub API integration

## Development

### Prerequisites

- Node.js (v22.12.0 or higher)
- pnpm (v10.4.1 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/speed-dial.git
cd speed-dial

# Install dependencies
pnpm install
```

### Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Build for Firefox
pnpm build:firefox

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code with Prettier
pnpm prettier
```

### Project Structure

- `pages/new-tab/`: New tab page implementation
- `components/`: Reusable UI components
- `lib/`: Utility functions and services
- `models/`: Data models and database schema

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
