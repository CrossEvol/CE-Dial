export type ThumbSourceType = 'remote' | 'upload' | 'default' | 'auto';

export type DialItem = {
  id?: number;
  url: string;
  title: string;
  pos: number;
  groupId: number;
  thumbSourceType: ThumbSourceType;
  thumbUrl?: string;
  thumbData?: string;
  thumbIndex?: number;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateDialItem = Omit<DialItem, 'id' | 'clickCount' | 'createdAt' | 'updatedAt'>;
