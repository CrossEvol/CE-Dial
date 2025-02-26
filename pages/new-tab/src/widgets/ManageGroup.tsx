import { Button } from '@/components/ui/button';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { DialItem, GroupItem } from '@src/models';
import { useBearStore } from '@src/store';
import { Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AddGroup from './AddGroup';

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

  const handleDelete = (groupId: number) => {
    // Don't close the dialog immediately when deleting
    handleDeleteGroup(groupId);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Manage Groups</DialogTitle>
      </DialogHeader>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {groups.map(group => (
          <div key={group.id} className="flex items-center justify-between p-2 border-b">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id={`group-${group.id}`}
                checked={group.is_selected}
                onChange={() => setSelectedGroup(group.id!)}
                className="h-4 w-4"
              />
              <label htmlFor={`group-${group.id}`} className="font-medium">
                {group.name} ({filteredDials.filter(dial => dial.groupId === group.id).length})
              </label>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" onClick={() => onEditGroup && onEditGroup(group)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(group.id!)}
                disabled={groups.length <= 1} // Disable if it's the last group
                title={groups.length <= 1 ? 'Cannot delete the last group' : 'Delete group'}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <DialogFooter>
        {showAddGroupForm ? (
          <AddGroup isAddGroupDialogOpen={showAddGroupForm} setIsAddGroupDialogOpen={setShowAddGroupForm} />
        ) : (
          <Button onClick={() => setShowAddGroupForm(true)}>Add Group</Button>
        )}
        <Button variant="outline" onClick={() => setIsManageGroupDialogOpen(false)}>
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
