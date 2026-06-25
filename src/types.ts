export interface UserProfile {
  uid: string;
  name: string;
  avatar: string;
  level: number;
  points: number;
  badges: string[];
  missionsCompleted: string[];
  createdAt: string;
  grade: number; // 5 or 6
}

export interface ReflectionData {
  id: string;
  userId: string;
  missionId: string;
  pikirText: string;
  pikirVal: number;
  hatiText: string;
  hatiVal: number;
  rasaText: string;
  rasaVal: number;
  ragaText: string;
  ragaVal: number;
  createdAt: string;
}

export interface TwinItem {
  id: string;
  type: "sign" | "assembly" | "hazard";
  x: number; // grid position X (0 to 9)
  y: number; // grid position Y (0 to 9)
  label: string;
}

export interface DigitalTwinModel {
  id: string;
  userId: string;
  layoutName: string;
  items: TwinItem[];
  createdAt: string;
}

export interface PBLProject {
  id: string;
  userId: string;
  title: string;
  description: string;
  fileUrlOrData: string;
  status: "Draft" | "Terkirim" | "Sudah Verifikasi";
  createdAt: string;
}

