import { createACPProvider } from '@mcpc-tech/acp-ai-provider';


export const ACPgemini = createACPProvider({
  command: 'gemini',
  args: ['--experimental-acp'],
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
    DEBUG: 'true',
  },
  session: {
    cwd: process.cwd(),
    mcpServers: [
      {
        type: 'stdio',
        name: 'filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
      },
    ],
  },
});
