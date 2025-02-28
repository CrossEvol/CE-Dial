import {
  Camera,
  ClipboardCopy,
  ClipboardPaste,
  Copy,
  Download,
  Edit,
  FileCheck,
  FileEdit,
  FilePlus,
  FileText,
  Home,
  Link,
  Mail,
  Save,
  Search,
  Settings,
  Share,
  Trash,
  Upload,
  User,
} from 'lucide-react';

// Create a type for our icon data
export type IconData = {
  icon: React.ReactNode;
  name: string;
};

export const defaultIcons: IconData[] = [
  { icon: <Camera size={24} />, name: 'Camera' },
  { icon: <Share size={24} />, name: 'Share' },
  { icon: <ClipboardCopy size={24} />, name: 'Copy' },
  { icon: <ClipboardPaste size={24} />, name: 'Paste' },
  { icon: <FileText size={24} />, name: 'File' },
  { icon: <FilePlus size={24} />, name: 'Add File' },
  { icon: <FileEdit size={24} />, name: 'Edit File' },
  { icon: <FileCheck size={24} />, name: 'Check File' },
  { icon: <Download size={24} />, name: 'Download' },
  { icon: <Upload size={24} />, name: 'Upload' },
  { icon: <Save size={24} />, name: 'Save' },
  { icon: <Trash size={24} />, name: 'Delete' },
  { icon: <Edit size={24} />, name: 'Edit' },
  { icon: <Copy size={24} />, name: 'Copy' },
  { icon: <Link size={24} />, name: 'Link' },
  { icon: <Search size={24} />, name: 'Search' },
  { icon: <Settings size={24} />, name: 'Settings' },
  { icon: <User size={24} />, name: 'User' },
  { icon: <Mail size={24} />, name: 'Mail' },
  { icon: <Home size={24} />, name: 'Home' },
];
