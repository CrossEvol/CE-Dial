import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { t } from '@extension/i18n';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { ToggleButton } from '@extension/ui';
import '@src/NewTab.css';
import '@src/NewTab.scss';
import { useState } from 'react';

// Sample bookmark data - you can replace with your actual data structure
const bookmarks = [
  { title: 'GitHub', url: 'github.com', icon: '/icons/github.png' },
  { title: 'OpenAI', url: 'chat.openai.com', icon: '/icons/openai.png' },
  { title: 'Socket.io', url: 'socket.io', icon: '/icons/socketio.png' },
  // Add more bookmarks as needed
];

const NewTab = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      window.location.href = searchUrl;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`min-h-screen p-8 ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      {/* Search bar */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your search..."
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            variant="ghost"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={handleSearch}>
            <SearchIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bookmarks grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {bookmarks.map((bookmark, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <a
                  href={`https://${bookmark.url}`}
                  className="flex flex-col items-center space-y-2"
                  target="_blank"
                  rel="noopener noreferrer">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <img src={bookmark.icon} alt={bookmark.title} className="max-w-full max-h-full" />
                  </div>
                  <span className={`text-sm font-medium ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
                    {bookmark.title}
                  </span>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Theme toggle - keeping this from original code */}
      <div className="fixed bottom-4 right-4">
        <ToggleButton onClick={exampleThemeStorage.toggle}>{t('toggleTheme')}</ToggleButton>
      </div>

      {/* Original content commented out
      <header className={`App-header ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <button onClick={goGithubSite}>
          <img src={chrome.runtime.getURL(logo)} className="App-logo" alt="logo" />
        </button>
        <p>
          Edit <code>pages/new-tab/src/NewTab.tsx</code>
        </p>
        <Button>Click me</Button>
        <h6>The color of this paragraph is defined using SASS.</h6>
      </header>
      */}
    </div>
  );
};

// Helper component for the search icon
const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
  </svg>
);

export default withErrorBoundary(withSuspense(NewTab, <div>{t('loading')}</div>), <div> Error Occur </div>);
