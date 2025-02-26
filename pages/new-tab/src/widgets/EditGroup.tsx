import { Button } from '@/components/ui/button';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { GroupItem } from '@src/models';
import { useState } from 'react';

interface EditGroupProps {
  group: GroupItem;
  onUpdate: (updatedGroup: GroupItem) => void;
  setIsEditGroupDialogOpen: (open: boolean) => void;
}

const EditGroup: React.FC<EditGroupProps> = ({ group, onUpdate, setIsEditGroupDialogOpen }) => {
  // const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState(group.name);

  const handleUpdateGroup = () => {
    if (groupName.trim()) {
      onUpdate({ ...group, name: groupName });
      setGroupName('');
      setIsEditGroupDialogOpen(false);
    }
  };

  return (
    <>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="group-name" className="text-right">
              Name
            </Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEditGroupDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateGroup}>Update Group</Button>
        </DialogFooter>
      </DialogContent>
    </>
  );
};

export default EditGroup;
