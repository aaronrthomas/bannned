import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const VISITOR_FILE = path.join(DATA_DIR, 'visitors.json');

function ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

export function getVisitorCount(): number {
    try {
        ensureDir();
        if (!fs.existsSync(VISITOR_FILE)) {
            // Initial count for store
            const initial = { count: 18, uniqueIps: [] };
            fs.writeFileSync(VISITOR_FILE, JSON.stringify(initial, null, 2), 'utf-8');
            return initial.count;
        }
        const data = JSON.parse(fs.readFileSync(VISITOR_FILE, 'utf-8'));
        return data.count || 1;
    } catch {
        return 1;
    }
}

export function recordVisit(ip: string = 'client'): number {
    try {
        ensureDir();
        let data = { count: 18, uniqueIps: [] as string[] };
        if (fs.existsSync(VISITOR_FILE)) {
            data = JSON.parse(fs.readFileSync(VISITOR_FILE, 'utf-8'));
        }
        data.count = (data.count || 0) + 1;
        if (ip && !data.uniqueIps.includes(ip)) {
            data.uniqueIps.push(ip);
        }
        fs.writeFileSync(VISITOR_FILE, JSON.stringify(data, null, 2), 'utf-8');
        return data.count;
    } catch {
        return 1;
    }
}
