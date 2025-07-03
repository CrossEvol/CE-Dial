import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MultiSelect } from '@/components/multi-select';
import { useBearStore } from '@/store';
import type { DialItem } from '@src/models';
import { useState } from 'react';

interface CopyDialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dial: DialItem;
  onCopy: (selectedGroupIds: string[]) => void;
}

export function CopyDialDialog({ open, onOpenChange, dial, onCopy }: CopyDialDialogProps) {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const { groups } = useBearStore();

  const handleCopy = () => {
    onCopy(selectedGroups);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copy to other groups</DialogTitle>
        </DialogHeader>
        <div className="max-w-xl">
          <MultiSelect
            options={groups
              .filter(g => g.id !== dial.groupId)
              .map(group => ({
                value: group.id!.toString(),
                label: group.name,
                icon: undefined,
              }))}
            onValueChange={setSelectedGroups}
            defaultValue={[]}
            placeholder="Select groups"
            variant="inverted"
            animation={2}
            maxCount={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCopy}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
