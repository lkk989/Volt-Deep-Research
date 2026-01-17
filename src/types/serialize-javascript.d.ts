declare module 'serialize-javascript' {
  export default function serializeJS(value: unknown, options?: { unsafe?: boolean }): string
}
