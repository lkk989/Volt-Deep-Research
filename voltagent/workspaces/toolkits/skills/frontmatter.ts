type ParsedFrontmatter = {
    data: Record<string, unknown>;
    body: string;
};

export const parseFrontmatter = (content: string): ParsedFrontmatter => {
    const lines = content.split(/\r?\n/);
    if (lines[0]?.trim() !== "---") {
        return { data: {}, body: content };
    }
    const end = lines.slice(1).findIndex((l) => l.trim() === "---");
    if (end === -1) {
        return { data: {}, body: content };
    }
    const frontLines = lines.slice(1, end + 1);
    const body = lines.slice(end + 2).join("\n");
    return { data: parseSimpleYaml(frontLines), body };
};

const parseSimpleYaml = (lines: string[]): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    let currentArrayKey: string | null = null;

    for (const raw of lines) {
        const line = raw.replace(/\t/g, "    ");
        if (line.trim().length === 0) {
            continue;
        }
        if (line.trim().startsWith("- ") && currentArrayKey) {
            const arr = (result[currentArrayKey] as unknown[]) ?? [];
            arr.push(line.trim().slice(2).trim());
            result[currentArrayKey] = arr;
            continue;
        }

        const m = /^([A-Za-z0-9_\-]+)\s*:\s*(.*)$/.exec(line.trim());
        if (!m) {
            continue;
        }
        const [, key, rest] = m;
        if (rest === "") {
            currentArrayKey = key;
            result[key] = [];
            continue;
        }
        currentArrayKey = null;
        result[key] = unquote(rest);
    }

    return result;
};

const unquote = (value: string): string => {
    const v = value.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        return v.slice(1, -1);
    }
    return v;
};
