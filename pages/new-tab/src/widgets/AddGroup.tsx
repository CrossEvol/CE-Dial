import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useBearStore } from '@/store';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import type { EmojiClickData } from 'emoji-picker-react';
import EmojiPicker from 'emoji-picker-react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

// Define props interface to fix the type error
interface AddGroupProps {
  isAddGroupDialogOpen?: boolean;
  setIsAddGroupDialogOpen?: (open: boolean) => void;
}

const AddGroup: React.FC<AddGroupProps> = ({
  isAddGroupDialogOpen: externalOpen,
  setIsAddGroupDialogOpen: setExternalOpen,
}) => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  // Use internal state if external state is not provided
  const [internalOpen, setInternalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [addPosition, setAddPosition] = useState<'top' | 'bottom'>('bottom');

  // Get the addGroup function from the store
  const { addGroup } = useBearStore();

  // Use external or internal state based on what's provided
  const isAddGroupDialogOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsAddGroupDialogOpen = setExternalOpen || setInternalOpen;

  const handleAddGroup = async () => {
    if (newGroupName.trim()) {
      try {
        // Call the addGroup function from the store
        await addGroup(newGroupName.trim(), addPosition);

        // Reset form and close dialog
        setNewGroupName('');
        setIsAddGroupDialogOpen(false);
      } catch (error) {
        console.error('Error adding group:', error);
      }
    }
  };

  return (
    <>
      <Dialog open={isAddGroupDialogOpen} onOpenChange={setIsAddGroupDialogOpen}>
        <DialogTrigger asChild>
          <button
            onClick={() => setIsAddGroupDialogOpen(true)}
            className={`px-4 rounded-md text-sm font-medium border-dashed border-2 ${
              isLight ? ' hover:bg-gray-300' : ' hover:bg-gray-600'
            }`}>
            <div className="flex items-center">
              <Plus className="inline-block" />
            </div>
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Group</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Emoji</Label>
                <div className="col-span-3">
                  <EmojiPicker
                    onEmojiClick={(emojiObject: EmojiClickData) => {
                      setNewGroupName(prev => prev + emojiObject.emoji);
                    }}
                    reactionsDefaultOpen={true}
                    allowExpandReactions={true}
                    width="100%"
                    height={500}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Add To</Label>
              <RadioGroup
                value={addPosition}
                onValueChange={setAddPosition as (value: string) => void}
                className="col-span-3 flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="top" id="top" />
                  <Label htmlFor="top">Top</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bottom" id="bottom" />
                  <Label htmlFor="bottom">Bottom</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGroup}>Add Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddGroup;
