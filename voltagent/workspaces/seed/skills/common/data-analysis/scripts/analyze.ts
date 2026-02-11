export function analyzeCsvText(csvText: string): {
    rowCount: number;
    columnCount: number;
} {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length === 0) {
        return { rowCount: 0, columnCount: 0 };
    }
    const header = lines[0].split(",");
    return { rowCount: Math.max(0, lines.length - 1), columnCount: header.length };
}
