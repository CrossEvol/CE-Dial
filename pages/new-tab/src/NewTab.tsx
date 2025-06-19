import { Button } from '@/components/ui/button';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import '@src/NewTab.css';
import '@src/NewTab.scss';
import { CircleArrowOutUpRight, Facebook, Github, Goal, ImagePlay, Plus, Twitter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bounce, toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useBearStore } from './store';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Droppable } from './widgets/droppable';
import GroupWidget from './widgets/GroupWidget';
import { SettingsMenu } from './widgets/SettingsMenu';
import { SortableItem } from './widgets/sortable-item';

// Import the Skeleton component
import { Skeleton } from '@/components/ui/skeleton';

const GROUP = 'group::';

function groupKey(id: number | string) {
  return `${GROUP}${id}`;
}

function isGroupKey(key: string) {
  return key.includes(GROUP);
}

const NewTab = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [isAddDialDialogOpen, setIsAddDialDialogOpen] = useState(false);
  const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = useState(false);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [isManageGroupDialogOpen, setIsManageGroupDialogOpen] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<GroupItem | null>(null);

  // Add new state for editing dials
  const [isEditDialDialogOpen, setIsEditDialDialogOpen] = useState(false);
  const [selectedDialForEdit, setSelectedDialForEdit] = useState<DialItem | null>(null);

  // Add state for drag and drop
  const [_isDragging, setIsDragging] = useState(false);
  const [_draggingDial, setDraggingDial] = useState<DialItem | null>(null);

  // Get groups, dials, and the necessary methods from the store
  const {
    groups,
    dials,
    initGroups,
    initDials,
    setSelectedGroup,
    deleteGroup,
    reorderDials,
    updateDial,
    getFilteredDials,
  } = useBearStore();

  // Use the filtered dials selector instead of filtering locally
  const filteredDials = getFilteredDials();

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
    initGroups();
    initDials();
  }, [initGroups, initDials]);

  // Set the first group as selected by default when groups are loaded
  useEffect(() => {
    if (groups.length > 0 && !groups.some(group => group.is_selected)) {
      setSelectedGroup(groups[0].id!);
    }
  }, [groups, setSelectedGroup]);

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

  const handleDeleteGroup = async (groupId: number) => {
    // Check if this is the last group
    if (groups.length <= 1) {
      toast.error("You can't delete the last group. At least one group must exist.");
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

      toast.success('Group deleted successfully');
    }
  };

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

    if (over && isGroupKey(over?.id as string)) {
      // Extract group ID from the over.id (format: "group::123")
      const groupIdString = (over.id as string).replace(GROUP, '');
      const destGroupId = parseInt(groupIdString, 10);

      // Get the active dial's ID
      const dialId = Number(active.id);
      const dialToMove = dials.find(dial => dial.id === dialId);

      if (dialToMove && destGroupId !== dialToMove.groupId) {
        // Find the maximum position in the destination group
        const dialsInDestGroup = dials.filter(dial => dial.groupId === destGroupId);
        const maxPos = dialsInDestGroup.length > 0 ? Math.max(...dialsInDestGroup.map(d => d.pos || 0)) + 1 : 0;

        // Update the dial with new groupId and position
        updateDial(dialId, {
          groupId: destGroupId,
          pos: maxPos,
        });
      }
    } else if (over && active.id !== over.id) {
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

  // Handle opening the edit dialog for a dial
  const handleEditDialOpen = (dialToEdit: DialItem) => {
    setSelectedDialForEdit(dialToEdit);
    setIsEditDialDialogOpen(true);
  };

  return (
    <div className={`min-h-screen p-8 ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isLight ? 'light' : 'dark'}
        transition={Bounce}
        style={{ zIndex: 9999 }}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}>
        {/* Groups navigation */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex flex-wrap gap-1 pb-2">
            {groups.map(group => (
              <Droppable key={groupKey(group.id!)} id={groupKey(group.id!)}>
                <GroupWidget
                  key={group.id}
                  group={group}
                  handleEditGroup={handleEditGroup}
                  handleDeleteGroup={handleDeleteGroup}
                  setIsManageGroupDialogOpen={setIsManageGroupDialogOpen}
                />
              </Droppable>
            ))}

            {/* Add Group Button */}
            <AddGroup isAddGroupDialogOpen={isAddGroupDialogOpen} setIsAddGroupDialogOpen={setIsAddGroupDialogOpen} />
          </div>
        </div>

        {/* Search bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="relative">
            {/* Add dropdown menu here */}
            <div className="absolute -left-[52px] top-1/2 transform -translate-y-1/2 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <CircleArrowOutUpRight />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => window.open('https://www.google.com', '_blank')}>
                    <Goal />
                    <span>Google Search</span>
                    <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open('https://images.google.com', '_blank')}>
                    <ImagePlay />
                    <span>Google Images</span>
                    <DropdownMenuShortcut>⌘I</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your search..."
              className="w-full px-4 py-2 rounded-lg text-base border focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              variant="link"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={handleSearch}>
              <SearchIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Bookmarks grid */}
        <div className="max-w-6xl mx-auto">
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
                            onEditDialOpen={handleEditDialOpen}
                          />
                        </div>
                      )}
                    </SortableItem>
                  ))}
                  <div
                    role="button"
                    onKeyPress={() => {}}
                    tabIndex={0}
                    className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed h-32 w-full"
                    onClick={() => setIsAddDialDialogOpen(true)}>
                    <Plus size={24} className={isLight ? 'text-gray-600' : 'text-gray-300'} />
                    <span className={`mt-2 text-sm ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>Add Bookmark</span>
                  </div>
                  <AddDial open={isAddDialDialogOpen} onOpenChange={setIsAddDialDialogOpen}></AddDial>
                </>
              ) : (
                <>
                  <div
                    role="button"
                    onKeyPress={() => {}}
                    tabIndex={0}
                    className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed h-32 w-full"
                    onClick={() => setIsAddDialDialogOpen(true)}>
                    <Plus size={24} className={isLight ? 'text-gray-600' : 'text-gray-300'} />
                    <span className={`mt-2 text-sm ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>Add Bookmark</span>
                  </div>
                  <AddDial open={isAddDialDialogOpen} onOpenChange={setIsAddDialDialogOpen}></AddDial>
                </>
              )}
            </div>
          </SortableContext>
        </div>
      </DndContext>

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

      <Dialog
        open={isEditGroupDialogOpen}
        onOpenChange={open => {
          if (!open) {
            setSelectedGroupForEdit(null);
          }
          setIsEditGroupDialogOpen(open);
        }}>
        {selectedGroupForEdit && <EditGroup group={selectedGroupForEdit} onClose={setIsEditGroupDialogOpen} />}
      </Dialog>

      {/* Add dialog for editing dials */}
      <Dialog
        open={isEditDialDialogOpen}
        onOpenChange={open => {
          if (!open) {
            setSelectedDialForEdit(null);
          }
          setIsEditDialDialogOpen(open);
        }}>
        {selectedDialForEdit && <EditDial dial={selectedDialForEdit} onClose={setIsEditDialDialogOpen} />}
      </Dialog>

      {/* Theme toggle - keeping this from original code */}
      <div className="w-52 fixed bottom-4 right-8">
        <SettingsMenu />
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

// Create a LoadingSkeleton component
const LoadingSkeleton = () => {
  const isLight = true; // Default to light theme for loading state

  return (
    <div className={`min-h-screen p-8 ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      {/* Groups navigation skeleton */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-wrap gap-1 pb-2">
          {/* Group tabs skeleton */}
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-10 w-24 rounded-md" />
          ))}
          {/* Add group button skeleton */}
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="relative">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>

      {/* Bookmarks grid skeleton */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Generate 11 bookmark skeletons + 1 add button */}
          {Array(11)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          <Skeleton className="h-32 w-full rounded-lg border-2 border-dashed" />
        </div>
      </div>

      {/* Settings button skeleton */}
      <div className="w-52 fixed bottom-4 right-8">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(NewTab, <LoadingSkeleton />), <div> Error Occur </div>);
