import { Button } from '@/components/ui/button';
import { t } from '@extension/i18n';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { ToggleButton } from '@extension/ui';
import '@src/NewTab.css';
import '@src/NewTab.scss';
import { Facebook, Github, Plus, Twitter } from 'lucide-react';
import { useState } from 'react';
import type { BookMarkItem } from './widgets/BookMark';
import { Bookmark } from './widgets/BookMark';

// Sample bookmark data with default bookmark at the end
const bookmarks = [
  { title: 'GitHub', url: 'github.com', isDefault: false, IconComponent: Github, clickCount: 0 },
  { title: 'Facebook', url: 'https://www.facebook.com/', isDefault: false, IconComponent: Facebook, clickCount: 0 },
  { title: 'Twitter', url: 'https://x.com/', isDefault: false, IconComponent: Twitter, clickCount: 0 },
  {
    title: 'Default',
    url: 'example.com',
    isDefault: true,
    IconComponent: Plus,
    clickCount: 0,
  },
  // Add more bookmarks as needed
];

// Add this type definition at the top of the file
interface BookmarkStats {
  [key: string]: number;
}

const NewTab = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');

  // Update the bookmarkStats state definition
  const [bookmarkStats, setBookmarkStats] = useState<BookmarkStats>(
    bookmarks.reduce(
      (acc, bookmark) => ({
        ...acc,
        [bookmark.url]: bookmark.clickCount,
      }),
      {} as BookmarkStats,
    ),
  );

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

  const handleBookmarkClick = (url: string) => {
    setBookmarkStats(prev => ({
      ...prev,
      [url]: (prev[url] || 0) + 1,
    }));
    window.open(`https://${url}`, '_blank');
  };

  const handleEdit = (e: React.MouseEvent, bookmark: BookMarkItem) => {
    e.preventDefault();
    e.stopPropagation();
    // Add edit logic here
    console.log('Edit bookmark:', bookmark.title);
  };

  const handleDelete = (e: React.MouseEvent, bookmark: BookMarkItem) => {
    e.preventDefault();
    e.stopPropagation();
    // Add delete logic here
    console.log('Delete bookmark:', bookmark.title);
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
            <Bookmark
              key={index}
              bookmark={bookmark}
              isLight={isLight}
              bookmarkStats={bookmarkStats}
              onBookmarkClick={handleBookmarkClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* Theme toggle - keeping this from original code */}
      <div className="fixed bottom-4 right-4">
        <ToggleButton onClick={exampleThemeStorage.toggle}>{t('toggleTheme')}</ToggleButton>
      </div>
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
