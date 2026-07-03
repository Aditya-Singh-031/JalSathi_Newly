export interface HazardReport {
  id: string;
  user_id: string;
  category: 'Flooding' | 'Open Pothole' | 'Power Grid Down' | 'Fallen Tree';
  severity_level: number;
  description?: string;
  image_url?: string;
  latitude: number;
  longitude: number;
  upvotes_count: number;
  timestamp: string;
}

export interface SOSRequest {
  id: string;
  user_id: string;
  request_type: string;
  message: string;
  status: 'Open' | 'Resolved';
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}
