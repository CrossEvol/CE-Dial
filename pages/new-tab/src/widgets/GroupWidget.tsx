import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { useBearStore } from '@src/store';
import type { GroupItem } from '../models';

interface GroupWidgetProps {
  group: GroupItem;
  handleEditGroup: (group: GroupItem) => void;
  handleDeleteGroup: (groupId: number) => void;
  setIsManageGroupDialogOpen: (isOpen: boolean) => void;
}

const GroupWidget = ({ group, handleEditGroup, handleDeleteGroup, setIsManageGroupDialogOpen }: GroupWidgetProps) => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const setSelectedGroup = useBearStore(state => state.setSelectedGroup);
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <button
          onClick={() => setSelectedGroup(group.id!)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors min-w-20 ${
            group.is_selected
              ? isLight
                ? 'bg-blue-600 text-white'
                : 'bg-blue-500 text-white'
              : isLight
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}>
          {group.name}
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
  );
};

export default GroupWidget;
