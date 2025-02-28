import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { ToggleButton } from '@extension/ui';
import '@src/NewTab.css';
import '@src/NewTab.scss';
import { Facebook, Github, Plus, Twitter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useBearStore } from './store';
import type { BookMarkItem } from './widgets/BookMark';
import { Bookmark } from './widgets/BookMark';

// Import the new components
import AddGroup from './widgets/AddGroup';
import ManageGroup from './widgets/ManageGroup';

// Import Dialog components
import { Dialog } from '@/components/ui/dialog';
import type { DialItem, GroupItem } from './models';
import { AddDial } from './widgets/AddDial';
import EditDial from './widgets/EditDial';
import EditGroup from './widgets/EditGroup';

// Import dnd-kit components
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { SortableItem } from './widgets/sortable-item';

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

  // Dialog states
  const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = useState(false);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [isManageGroupDialogOpen, setIsManageGroupDialogOpen] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<GroupItem | null>(null);

  // Add new state for editing dials
  const [isEditDialDialogOpen, setIsEditDialDialogOpen] = useState(false);
  const [selectedDialForEdit, setSelectedDialForEdit] = useState<DialItem | null>(null);

  // Add state for drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const [draggingDial, setDraggingDial] = useState<DialItem | null>(null);

  // Get groups, dials, and the necessary methods from the store
  const { groups, dials, fetchGroups, fetchDials, setSelectedGroup, deleteGroup, reorderDials } = useBearStore();

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Add activationConstraint to prevent interference with button clicks
      activationConstraint: {
        distance: 5, // Only start dragging after moving 5px
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Fetch groups and dials on component mount
  useEffect(() => {
    fetchGroups();
    fetchDials();
  }, [fetchGroups, fetchDials]);

  // Set the first group as selected by default when groups are loaded
  useEffect(() => {
    if (groups.length > 0 && !groups.some(group => group.is_selected)) {
      setSelectedGroup(groups[0].id!);
    }
  }, [groups, setSelectedGroup]);

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

    // Find the corresponding dial item
    const dialToEdit = dials.find(dial => dial.id === bookmark.id);
    if (dialToEdit) {
      setSelectedDialForEdit(dialToEdit);
      setIsEditDialDialogOpen(true);
    }
  };

  const handleDelete = (e: React.MouseEvent, bookmark: BookMarkItem) => {
    e.preventDefault();
    e.stopPropagation();
    // Add delete logic here
    console.log('Delete bookmark:', bookmark.title);
  };

  const handleDeleteGroup = async (groupId: number) => {
    // Check if this is the last group
    if (groups.length <= 1) {
      alert("You can't delete the last group. At least one group must exist.");
      return;
    }

    // Confirm deletion
    if (window.confirm('Are you sure you want to delete this group?\nAll bookmarks in this group will be deleted.')) {
      await deleteGroup(groupId);

      // If the deleted group was selected, select another group
      const wasSelected = groups.find(g => g.id === groupId)?.is_selected;
      if (wasSelected && groups.length > 0) {
        // Find the first available group that's not the one being deleted
        const nextGroup = groups.find(g => g.id !== groupId);
        if (nextGroup) {
          setSelectedGroup(nextGroup.id!);
        }
      }
    }
  };

  // Get the selected group ID
  const selectedGroupId = groups.find(group => group.is_selected)?.id;

  // Filter dials based on selected group
  const filteredDials = selectedGroupId ? dials.filter(dial => dial.groupId === selectedGroupId) : dials;

  const handleEditGroup = (group: GroupItem) => {
    setSelectedGroupForEdit(group);
    setIsEditGroupDialogOpen(true);
    setIsManageGroupDialogOpen(false); // Close the manage dialog when opening edit dialog
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setIsDragging(true);
    const draggedDial = dials.find(dial => dial.id === Number(active.id));
    if (draggedDial) {
      setDraggingDial(draggedDial);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const updatedDials = arrayMove(
        filteredDials,
        filteredDials.findIndex(item => item.id === Number(active.id)),
        filteredDials.findIndex(item => item.id === Number(over.id)),
      );

      // Save the new order to the database
      reorderDials(updatedDials);
    }

    setIsDragging(false);
    setDraggingDial(null);
  };

  return (
    <div className={`min-h-screen p-8 ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      {/* Groups navigation */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex space-x-1 overflow-x-auto pb-2">
          {groups.map(group => (
            <ContextMenu key={group.id}>
              <ContextMenuTrigger>
                <button
                  onClick={() => setSelectedGroup(group.id!)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    group.is_selected
                      ? isLight
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : isLight
                        ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}>
                  {group.name} ({filteredDials.filter(dial => dial.groupId === group.id).length})
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuCheckboxItem checked={group.is_selected} onClick={() => setSelectedGroup(group.id!)}>
                  Selected
                </ContextMenuCheckboxItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => handleEditGroup(group)}>Edit</ContextMenuItem>
                <ContextMenuItem onClick={() => handleDeleteGroup(group.id!)}>Delete</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => setIsManageGroupDialogOpen(true)}>Manage Groups</ContextMenuItem>
                <ContextMenuItem disabled onClick={() => handleDeleteGroup(group.id!)}>
                  Delete All
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}

          {/* Add Group Button */}
          <AddGroup isAddGroupDialogOpen={isAddGroupDialogOpen} setIsAddGroupDialogOpen={setIsAddGroupDialogOpen} />
        </div>
      </div>

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}>
          <SortableContext items={filteredDials.map(dial => dial.id!.toString())} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {filteredDials.length > 0 ? (
                <>
                  {filteredDials.map(dial => (
                    <SortableItem key={dial.id} id={dial.id!.toString()}>
                      {({ listeners }) => (
                        <div {...listeners}>
                          <Bookmark
                            bookmark={{
                              id: dial.id,
                              title: dial.title,
                              url: dial.url,
                              isDefault: false,
                              IconComponent: getIconForUrl(dial.url),
                              clickCount: dial.clickCount,
                              thumbSourceType: dial.thumbSourceType,
                              thumbUrl: dial.thumbUrl,
                              thumbData: dial.thumbData,
                              thumbIndex: dial.thumbIndex,
                            }}
                            isLight={isLight}
                            bookmarkStats={{ [dial.url]: dial.clickCount }}
                            onBookmarkClick={handleBookmarkClick}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            shouldRender={true}
                          />
                        </div>
                      )}
                    </SortableItem>
                  ))}
                  <AddDial>
                    <div className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed h-32 w-full">
                      <Plus size={24} className={isLight ? 'text-gray-600' : 'text-gray-300'} />
                      <span className={`mt-2 text-sm ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
                        Add Bookmark
                      </span>
                    </div>
                  </AddDial>
                </>
              ) : (
                <>
                  <AddDial>
                    <div className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed h-32 w-full">
                      <Plus size={24} className={isLight ? 'text-gray-600' : 'text-gray-300'} />
                      <span className={`mt-2 text-sm ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
                        Add Bookmark
                      </span>
                    </div>
                  </AddDial>
                </>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Dialogs */}
      <Dialog open={isManageGroupDialogOpen} onOpenChange={setIsManageGroupDialogOpen}>
        <ManageGroup
          groups={groups}
          filteredDials={filteredDials}
          handleDeleteGroup={handleDeleteGroup}
          setIsManageGroupDialogOpen={setIsManageGroupDialogOpen}
          onEditGroup={handleEditGroup}
        />
      </Dialog>

      <Dialog open={isEditGroupDialogOpen} onOpenChange={setIsEditGroupDialogOpen}>
        {selectedGroupForEdit && (
          <EditGroup group={selectedGroupForEdit} setIsEditGroupDialogOpen={setIsEditGroupDialogOpen} />
        )}
      </Dialog>

      {/* Add dialog for editing dials */}
      <Dialog open={isEditDialDialogOpen} onOpenChange={setIsEditDialDialogOpen}>
        {selectedDialForEdit && <EditDial dial={selectedDialForEdit} setIsEditDialogOpen={setIsEditDialDialogOpen} />}
      </Dialog>

      {/* Theme toggle - keeping this from original code */}
      <div className="fixed bottom-4 right-4">
        <ToggleButton onClick={exampleThemeStorage.toggle}>Toggle Theme</ToggleButton>
      </div>
    </div>
  );
};

// Helper function to get an icon component based on URL
const getIconForUrl = (url: string) => {
  if (url.includes('github')) return Github;
  if (url.includes('facebook')) return Facebook;
  if (url.includes('twitter') || url.includes('x.com')) return Twitter;
  return Plus; // Default icon
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

export default withErrorBoundary(withSuspense(NewTab, <div>{'Loading'}</div>), <div> Error Occur </div>);
