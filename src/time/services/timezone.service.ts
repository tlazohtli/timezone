import { UserTimezone } from "../types";
import { LocalTimezoneStore } from './timezone.store';

/**
 * Service for managing user timezone data in the local JSON store.
 */
export class UserTimezoneService {
    private readonly store = new LocalTimezoneStore();

    public async getUsers(userIds: string[]): Promise<UserTimezone[]> {
        return this.store.getUsers(userIds);
    }

    public async getSingleUser(userId: string): Promise<UserTimezone | null> {
        const res = await this.getUsers([userId]);
        return res.length > 0 ? res[0] : null;
    }

    public async saveUser(userId: string, timezone: string, location: string): Promise<void> {
        await this.store.saveUser(userId, timezone, location);
    }
}

export const userTimezoneService = new UserTimezoneService();
