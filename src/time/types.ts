// Time feature types
export interface UserTimezone {
    user_id: string;
    timezone: string;
    display_location: string;
}

export interface TimezoneData {
    location_name: string;
    timezone: string;
    display_location: string;
    cached_at: number;
}
