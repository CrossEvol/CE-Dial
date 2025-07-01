import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { cn } from '@src/lib/utils';
import type { DialItem } from '@src/models';
import { ChevronsDownUp, ChevronsUpDown, PanelLeftOpen } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useBearStore } from '../store';

interface SearchSideBarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const SearchSideBar = ({ isSidebarOpen, setIsSidebarOpen }: SearchSideBarProps) => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [openCollapsible, setOpenCollapsible] = useState<Record<string, boolean>>({});

  const { dials, groups } = useBearStore();

  const searchResults = useMemo(() => {
    if (!sidebarSearchQuery.trim()) {
      return {};
    }

    const lowerCaseQuery = sidebarSearchQuery.toLowerCase();
    const filtered = dials.filter(
      dial => dial.title.toLowerCase().includes(lowerCaseQuery) || dial.url.toLowerCase().includes(lowerCaseQuery),
    );

    const groupedByGroup = filtered.reduce(
      (acc, dial) => {
        const group = groups.find(g => g.id === dial.groupId);
        const groupName = group ? group.name : 'Unknown Group';
        if (!acc[groupName]) {
          acc[groupName] = [];
        }
        acc[groupName].push(dial);
        return acc;
      },
      {} as Record<string, DialItem[]>,
    );

    // Sort group names alphabetically
    const sortedGroupNames = Object.keys(groupedByGroup).sort((a, b) => a.localeCompare(b));

    const sortedGroupedResults: Record<string, DialItem[]> = {};
    for (const groupName of sortedGroupNames) {
      sortedGroupedResults[groupName] = groupedByGroup[groupName];
    }

    return sortedGroupedResults;
  }, [sidebarSearchQuery, dials, groups]);

  useEffect(() => {
    setOpenCollapsible(prev => {
      const newStates = { ...prev };
      let hasChanged = false;
      Object.keys(searchResults).forEach(groupName => {
        if (newStates[groupName] === undefined) {
          newStates[groupName] = true; // Default new groups to open
          hasChanged = true;
        }
      });
      return hasChanged ? newStates : prev;
    });
  }, [searchResults]);

  const handleToggleAll = (open: boolean) => {
    const newStates: Record<string, boolean> = {};
    Object.keys(searchResults).forEach(groupName => {
      newStates[groupName] = open;
    });
    setOpenCollapsible(newStates);
  };

  if (!isSidebarOpen) {
    return (
      <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
        <PanelLeftOpen />
      </Button>
    );
  }

  return (
    <div className={`flex items-start ${isLight ? 'text-gray-800' : 'text-white'}`}>
      <Card
        className={cn(
          'w-full',
          isLight ? 'bg-white border-gray-200 text-gray-500' : 'bg-gray-900 border-gray-700 text-gray-400',
          'min-h-96',
        )}>
        <CardHeader className="p-4 pb-2 w-full">
          <CardTitle className={cn('text-sm font-bold', isLight ? 'text-gray-500' : 'text-gray-400')}>
            {/* SideBar */}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 w-full">
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="sidebar-search" className={cn(isLight ? 'text-gray-600' : 'text-gray-500')}>
              Search Dials
            </Label>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleToggleAll(true)}
                title="Expand all">
                <ChevronsUpDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleToggleAll(false)}
                title="Collapse all">
                <ChevronsDownUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Input
            id="sidebar-search"
            placeholder="Search dials..."
            value={sidebarSearchQuery}
            onChange={e => setSidebarSearchQuery(e.target.value)}
            className={cn('mb-4', isLight ? '' : 'bg-gray-800 border-gray-600')}
          />
          <div className="space-y-1">
            {Object.keys(searchResults).length === 0 && sidebarSearchQuery ? (
              <p className={cn('text-sm', isLight ? 'text-gray-500' : 'text-gray-400')}>No results found.</p>
            ) : (
              Object.entries(searchResults).map(([groupName, dialsInGroup]) => (
                <Collapsible
                  key={groupName}
                  open={openCollapsible[groupName]}
                  onOpenChange={isOpen => setOpenCollapsible(prev => ({ ...prev, [groupName]: isOpen }))}
                  className="w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">
                      {groupName} ({dialsInGroup.length})
                    </h4>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-9 p-0">
                        <ChevronsUpDown className="h-4 w-4" />
                        <span className="sr-only">Toggle</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <ul className="pl-4 mt-2 space-y-1">
                      {dialsInGroup.map(dial => (
                        <li key={dial.id} className="text-sm truncate">
                          <a
                            href={dial.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={dial.title}
                            className={cn('hover:underline', isLight ? 'text-gray-800' : 'text-gray-300')}>
                            {dial.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
