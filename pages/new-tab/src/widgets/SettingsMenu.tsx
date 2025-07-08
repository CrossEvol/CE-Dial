import type { GitHubConfig } from '@extension/shared';
import { exampleThemeStorage, githubConfigStorage } from '@extension/storage';
import yaml from 'js-yaml';
import { Download, FolderUp, KeyRound, RefreshCw, Settings, SunMoon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
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
  const { exportDialsData, exportGithubData, importDialsData, syncDialsData, isSyncConfigured } = useBearStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const githubConfigFileInputRef = useRef<HTMLInputElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!isSyncConfigured()) {
      toast.error('GitHub sync is not configured. Please set the required environment variables.');
      return;
    }

    setIsSyncing(true);
    try {
      await syncDialsData();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(`Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = async () => {
    await exportDialsData();
    await exportGithubData();
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
          importDialsData(jsonData);
        } catch (error) {
          console.error('Failed to parse import file:', error);
          toast.error('Invalid import file format');
        }
      };
      reader.readAsText(file);
      // Reset the input so the same file can be selected again
      event.target.value = '';
    }
  };

  const handleGithubConfigUpload = () => {
    githubConfigFileInputRef.current?.click();
  };

  const handleGithubConfigFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          let jsonData: GitHubConfig;

          // Check file extension to determine parsing method
          if (file.name.toLowerCase().endsWith('.yaml') || file.name.toLowerCase().endsWith('.yml')) {
            // Parse YAML content
            jsonData = yaml.load(e.target?.result as string) as GitHubConfig;
          } else {
            // Parse JSON content
            jsonData = JSON.parse(e.target?.result as string) as GitHubConfig;
          }

          // Validate the config has the required fields
          if (!jsonData.token || !jsonData.owner || !jsonData.repo) {
            toast.error('Invalid GitHub configuration. Please include token, owner, and repo fields.');
            return;
          }

          // Set default pathPrefix if not provided
          if (!jsonData.pathPrefix) {
            jsonData.pathPrefix = '/';
          }

          // Save to storage
          githubConfigStorage.set(jsonData);
          toast.success('GitHub configuration successfully loaded');
        } catch (error) {
          console.error('Failed to parse GitHub config file:', error);
          toast.error('Invalid GitHub configuration file format');
        }
      };
      reader.readAsText(file);
      // Reset the input
      event.target.value = '';
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    const getNextMidnight = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const cstOffset = 8 * 60;
      const localOffset = today.getTimezoneOffset();
      const cstTime = new Date(today.getTime() + (cstOffset + localOffset) * 60 * 1000);
      if (now.getTime() > cstTime.getTime()) {
        cstTime.setDate(cstTime.getDate() + 1);
      }
      return cstTime.getTime();
    };

    const performSync = async () => {
      try {
        await syncDialsData();
        toast.info('Automatic daily sync to GitHub successful.');
      } catch (error) {
        console.error('Automatic daily sync to GitHub failed:', error);
        toast.error('Automatic daily sync failed.');
      }
    };

    const setupDailySync = async () => {
      const configured = await isSyncConfigured();
      if (configured) {
        const now = new Date().getTime();
        const nextMidnight = getNextMidnight();
        const delay = nextMidnight - now;

        timeoutId = setTimeout(() => {
          performSync();
          intervalId = setInterval(performSync, 24 * 60 * 60 * 1000); // Sync every 24 hours
        }, delay);
      }
    };

    setupDailySync();

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isSyncConfigured, syncDialsData]);

  return (
    <>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileChange} />
      <input
        type="file"
        ref={githubConfigFileInputRef}
        style={{ display: 'none' }}
        accept=".json,.yaml,.yml"
        onChange={handleGithubConfigFileChange}
      />
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
            <DropdownMenuItem onClick={handleSync} disabled={isSyncing || !isSyncConfigured()}>
              <RefreshCw className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync to GitHub'}</span>
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleGithubConfigUpload}>
              <KeyRound />
              <span>Github Token</span>
              <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
            </DropdownMenuItem>
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
