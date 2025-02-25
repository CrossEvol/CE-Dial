export type ThumbSourceType = 'remote' | 'upload' | 'default' | 'auto';

export interface DialItem {
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
}
