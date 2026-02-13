export interface ActiveSessionItem {
  id: string;
  device: string;
  os: string;
  browser: string;
  ip: string | null;
  location: string | null;
  isCurrent: boolean;
  lastActive: string;
  createdAt: string;
}

