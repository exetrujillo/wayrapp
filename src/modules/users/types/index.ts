// User module types and interfaces

export interface User {
  id: string;
  email: string;
  username?: string;
  country_code?: string;
  registration_date: Date;
  profile_picture_url?: string;
  is_active: boolean;
  role: 'student' | 'content_creator' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export interface Follow {
  follower_id: string;
  followed_id: string;
  created_at: Date;
}

export interface CreateUserDto {
  email: string;
  username?: string;
  country_code?: string;
  profile_picture_url?: string;
  role?: 'student' | 'content_creator' | 'admin';
}

export interface UpdateUserDto {
  username?: string;
  country_code?: string;
  profile_picture_url?: string;
  is_active?: boolean;
}

export interface UserWithFollowCounts extends User {
  followers_count: number;
  following_count: number;
}