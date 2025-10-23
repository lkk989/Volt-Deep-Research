// viteval.d.ts
declare module 'viteval/config' {
  interface EvalConfig {
    include: string[];
    setupFiles: string[];
  }

  interface Config {
    reporter: string;
    eval: EvalConfig;
  }

  export const defineConfig: (config: Config) => Config;
}
