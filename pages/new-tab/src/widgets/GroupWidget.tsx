import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { DialItem, GroupItem } from '../models';

interface GroupWidgetProps {
  group: GroupItem;
  isLight: boolean;
  filteredDials: DialItem[];
  setSelectedGroup: (groupId: number) => void;
  handleEditGroup: (group: GroupItem) => void;
  handleDeleteGroup: (groupId: number) => void;
  setIsManageGroupDialogOpen: (isOpen: boolean) => void;
}

const GroupWidget = ({
  group,
  isLight,
  filteredDials,
  setSelectedGroup,
  handleEditGroup,
  handleDeleteGroup,
  setIsManageGroupDialogOpen,
}: GroupWidgetProps) => {
  return (
    <ContextMenu>
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
  );
};

export default GroupWidget;
