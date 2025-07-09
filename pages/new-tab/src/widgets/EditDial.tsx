import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ClipBoardUtil from '@/utils/ClipBoardUtil';
import { zodResolver } from '@hookform/resolvers/zod';
import type { IconData } from '@src/lib/defaultIcons';
import { defaultIcons } from '@src/lib/defaultIcons';
import type { DialItem, ThumbSourceType } from '@src/models';
import { useBearStore } from '@src/store';
import { CircleX, ClipboardCopy, Copy, EllipsisVertical, ImageUp, StepBack } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import * as z from 'zod';
import { CopyDialDialog } from './CopyDialDialog';

// Reuse the same schema from AddDial
const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL' }),
  title: z.string().min(1, { message: 'Title is required' }),
  group: z.string(),
  previewType: z.enum(['auto', 'remote', 'upload', 'default']),
  previewUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditDialProps {
  dial: DialItem;
  onClose: (open: boolean) => void;
}

const EditDial: React.FC<EditDialProps> = ({ dial, onClose }) => {
  const [previewFile, setPreviewFile] = useState<(File & { preview: string }) | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<IconData | null>(null);
  const [previewImageData, setPreviewImageData] = useState<string | undefined>(undefined);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);

  const { updateDial, groups, dials, initGroups, addDial } = useBearStore();

  // Determine initial preview type based on dial data
  const getInitialPreviewType = (): 'auto' | 'remote' | 'upload' | 'default' => {
    if (dial.thumbIndex !== undefined && dial.thumbIndex >= 0) return 'default';
    if (dial.thumbUrl) return 'remote';
    if (dial.thumbData) return 'upload';
    return 'auto';
  };

  // Set up form with existing dial data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: dial.url ? `http://${dial.url}` : '',
      title: dial.title || '',
      group: dial.groupId?.toString() || '1',
      previewType: getInitialPreviewType(),
      previewUrl: dial.thumbUrl || dial.thumbData || '',
    },
  });

  useEffect(() => {
    initGroups();

    // Set selected icon if dial has a thumbIndex
    if (dial.thumbIndex !== undefined && dial.thumbIndex >= 0 && defaultIcons[dial.thumbIndex]) {
      setSelectedIcon(defaultIcons[dial.thumbIndex]);
    }

    // If there's thumbData, create a preview
    if (dial.thumbData) {
      form.setValue('previewUrl', dial.thumbData);
    }
  }, [initGroups, dial, form]);

  const onSubmit = async (data: FormValues) => {
    // Remove URL prefixes (http://, https://, etc.)
    const cleanUrl = data.url.replace(/^(https?:\/\/|ftp:\/\/|mailto:|file:\/\/|data:)/, '');

    // Prepare the update data
    const updates: Partial<DialItem> = {
      url: cleanUrl,
      title: data.title,
      groupId: parseInt(data.group),
      thumbSourceType: data.previewType as ThumbSourceType,
      thumbUrl: '',
      thumbData: '',
      thumbIndex: -1,
    };

    // Add additional data based on the preview type
    if (data.previewType === 'remote' && data.previewUrl) {
      // Store both the URL and convert the remote image to base64
      updates.thumbUrl = data.previewUrl;

      try {
        // Fetch the image and convert to base64
        const base64Data = await fetchImageAsBase64(data.previewUrl);
        updates.thumbData = base64Data;
      } catch (error) {
        console.error('Error fetching remote image:', error);
        // Keep the URL as fallback
      }
    } else if (data.previewType === 'upload' && data.previewUrl) {
      updates.thumbData = data.previewUrl;
    } else if (data.previewType === 'default' && selectedIcon) {
      const iconIndex = defaultIcons.findIndex(icon => icon.name === selectedIcon.name);
      if (iconIndex !== -1) {
        updates.thumbIndex = iconIndex;
      }
    }

    try {
      await updateDial(dial.id!, updates);
      onClose(false);
    } catch (error) {
      console.error('Error updating dial:', error);
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
      const previewUrl = URL.createObjectURL(file);
      const base64Data = await fileToBase64(file);

      setPreviewFile(
        Object.assign(file, {
          preview: previewUrl,
        }),
      );

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

  const handlePasteFromClipboard = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], 'clipboard-image.png', { type: imageType });
          const base64Data = await fileToBase64(file);
          const previewUrl = URL.createObjectURL(file);

          setPreviewFile(
            Object.assign(file, {
              preview: previewUrl,
            }),
          );
          form.setValue('previewUrl', base64Data);
          toast.success('Image pasted from clipboard!');
          return;
        }
      }
      toast.info('No image found in clipboard.');
    } catch (error) {
      console.error('Failed to read clipboard contents: ', error);
      toast.error('Failed to read clipboard. Please allow clipboard access.');
    }
  };

  const handleIconSelect = (icon: IconData) => {
    setSelectedIcon(prev => (prev?.name === icon.name ? null : icon));
  };

  const handleCopy = async (selectedGroupIds: string[]) => {
    const dialData: DialItem = {
      url: dial.url,
      title: dial.title,
      pos: -1, // Let the store handle the position
      groupId: -1,
      thumbSourceType: dial.thumbSourceType,
      thumbUrl: dial.thumbUrl,
      thumbData: dial.thumbData,
      thumbIndex: dial.thumbIndex,
      clickCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    for (const groupId of selectedGroupIds) {
      if (parseInt(groupId) !== dial.groupId) {
        await addDial({ ...dialData, groupId: parseInt(groupId) });
      }
    }

    toast.success('Copied successfully!');
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
                <div className="flex justify-center space-x-4">
                  <Button type="button" variant="outline">
                    <ImageUp /> Upload Image
                  </Button>
                  <Button type="button" variant="outline" onClick={handlePasteFromClipboard}>
                    <ClipboardCopy /> From Clipboard
                  </Button>
                </div>
              </div>
            </div>
            {previewFile ? (
              <img
                src={previewFile.preview}
                alt="Preview"
                className="max-w-full h-auto rounded"
                onLoad={() => URL.revokeObjectURL(previewFile.preview)}
              />
            ) : previewUrl ? (
              <img src={previewUrl} alt="Preview" className="max-w-full h-auto rounded" />
            ) : (
              defaultImageBlock
            )}
          </div>
        );
      case 'default':
        return (
          <div className="mt-4 space-y-4">
            <div className="flex space-x-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary">Default Icons</Button>
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

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary">Previous Images</Button>
                </PopoverTrigger>
                <PopoverContent className="w-96">
                  <div className="max-h-80 overflow-y-auto">
                    {Object.entries(
                      dials.reduce(
                        (acc, dial) => {
                          if (dial.thumbData) {
                            const groupName = groups.find(g => g.id === dial.groupId)?.name || 'Uncategorized';
                            if (!acc[groupName]) {
                              acc[groupName] = [];
                            }
                            acc[groupName].push(dial);
                          }
                          return acc;
                        },
                        {} as Record<string, DialItem[]>,
                      ),
                    ).map(([groupName, dials]) => (
                      <Collapsible key={groupName}>
                        <CollapsibleTrigger className="w-full text-left py-2 font-semibold">
                          {groupName}
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="grid grid-cols-4 gap-2 p-2">
                            {dials.map(dial => (
                              <button
                                key={dial.id}
                                className="p-2 rounded hover:bg-gray-100"
                                onClick={() => {
                                  setPreviewImageData(form.getValues('previewUrl'));
                                  form.setValue('previewUrl', dial.thumbData);
                                  form.setValue('previewType', 'upload');
                                }}>
                                <img src={dial.thumbData} alt={dial.title} className="w-16 h-16 object-cover" />
                              </button>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

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
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Bookmark</DialogTitle>
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
                  <Input placeholder="Enter title" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="group"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Group</FormLabel>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <EllipsisVertical />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setIsCopyDialogOpen(true)}>
                        <Copy />
                        <span>Copy</span>
                        <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
                      <RadioGroupItem value="auto" id="edit-auto" />
                      <label htmlFor="edit-auto">Auto Preview</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="remote" id="edit-remote" />
                      <label htmlFor="edit-remote">Remote Preview</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="upload" id="edit-upload" />
                      <label htmlFor="edit-upload">Upload Preview</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="default" id="edit-default" />
                      <label htmlFor="edit-default">Default Preview</label>
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Preview URL</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <EllipsisVertical />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Options</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              ClipBoardUtil.copyToClipboard({
                                text: field.value || '',
                                onSuccess: () => toast.info('Copied!'),
                                onError: () => toast.error('Wrong Copied!'),
                              });
                            }}>
                            <Copy />
                            <span>Copy</span>
                            <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setPreviewImageData(field.value);
                              field.onChange('');
                            }}>
                            <CircleX />
                            <span>Empty</span>
                            <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              field.onChange(previewImageData || '');
                              setPreviewImageData(undefined);
                            }}>
                            <StepBack />
                            <span>Reset</span>
                            <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
            <Button variant="outline" onClick={() => onClose(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Bookmark</Button>
          </DialogFooter>
        </form>
      </Form>
      <CopyDialDialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen} dial={dial} onCopy={handleCopy} />
    </DialogContent>
  );
};

export default EditDial;
