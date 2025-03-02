import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { DialItem, ThumbSourceType } from '@/models/DialItem';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { defaultIcons } from '@src/lib/defaultIcons';
import { useBearStore } from '@src/store';
import { Edit2, MousePointerClick, Trash2 } from 'lucide-react';
import type React from 'react';

export type BookMarkItem = {
  id?: number;
  title: string;
  url: string;
  IconComponent?: React.ComponentType<{ className?: string }>;
  isDefault: boolean;
  clickCount: number;
  thumbSourceType?: ThumbSourceType;
  thumbUrl?: string;
  thumbData?: string;
  thumbIndex?: number;
};

interface BookmarkProps {
  bookmark: BookMarkItem;
  onEditDialOpen?: (dial: DialItem) => void;
  onDefaultClick?: () => void;
}

export const Bookmark: React.FC<BookmarkProps> = ({ bookmark, onEditDialOpen }) => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const { deleteDial, dials, updateDial } = useBearStore();

  // Handle bookmark click - opens the URL and updates click count
  const handleBookmarkClick = () => {
    if (bookmark.id) {
      // Update click count in the store
      updateDial(bookmark.id, {
        clickCount: (bookmark.clickCount || 0) + 1,
      });
    }

    // Open the URL in a new tab
    window.open(`https://${bookmark.url}`, '_blank');
  };

  // Handle edit click
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (bookmark.isDefault) return;

    // Find the corresponding dial item
    const dialToEdit = dials.find(dial => dial.id === bookmark.id);
    if (dialToEdit && onEditDialOpen) {
      onEditDialOpen(dialToEdit);
    }
  };

  // Handle delete click
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (bookmark.isDefault) return;

    if (window.confirm(`Are you sure you want to delete "${bookmark.title}"?`)) {
      // Call the deleteDial function from the store
      if (bookmark.id) {
        await deleteDial(bookmark.id);
      }
    }
  };

  // Function to render the appropriate thumbnail/icon based on thumbSourceType
  const renderThumbnail = () => {
    const iconClassName = `transition-colors duration-200 ${
      isLight ? 'text-gray-600 hover:text-blue-600' : 'text-gray-300 hover:text-blue-400'
    }`;

    // Handle different thumbnail source types
    if (bookmark.thumbSourceType) {
      switch (bookmark.thumbSourceType) {
        case 'remote':
          // First check if we have the image data stored locally
          if (bookmark.thumbData) {
            return <img src={bookmark.thumbData} alt={bookmark.title} className="w-36 h-auto object-contain" />;
          } else if (bookmark.thumbUrl) {
            // Fallback to remote URL if no local data is available
            return (
              <img
                src={bookmark.thumbUrl}
                alt={bookmark.title}
                className="w-36 h-auto object-contain"
                onError={e => {
                  // Fallback to default icon on error
                  (e.target as HTMLImageElement).style.display = 'none';
                  // Show default icon or placeholder
                }}
              />
            );
          }
          break;
        case 'upload':
          if (bookmark.thumbData) {
            return <img src={bookmark.thumbData} alt={bookmark.title} className="w-36 h-auto object-contain" />;
          }
          break;
        case 'default':
          if (typeof bookmark.thumbIndex === 'number' && defaultIcons[bookmark.thumbIndex]) {
            return <div className={`${iconClassName}`}>{defaultIcons[bookmark.thumbIndex].icon}</div>;
          }
          break;
        case 'auto': {
          // For auto, use the favicon from the URL
          const faviconUrl = `https://www.google.com/s2/favicons?domain=${bookmark.url}&sz=64`;
          return (
            <img
              src={faviconUrl}
              alt={bookmark.title}
              className="w-36 h-auto object-contain"
              onError={e => {
                // Fallback to default icon on error
                (e.target as HTMLImageElement).style.display = 'none';
                // Show a default icon instead
              }}
            />
          );
        }
      }
    }

    // If it's a default bookmark with IconComponent, use that
    if (bookmark.isDefault && bookmark.IconComponent) {
      return <bookmark.IconComponent className={`w-16 h-16 ${iconClassName}`} />;
    }

    // Fallback to using IconComponent if available or a default icon
    if (bookmark.IconComponent) {
      return <bookmark.IconComponent className={`w-16 h-16 ${iconClassName}`} />;
    }

    // Ultimate fallback - use Link icon
    return defaultIcons[14].icon;
  };

  const bookmarkContent = (
    <Card
      className={`group relative transition-all duration-200 w-full h-32 ${
        bookmark.isDefault ? 'hover:bg-blue-100 dark:hover:bg-blue-900' : 'hover:shadow-lg'
      }`}>
      <CardContent className="p-4 h-full flex flex-col items-center justify-center">
        <div
          className={`w-full h-full flex flex-col items-center justify-center space-y-1 ${!bookmark.isDefault ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md' : ''}`}
          aria-label={`${bookmark.isDefault ? 'Add new' : `Open ${bookmark.title}`} bookmark`}>
          <div className="w-20 h-20 flex items-center justify-center">{renderThumbnail()}</div>
          <span className={`text-sm font-medium ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>{bookmark.title}</span>

          {/* Hover overlay for non-default bookmarks */}
          {!bookmark.isDefault && (
            <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 rounded-lg">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-white/20 dark:hover:bg-gray-700/50"
                  onClick={handleEdit}
                  aria-label={`Edit ${bookmark.title} bookmark`}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-white/20 dark:hover:bg-gray-700/50"
                  onClick={handleDelete}
                  aria-label={`Delete ${bookmark.title} bookmark`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-center gap-1 text-sm bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-md p-1">
                <MousePointerClick className="h-4 w-4" />
                <span>{bookmark.clickCount || 0} clicks</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <button
      className="w-full"
      onClick={handleBookmarkClick}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          handleBookmarkClick();
        }
      }}>
      {bookmarkContent}
    </button>
  );
};
