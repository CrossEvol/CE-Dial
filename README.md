
# Before
this project used the template from [chrome-extension-boilerplate-react-vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite).

# Speed Dial - Chrome Extension

A modern, customizable speed dial extension for Chrome that helps you organize your favorite websites with a clean, intuitive interface.

![Speed Dial](chrome-extension/public/icon-128.png)

## Features

- **Customizable Speed Dial**: Organize your favorite websites in a visually appealing grid
- **Group Management**: Create, manage, and reorder groups to categorize your bookmarks
- **Dial Management**: Add, edit, and copy your bookmarks to other groups
- **Drag and Drop**: Easily rearrange your speed dials and move them between groups with intuitive drag and drop functionality
- **Custom Thumbnails**: Upload your own thumbnails, use automatically generated ones, or select from a list of default icons or previously used images
- **Search**: A powerful search bar with a collapsible sidebar for advanced search options
- **Dark Mode Support**: Seamless switching between light and dark themes
- **GitHub Sync**: Synchronize your speed dials across devices using GitHub
- **Settings Menu**: Customize the extension's settings to your liking
- **Loading Skeleton**: A smooth loading experience with a skeleton screen while the extension is initializing

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
git clone https://github.com/CrossEvol/CE-Dial.git
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
