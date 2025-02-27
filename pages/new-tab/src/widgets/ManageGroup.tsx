import { Button } from '@/components/ui/button';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { DialItem, GroupItem } from '@src/models';
import { useBearStore } from '@src/store';
import { Edit, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import AddGroup from './AddGroup';
// Import DnD kit components
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
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './sortable-item';

// Define the props interface
interface ManageGroupProps {
  groups: GroupItem[];
  filteredDials: DialItem[];
  handleDeleteGroup: (groupId: number) => void;
  setIsManageGroupDialogOpen: (open: boolean) => void;
  onEditGroup?: (group: GroupItem) => void;
}

const ManageGroup: React.FC<ManageGroupProps> = ({
  groups,
  filteredDials,
  handleDeleteGroup,
  setIsManageGroupDialogOpen,
  onEditGroup,
}) => {
  const [showAddGroupForm, setShowAddGroupForm] = useState(false);
  const setSelectedGroup = useBearStore(state => state.setSelectedGroup);
  const reorderGroups = useBearStore(state => state.reorderGroups);
  // Add state for drag and drop
  const [sortableGroups, setSortableGroups] = useState<GroupItem[]>(groups);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingGroup, setDraggingGroup] = useState<GroupItem | null>(null);

  // Set up sensors for drag and drop with proper configuration
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

  const handleDelete = (groupId: number) => {
    // Don't close the dialog immediately when deleting
    handleDeleteGroup(groupId);
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setIsDragging(true);
    const draggedGroup = sortableGroups.find(group => group.id === Number(active.id));
    if (draggedGroup) {
      setDraggingGroup(draggedGroup);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const updatedGroups = arrayMove(
        sortableGroups,
        sortableGroups.findIndex(item => item.id === Number(active.id)),
        sortableGroups.findIndex(item => item.id === Number(over.id)),
      );

      setSortableGroups(updatedGroups);

      // Save the new order to the database
      reorderGroups(updatedGroups);
    }

    setIsDragging(false);
    setDraggingGroup(null);
  };

  // Update sortableGroups when groups prop changes
  useEffect(() => {
    setSortableGroups(groups);
  }, [groups, setSelectedGroup]);

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Manage Groups</DialogTitle>
      </DialogHeader>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}>
          <SortableContext
            items={sortableGroups.map(group => group.id!.toString())}
            strategy={verticalListSortingStrategy}>
            {sortableGroups.map(group => (
              <SortableItem key={group.id} id={group.id!.toString()}>
                {({ listeners }) => (
                  <div className="flex items-center justify-between p-2 border-b" {...listeners}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id={`group-${group.id}`}
                        checked={group.is_selected}
                        onChange={() => setSelectedGroup(group.id!)}
                        className="h-4 w-4"
                        onPointerDown={e => e.stopPropagation()}
                      />
                      <label htmlFor={`group-${group.id}`} className="font-medium cursor-grab">
                        {group.name} ({filteredDials.filter(dial => dial.groupId === group.id).length})
                      </label>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onEditGroup && onEditGroup(group)}
                        onPointerDown={e => e.stopPropagation()}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(group.id!)}
                        disabled={groups.length <= 1}
                        title={groups.length <= 1 ? 'Cannot delete the last group' : 'Delete group'}
                        onPointerDown={e => e.stopPropagation()}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </SortableItem>
            ))}
          </SortableContext>

          {/* Improved DragOverlay component, but has the strange position did not follow the pointer */}
          {/* <DragOverlay
            className="bg-black right-1/2"
            adjustScale={true}
            dropAnimation={{
              duration: 250,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}
            zIndex={1000}>
            {isDragging && draggingGroup ? (
              <div className="flex items-center justify-between p-2 border bg-white dark:bg-gray-800 rounded shadow-lg w-[300px]">
                <div className="flex items-center gap-2">
                  <input type="radio" checked={draggingGroup.is_selected} readOnly className="h-4 w-4" />
                  <span className="font-medium">
                    {draggingGroup.name} ({filteredDials.filter(dial => dial.groupId === draggingGroup.id).length})
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" tabIndex={-1}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" tabIndex={-1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </DragOverlay> */}
        </DndContext>
      </div>
      <DialogFooter>
        {showAddGroupForm ? (
          <AddGroup isAddGroupDialogOpen={showAddGroupForm} setIsAddGroupDialogOpen={setShowAddGroupForm} />
        ) : (
          <Button onClick={() => setShowAddGroupForm(true)}>Add Group</Button>
        )}
        <Button
          variant="outline"
          onClick={() => {
            // Ensure any pending changes are saved
            if (JSON.stringify(groups.map(g => g.id)) !== JSON.stringify(sortableGroups.map(g => g.id))) {
              reorderGroups(sortableGroups);
            }
            setIsManageGroupDialogOpen(false);
          }}>
          Save
        </Button>
        <Button variant="outline" onClick={() => setIsManageGroupDialogOpen(false)}>
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ManageGroup;
