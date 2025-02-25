import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ThumbSourceType } from '@/models';
import { useBearStore } from '@/store';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

export const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL' }),
  title: z.string().min(1, { message: 'Title is required' }),
  group: z.string(),
  previewType: z.enum(['auto', 'remote', 'upload', 'default']),
  previewUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddFormProps {
  children?: React.ReactNode;
}

// Create a type for our icon data
type IconData = {
  icon: React.ReactNode;
  name: string;
};

const defaultIcons: IconData[] = [
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

export function AddForm({ children }: AddFormProps) {
  const [previewFile, setPreviewFile] = useState<(File & { preview: string }) | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<IconData | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      title: '',
      group: 'Default',
      previewType: 'auto',
      previewUrl: '',
    },
  });

  const addDial = useBearStore(state => state.addDial);
  const groups = useBearStore(state => state.groups);

  const onSubmit = async (data: FormValues) => {
    console.log('Form submitted:', data);

    // Prepare the dial data based on the form values
    const dialData = {
      url: data.url,
      title: data.title,
      groupId: parseInt(data.group), // Assuming group is stored as the ID
      thumbSourceType: data.previewType as ThumbSourceType,
      thumbUrl: '',
      thumbData: '',
      thumbIndex: -1,
      pos: -1,
    };

    // Add additional data based on the preview type
    if (data.previewType === 'remote' && data.previewUrl) {
      dialData.thumbUrl = data.previewUrl;
    } else if (data.previewType === 'upload' && previewFile) {
      dialData.thumbData = previewFile.preview;
    } else if (data.previewType === 'default' && selectedIcon) {
      // Find the index of the selected icon in the defaultIcons array
      const iconIndex = defaultIcons.findIndex(icon => icon.name === selectedIcon.name);
      if (iconIndex !== -1) {
        dialData.thumbIndex = iconIndex;
      }
    }

    try {
      // Add the dial to the database
      const id = await addDial(dialData);
      console.log('Dial added with ID:', id);

      // Close the dialog or show success message
      // ...
    } catch (error) {
      console.error('Error adding dial:', error);
      // Show error message
      // ...
    }
  };

  const previewType = form.watch('previewType');

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      setPreviewFile(
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        }),
      );
      form.setValue('previewUrl', URL.createObjectURL(file));
    },
  });

  const handleIconSelect = (icon: IconData) => {
    setSelectedIcon(prev => (prev?.name === icon.name ? null : icon));
  };

  const renderPreviewSection = () => {
    const previewUrl = form.watch('previewUrl');

    const defaultImageBlock = (
      <div className="w-full h-[200px] bg-gray-100 rounded flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-gray-500 text-center">
          <p>Preview Image</p>
          <p className="text-sm">Upload or enter URL to see preview</p>
        </div>
      </div>
    );

    switch (previewType) {
      case 'remote':
        return (
          <div className="mt-4">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="max-w-full h-auto rounded" />
            ) : (
              defaultImageBlock
            )}
          </div>
        );
      case 'upload':
        return (
          <div className="mt-4">
            <div className="flex gap-4 mb-4">
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <Button type="button" variant="outline">
                  Upload Image
                </Button>
              </div>
              {/* Optional: Add submit button if needed */}
              {previewFile && (
                <Button type="button" variant="default" onClick={() => console.log('Submit clicked')}>
                  Submit
                </Button>
              )}
            </div>
            {previewFile ? (
              <img
                src={previewFile.preview}
                alt="Preview"
                className="max-w-full h-auto rounded"
                onLoad={() => URL.revokeObjectURL(previewFile.preview)}
              />
            ) : (
              defaultImageBlock
            )}
          </div>
        );
      case 'default':
        return (
          <div className="mt-4 space-y-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary">Select Default Preview</Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid grid-cols-4 gap-2 p-2">
                  {defaultIcons.map((iconData, index) => (
                    <button
                      key={index}
                      className={`p-2 rounded hover:bg-gray-100 ${
                        selectedIcon?.name === iconData.name ? 'bg-gray-200' : ''
                      }`}
                      onClick={() => handleIconSelect(iconData)}>
                      {iconData.icon}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Preview Section */}
            <div className="p-4 border rounded-lg flex items-center justify-center">
              {selectedIcon ? (
                <div className="flex flex-col items-center gap-2">
                  {selectedIcon.icon}
                  <span className="text-sm">{selectedIcon.name}</span>
                </div>
              ) : (
                <div className="w-full h-16 border-2 border-dashed rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">Select an icon</span>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children || <Button variant="outline">Add Bookmark</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Bookmark</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter URL" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Dynamic title" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="group"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Default">Default</SelectItem>
                      <SelectItem value="Work">Work</SelectItem>
                      <SelectItem value="Personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="previewType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preview Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-0">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="auto" id="auto" />
                        <label htmlFor="auto">Auto Preview</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="remote" id="remote" />
                        <label htmlFor="remote">Remote Preview</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="upload" id="upload" />
                        <label htmlFor="upload">Upload Preview</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="default" id="default" />
                        <label htmlFor="default">Default Preview</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            {previewType === 'remote' && (
              <>
                <FormField
                  control={form.control}
                  name="previewUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preview URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter preview URL" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {renderPreviewSection()}
              </>
            )}

            {(previewType === 'upload' || previewType === 'default') && <>{renderPreviewSection()}</>}

            <DialogFooter>
              <Button type="submit">Add Bookmark</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
