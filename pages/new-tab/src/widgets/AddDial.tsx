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
import type { IconData } from '@src/lib/defaultIcons';
import { defaultIcons } from '@src/lib/defaultIcons';
import { useEffect, useState } from 'react';
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

interface AddDialProps {
  children?: React.ReactNode;
  selectedGroupId?: number;
}

export function AddDial({ children, selectedGroupId }: AddDialProps) {
  const [previewFile, setPreviewFile] = useState<(File & { preview: string }) | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<IconData | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      title: '',
      group: selectedGroupId ? String(selectedGroupId) : '1',
      previewType: 'auto',
      previewUrl: '',
    },
  });

  const addDial = useBearStore(state => state.addDial);
  const groups = useBearStore(state => state.groups);
  const fetchGroups = useBearStore(state => state.fetchGroups);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const onSubmit = async (data: FormValues) => {
    console.log('Form submitted:', data);

    // Remove URL prefixes (http://, https://, etc.)
    const cleanUrl = data.url.replace(/^(https?:\/\/|ftp:\/\/|mailto:|file:\/\/|data:)/, '');

    // Prepare the dial data based on the form values
    const dialData = {
      url: cleanUrl,
      title: data.title,
      groupId: parseInt(data.group),
      thumbSourceType: data.previewType as ThumbSourceType,
      thumbUrl: '',
      thumbData: '',
      thumbIndex: -1,
      pos: -1,
    };

    // Add additional data based on the preview type
    if (data.previewType === 'remote' && data.previewUrl) {
      // Store both the URL and convert the remote image to base64
      dialData.thumbUrl = data.previewUrl;

      try {
        // Fetch the image and convert to base64
        const base64Data = await fetchImageAsBase64(data.previewUrl);
        dialData.thumbData = base64Data;
      } catch (error) {
        console.error('Error fetching remote image:', error);
        // Keep the URL as fallback
      }
    } else if (data.previewType === 'upload' && data.previewUrl) {
      // For upload type, we use the base64 data directly from the form
      dialData.thumbData = data.previewUrl;
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

  // Helper function to fetch an image and convert it to base64
  const fetchImageAsBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  };

  const previewType = form.watch('previewType');

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];

      // Create a preview URL for display
      const previewUrl = URL.createObjectURL(file);

      // Convert the file to base64 for storage
      const base64Data = await fileToBase64(file);

      setPreviewFile(
        Object.assign(file, {
          preview: previewUrl,
        }),
      );

      // Store the base64 data in the form
      form.setValue('previewUrl', base64Data);
    },
  });

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

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
                      {groups.length > 0 ? (
                        groups.map(group => (
                          <SelectItem key={group.id} value={String(group.id)}>
                            {group.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="1">Default</SelectItem>
                      )}
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
