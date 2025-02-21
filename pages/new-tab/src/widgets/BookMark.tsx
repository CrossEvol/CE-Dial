import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit2, MousePointerClick, Trash2 } from 'lucide-react';
import type React from 'react';
import { AddForm } from './AddForm';

export type BookMarkItem = {
  title: string;
  url: string;
  IconComponent: React.ComponentType<{ className?: string }>;
  isDefault: boolean;
  clickCount: number;
};

interface BookmarkProps {
  bookmark: BookMarkItem;
  isLight: boolean;
  bookmarkStats: { [key: string]: number };
  onBookmarkClick: (url: string) => void;
  onEdit: (e: React.MouseEvent, bookmark: BookmarkProps['bookmark']) => void;
  onDelete: (e: React.MouseEvent, bookmark: BookmarkProps['bookmark']) => void;
  onDefaultClick?: () => void;
}

export const Bookmark: React.FC<BookmarkProps> = ({
  bookmark,
  isLight,
  bookmarkStats,
  onBookmarkClick,
  onEdit,
  onDelete,
}) => {
  const bookmarkContent = (
    <Card
      className={`group relative transition-all duration-200 ${
        bookmark.isDefault ? 'hover:bg-blue-100 dark:hover:bg-blue-900' : 'hover:shadow-lg'
      }`}>
      <CardContent className="p-4">
        <div
          className={`w-full flex flex-col items-center space-y-2 ${!bookmark.isDefault ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md' : ''}`}
          aria-label={`${bookmark.isDefault ? 'Add new' : `Open ${bookmark.title}`} bookmark`}>
          <div className="w-16 h-16 flex items-center justify-center">
            {bookmark.IconComponent && (
              <bookmark.IconComponent
                className={`w-12 h-12 transition-colors duration-200 ${
                  isLight ? 'text-gray-600 hover:text-blue-600' : 'text-gray-300 hover:text-blue-400'
                }`}
              />
            )}
          </div>
          <span className={`text-sm font-medium ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>{bookmark.title}</span>

          {/* Hover overlay for non-default bookmarks */}
          {!bookmark.isDefault && (
            <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 rounded-lg">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-white/20 dark:hover:bg-gray-700/50"
                  onClick={e => onEdit(e, bookmark)}
                  aria-label={`Edit ${bookmark.title} bookmark`}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-white/20 dark:hover:bg-gray-700/50"
                  onClick={e => onDelete(e, bookmark)}
                  aria-label={`Delete ${bookmark.title} bookmark`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-center gap-1 text-sm bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-md p-1">
                <MousePointerClick className="h-4 w-4" />
                <span>{bookmarkStats[bookmark.url] || 0} clicks</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (bookmark.isDefault) {
    return <AddForm>{bookmarkContent}</AddForm>;
  }

  return (
    <button
      onClick={() => onBookmarkClick(bookmark.url)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          onBookmarkClick(bookmark.url);
        }
      }}>
      {bookmarkContent}
    </button>
  );
};
