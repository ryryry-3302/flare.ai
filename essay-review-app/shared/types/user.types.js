// This file defines TypeScript types related to users.

export interface User {
    id: string;
    name: string;
    age: number;
    writingGrade: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserProfile {
    userId: string;
    avatarUrl?: string;
    preferences: UserPreferences;
}

export interface UserPreferences {
    toneStyle: string[];
    metricsVisibility: boolean;
    commentsEnabled: boolean;
}