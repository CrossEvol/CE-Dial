import { exampleThemeStorage } from '@extension/storage';
import { Download, FolderUp, Settings, SunMoon } from 'lucide-react';
import { useRef } from 'react';
import { useBearStore } from '../store';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function SettingsMenu() {
  const { exportData, importData } = useBearStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportData();
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          importData(jsonData);
        } catch (error) {
          console.error('Failed to parse import file:', error);
          alert('Invalid import file format');
        }
      };
      reader.readAsText(file);
      // Reset the input so the same file can be selected again
      event.target.value = '';
    }
  };

  return (
    <>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileChange} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={'lg'} className="w-full">
            <Settings /> <span>Settings</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>My Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleExport}>
              <Download />
              <span>Export</span>
              <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImport}>
              <FolderUp />
              <span>Import</span>
              <DropdownMenuShortcut>⌘I</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exampleThemeStorage.toggle}>
              <SunMoon />
              <span>Toggle Theme</span>
              <DropdownMenuShortcut>⌘T</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
