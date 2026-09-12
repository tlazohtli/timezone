import { mkdir, open, readFile, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { UserTimezone } from '../types';

interface StoredTimezone {
    timezone: string;
    display_location: string;
}

interface TimezoneStoreData {
    version: 1;
    users: Record<string, StoredTimezone>;
}

export function getTimezoneDataFilePath(): string {
    return resolve(process.env.TIMEZONE_DATA_FILE || './data/timezones.json');
}

function isStoredTimezone(value: unknown): value is StoredTimezone {
    if (!value || typeof value !== 'object') return false;

    const timezone = value as StoredTimezone;
    return typeof timezone.timezone === 'string'
        && typeof timezone.display_location === 'string';
}

function parseStore(contents: string, filePath: string): TimezoneStoreData {
    let parsed: unknown;
    try {
        parsed = JSON.parse(contents);
    } catch {
        throw new Error(`Timezone data file is not valid JSON: ${filePath}`);
    }

    if (!parsed || typeof parsed !== 'object') {
        throw new Error(`Timezone data file has an invalid structure: ${filePath}`);
    }

    const store = parsed as Partial<TimezoneStoreData>;
    const users = store.users;
    if (store.version !== 1 || !users || typeof users !== 'object') {
        throw new Error(`Timezone data file has an unsupported format: ${filePath}`);
    }

    for (const [userId, timezone] of Object.entries(users)) {
        if (!userId || !isStoredTimezone(timezone)) {
            throw new Error(`Timezone data file contains an invalid user record: ${filePath}`);
        }
    }

    return { version: 1, users };
}

/**
 * A single-process, JSON-backed timezone store. Writes are serialized and
 * atomically replace the data file so an interrupted write cannot corrupt it.
 */
export class LocalTimezoneStore {
    private data?: TimezoneStoreData;
    private loading?: Promise<TimezoneStoreData>;
    private writeQueue: Promise<void> = Promise.resolve();

    constructor(private readonly filePath = getTimezoneDataFilePath()) {}

    public async getUsers(userIds: string[]): Promise<UserTimezone[]> {
        const store = await this.load();

        return userIds.flatMap((userId) => {
            const timezone = store.users[userId];
            return timezone ? [{ user_id: userId, ...timezone }] : [];
        });
    }

    public async saveUser(userId: string, timezone: string, location: string): Promise<void> {
        return this.enqueueWrite(async () => {
            const store = await this.load();
            store.users[userId] = {
                timezone,
                display_location: location,
            };
            await this.write(store);
        });
    }

    private async load(): Promise<TimezoneStoreData> {
        if (this.data) return this.data;

        if (!this.loading) {
            this.loading = this.read();
        }

        try {
            this.data = await this.loading;
            return this.data;
        } finally {
            this.loading = undefined;
        }
    }

    private async read(): Promise<TimezoneStoreData> {
        try {
            return parseStore(await readFile(this.filePath, 'utf8'), this.filePath);
        } catch (error: unknown) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return { version: 1, users: {} };
            }
            throw error;
        }
    }

    private async write(store: TimezoneStoreData): Promise<void> {
        const directory = dirname(this.filePath);
        await mkdir(directory, { recursive: true, mode: 0o700 });

        const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
        const file = await open(temporaryPath, 'w', 0o600);

        try {
            await file.writeFile(`${JSON.stringify(store, null, 2)}\n`, 'utf8');
            await file.sync();
        } finally {
            await file.close();
        }

        await rename(temporaryPath, this.filePath);
    }

    private async enqueueWrite(operation: () => Promise<void>): Promise<void> {
        const write = this.writeQueue.then(operation);
        this.writeQueue = write.catch(() => undefined);
        return write;
    }
}
