import { Octokit } from 'octokit'
import { retry } from '@octokit/plugin-retry'
import {
    createTool,
    type ToolExecuteOptions,
    type ToolHookOnEndArgs,
    type ToolHookOnStartArgs,
} from '@voltagent/core'
import { z } from 'zod'
import { voltlogger } from '../config/logger.js'

const ensureActive = (context?: ToolExecuteOptions) => {
    if (!context?.isActive) {
        throw new Error('Operation has been cancelled')
    }
}

const hooksFor = (name: string) => ({
    onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
        voltlogger.info(`${name}: start`, {
            tool: tool.name,
            operationId: options?.operationId,
            toolCallId: options?.toolContext?.callId,
            args,
        })
    },
    onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
        if (error) {
            voltlogger.error(`${name}: error`, {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                error: error instanceof Error ? error.message : String(error),
            })
            return undefined
        }
        voltlogger.info(`${name}: end`, {
            tool: tool.name,
            operationId: options?.operationId,
            toolCallId: options?.toolContext?.callId,
        })
        return undefined
    },
})

// Enhanced Octokit with Retry
const MyOctokit = Octokit.plugin(retry)
let _octokit: InstanceType<typeof MyOctokit> | undefined

const getOctokit = () => {
    if (!_octokit) {
        const auth = process.env.GITHUB_TOKEN ?? process.env.GITHUB_PAT
        _octokit = new MyOctokit({
            auth,
            retry: {
                doNotRetry: ['429'],
            },
        })
    }
    return _octokit
}

export const githubSearchReposTool = createTool({
    name: 'github_search_repos',
    description:
        'Search GitHub repositories by query. Returns repos with stars, forks, description, language, and topics. Useful for finding open-source projects, libraries, or codebases related to a topic.',
    tags: [
        'github',
        'repository',
        'search',
        'open-source',
        'code-discovery',
        'stars',
        'forks',
    ],
    parameters: z.object({
        query: z
            .string()
            .min(1)
            .describe(
                'GitHub search query (e.g. "machine learning language:python stars:>100")'
            ),
        sort: z
            .enum(['stars', 'forks', 'updated', 'help-wanted-issues'])
            .default('stars')
            .describe('Sort field'),
        order: z.enum(['asc', 'desc']).default('desc').describe('Sort order'),
        perPage: z
            .number()
            .int()
            .min(1)
            .max(30)
            .default(10)
            .describe('Results per page'),
    }),
    outputSchema: z.object({
        totalCount: z.number(),
        repos: z.array(
            z.object({
                fullName: z.string(),
                description: z.string().nullable(),
                htmlUrl: z.string(),
                language: z.string().nullable(),
                stars: z.number(),
                forks: z.number(),
                openIssues: z.number(),
                topics: z.array(z.string()),
                updatedAt: z.string().nullable(),
                license: z.string().nullable(),
            })
        ),
    }),
    hooks: hooksFor('github_search_repos'),
    execute: async (args, context) => {
        ensureActive(context)

        const octokit = getOctokit()
        const response = await octokit.rest.search.repos({
            q: args.query,
            sort: args.sort,
            order: args.order,
            per_page: args.perPage,
        })

        return {
            totalCount: response.data.total_count,
            repos: response.data.items.map((repo) => ({
                fullName: repo.full_name,
                description: repo.description ?? null,
                htmlUrl: repo.html_url,
                language: repo.language ?? null,
                stars: repo.stargazers_count ?? 0,
                forks: repo.forks_count ?? 0,
                openIssues: repo.open_issues_count ?? 0,
                topics: repo.topics ?? [],
                updatedAt: repo.updated_at ?? null,
                license: repo.license?.spdx_id ?? null,
            })),
        }
    },
})

export const githubGetRepoTool = createTool({
    name: 'github_get_repo',
    description:
        'Get detailed information about a specific GitHub repository including stats, languages, and default branch. Useful for understanding a project before deeper analysis.',
    tags: [
        'github',
        'repository',
        'details',
        'metadata',
        'project-info',
        'readme',
    ],
    parameters: z.object({
        owner: z.string().min(1).describe('Repository owner (user or org)'),
        repo: z.string().min(1).describe('Repository name'),
    }),
    outputSchema: z.object({
        fullName: z.string(),
        description: z.string().nullable(),
        htmlUrl: z.string(),
        homepage: z.string().nullable(),
        language: z.string().nullable(),
        stars: z.number(),
        forks: z.number(),
        watchers: z.number(),
        openIssues: z.number(),
        defaultBranch: z.string(),
        topics: z.array(z.string()),
        createdAt: z.string().nullable(),
        updatedAt: z.string().nullable(),
        pushedAt: z.string().nullable(),
        license: z.string().nullable(),
        size: z.number(),
        archived: z.boolean(),
        fork: z.boolean(),
    }),
    hooks: hooksFor('github_get_repo'),
    execute: async (args, context) => {
        ensureActive(context)

        const octokit = getOctokit()
        const { data } = await octokit.rest.repos.get({
            owner: args.owner,
            repo: args.repo,
        })

        return {
            fullName: data.full_name,
            description: data.description ?? null,
            htmlUrl: data.html_url,
            homepage: data.homepage ?? null,
            language: data.language ?? null,
            stars: data.stargazers_count ?? 0,
            forks: data.forks_count ?? 0,
            watchers: data.watchers_count ?? 0,
            openIssues: data.open_issues_count ?? 0,
            defaultBranch: data.default_branch,
            topics: data.topics ?? [],
            createdAt: data.created_at ?? null,
            updatedAt: data.updated_at ?? null,
            pushedAt: data.pushed_at ?? null,
            license: data.license?.spdx_id ?? null,
            size: data.size ?? 0,
            archived: data.archived ?? false,
            fork: data.fork ?? false,
        }
    },
})

export const githubListIssuesTool = createTool({
    name: 'github_list_issues',
    description:
        'List issues for a GitHub repository with filters for state, labels, and sort. Excludes pull requests by default unless specified. Useful for understanding project health and open problems.',
    tags: ['github', 'issues', 'bugs', 'project-health', 'community'],
    parameters: z.object({
        owner: z.string().min(1).describe('Repository owner'),
        repo: z.string().min(1).describe('Repository name'),
        state: z
            .enum(['open', 'closed', 'all'])
            .default('open')
            .describe('Issue state filter'),
        labels: z
            .string()
            .optional()
            .describe('Comma-separated label names (e.g. "bug,help wanted")'),
        sort: z
            .enum(['created', 'updated', 'comments'])
            .default('updated')
            .describe('Sort field'),
        perPage: z
            .number()
            .int()
            .min(1)
            .max(30)
            .default(10)
            .describe('Results per page'),
        includePullRequests: z
            .boolean()
            .default(false)
            .describe(
                'Include pull requests in results (GitHub API treats PRs as issues)'
            ),
    }),
    outputSchema: z.object({
        issues: z.array(
            z.object({
                number: z.number(),
                title: z.string(),
                state: z.string(),
                htmlUrl: z.string(),
                user: z.string().nullable(),
                labels: z.array(z.string()),
                comments: z.number(),
                createdAt: z.string().nullable(),
                updatedAt: z.string().nullable(),
                isPullRequest: z.boolean(),
                body: z.string().nullable(),
            })
        ),
    }),
    hooks: hooksFor('github_list_issues'),
    execute: async (args, context) => {
        ensureActive(context)

        const octokit = getOctokit()
        const { data } = await octokit.rest.issues.listForRepo({
            owner: args.owner,
            repo: args.repo,
            state: args.state,
            labels: args.labels,
            sort: args.sort,
            per_page: args.perPage,
        })

        // Filter out PRs if not requested, as GitHub API returns both
        const filteredData = args.includePullRequests
            ? data
            : data.filter((issue) => !issue.pull_request)

        return {
            issues: filteredData.map((issue) => ({
                number: issue.number,
                title: issue.title,
                state: issue.state ?? 'open',
                htmlUrl: issue.html_url,
                user:
                    typeof issue.user === 'string'
                        ? issue.user
                        : (issue.user?.login ?? null),
                labels: issue.labels.map((l) =>
                    typeof l === 'string' ? l : (l.name ?? '')
                ),
                comments: issue.comments,
                createdAt: issue.created_at ?? null,
                updatedAt: issue.updated_at ?? null,
                isPullRequest: !!issue.pull_request,
                body: issue.body ? issue.body.slice(0, 500) : null,
            })),
        }
    },
})

export const githubSearchCodeTool = createTool({
    name: 'github_search_code',
    description:
        'Search code across GitHub repositories. Find specific functions, patterns, imports, or implementations. Useful for learning how others solve problems or finding usage examples.',
    tags: [
        'github',
        'code-search',
        'implementation',
        'examples',
        'patterns',
        'source-code',
    ],
    parameters: z.object({
        query: z
            .string()
            .min(1)
            .describe(
                'Code search query (e.g. "createTool language:typescript repo:voltagent/voltagent")'
            ),
        perPage: z
            .number()
            .int()
            .min(1)
            .max(30)
            .default(10)
            .describe('Results per page'),
    }),
    outputSchema: z.object({
        totalCount: z.number(),
        results: z.array(
            z.object({
                name: z.string(),
                path: z.string(),
                repository: z.string(),
                htmlUrl: z.string(),
                score: z.number(),
            })
        ),
    }),
    hooks: hooksFor('github_search_code'),
    execute: async (args, context) => {
        ensureActive(context)

        const octokit = getOctokit()
        const response = await octokit.rest.search.code({
            q: args.query,
            per_page: args.perPage,
        })

        return {
            totalCount: response.data.total_count,
            results: response.data.items.map((item) => ({
                name: item.name,
                path: item.path,
                repository: item.repository.full_name,
                htmlUrl: item.html_url,
                score: item.score,
            })),
        }
    },
})

export const githubGetFileContentsTool = createTool({
    name: 'github_get_file_contents',
    description:
        'Get the contents of a file from a GitHub repository. Returns decoded text content for source files, READMEs, configs, etc. Useful for reading specific files from public repos.',
    tags: [
        'github',
        'file',
        'contents',
        'source-code',
        'readme',
        'configuration',
    ],
    parameters: z.object({
        owner: z.string().min(1).describe('Repository owner'),
        repo: z.string().min(1).describe('Repository name'),
        path: z.string().min(1).describe('File path within the repository'),
        ref: z
            .string()
            .optional()
            .describe(
                'Branch, tag, or commit SHA (defaults to default branch)'
            ),
    }),
    outputSchema: z.object({
        name: z.string(),
        path: z.string(),
        size: z.number(),
        encoding: z.string(),
        content: z.string(),
        htmlUrl: z.string(),
        sha: z.string(),
    }),
    hooks: hooksFor('github_get_file_contents'),
    execute: async (args, context) => {
        ensureActive(context)

        const octokit = getOctokit()
        try {
            const { data } = await octokit.rest.repos.getContent({
                owner: args.owner,
                repo: args.repo,
                path: args.path,
                ref: args.ref,
            })

            if (Array.isArray(data) || data.type !== 'file') {
                throw new Error(
                    `Path "${args.path}" is a directory, not a file. Use 'github_get_tree' for directories.`
                )
            }

            const content =
                data.encoding === 'base64' && data.content
                    ? Buffer.from(data.content, 'base64').toString('utf-8')
                    : (data.content ?? '')

            return {
                name: data.name,
                path: data.path,
                size: data.size ?? 0,
                encoding: data.encoding ?? 'none',
                content,
                htmlUrl: data.html_url ?? '',
                sha: data.sha,
            }
        } catch (error: any) {
            if (error.status === 404) {
                throw new Error(
                    `File not found: ${args.path} in ${args.owner}/${args.repo}`
                )
            }
            throw error
        }
    },
})

export const githubGetTreeTool = createTool({
    name: 'github_get_tree',
    description:
        'Get a recursive file tree of a GitHub repository. Returns paths, types (blob/tree), and sizes. Useful for understanding project structure and locating files.',
    tags: ['github', 'tree', 'structure', 'files', 'recursive', 'directory'],
    parameters: z.object({
        owner: z.string().min(1).describe('Repository owner'),
        repo: z.string().min(1).describe('Repository name'),
        treeSha: z
            .string()
            .optional()
            .describe('Tree SHA or branch name (defaults to default branch)'),
        recursive: z
            .boolean()
            .default(true)
            .describe('Get recursive tree (up to API limit)'),
    }),
    outputSchema: z.object({
        sha: z.string(),
        truncated: z.boolean(),
        tree: z.array(
            z.object({
                path: z.string(),
                mode: z.string(),
                type: z.enum(['blob', 'tree', 'commit']).or(z.string()),
                sha: z.string(),
                size: z.number().optional(),
                url: z.string().optional(),
            })
        ),
    }),
    hooks: hooksFor('github_get_tree'),
    execute: async (args, context) => {
        ensureActive(context)

        const octokit = getOctokit()

        let treeSha = args.treeSha
        if (!treeSha) {
            // Get default branch SHA
            const { data: repoData } = await octokit.rest.repos.get({
                owner: args.owner,
                repo: args.repo,
            })
            const { data: branchData } = await octokit.rest.repos.getBranch({
                owner: args.owner,
                repo: args.repo,
                branch: repoData.default_branch,
            })
            treeSha = branchData.commit.sha
        }

        const { data } = await octokit.rest.git.getTree({
            owner: args.owner,
            repo: args.repo,
            tree_sha: treeSha,
            recursive: args.recursive ? '1' : undefined,
        })

        return {
            sha: data.sha,
            truncated: data.truncated,
            tree: data.tree.map((item) => ({
                path: item.path ?? '',
                mode: item.mode ?? '',
                type: item.type ?? 'blob',
                sha: item.sha ?? '',
                size: item.size,
                url: item.url,
            })),
        }
    },
})

export const githubListCommitsTool = createTool({
    name: 'github_list_commits',
    description:
        'List commits for a GitHub repository. Returns commit messages, authors, dates, and SHAs. Useful for tracking changes, history, and project activity.',
    tags: ['github', 'commits', 'history', 'changes', 'log'],
    parameters: z.object({
        owner: z.string().min(1).describe('Repository owner'),
        repo: z.string().min(1).describe('Repository name'),
        sha: z
            .string()
            .optional()
            .describe('SHA or branch to start listing commits from'),
        path: z
            .string()
            .optional()
            .describe('Only commits containing this file path'),
        author: z
            .string()
            .optional()
            .describe(
                'GitHub login or email address by which to filter by commit author'
            ),
        perPage: z
            .number()
            .int()
            .min(1)
            .max(50)
            .default(10)
            .describe('Results per page'),
    }),
    outputSchema: z.object({
        commits: z.array(
            z.object({
                sha: z.string(),
                message: z.string(),
                authorName: z.string(),
                authorDate: z.string().nullable(),
                htmlUrl: z.string(),
                verificationVerified: z.boolean(),
            })
        ),
    }),
    hooks: hooksFor('github_list_commits'),
    execute: async (args, context) => {
        ensureActive(context)

        const octokit = getOctokit()
        const { data } = await octokit.rest.repos.listCommits({
            owner: args.owner,
            repo: args.repo,
            sha: args.sha,
            path: args.path,
            author: args.author,
            per_page: args.perPage,
        })

        return {
            commits: data.map((commit) => ({
                sha: commit.sha,
                message: commit.commit.message,
                authorName: commit.commit.author?.name ?? 'Unknown',
                authorDate: commit.commit.author?.date ?? null,
                htmlUrl: commit.html_url,
                verificationVerified:
                    commit.commit.verification?.verified ?? false,
            })),
        }
    },
})

export const githubGetUserTool = createTool({
    name: 'github_get_user',
    description:
        'Get public profile information for a GitHub user. Returns bio, location, blog, public repos, followers. Useful for identifying key contributors or checking user credibility.',
    tags: ['github', 'user', 'profile', 'developer', 'bio'],
    parameters: z.object({
        username: z.string().min(1).describe('GitHub username'),
    }),
    outputSchema: z.object({
        login: z.string(),
        name: z.string().nullable(),
        company: z.string().nullable(),
        blog: z.string().nullable(),
        location: z.string().nullable(),
        email: z.string().nullable(),
        bio: z.string().nullable(),
        publicRepos: z.number(),
        followers: z.number(),
        following: z.number(),
        createdAt: z.string(),
        htmlUrl: z.string(),
    }),
    hooks: hooksFor('github_get_user'),
    execute: async (args, context) => {
        ensureActive(context)

        const octokit = getOctokit()
        const { data } = await octokit.rest.users.getByUsername({
            username: args.username,
        })

        return {
            login: data.login,
            name: data.name ?? null,
            company: data.company ?? null,
            blog: data.blog ?? null,
            location: data.location ?? null,
            email: data.email ?? null,
            bio: data.bio ?? null,
            publicRepos: data.public_repos,
            followers: data.followers,
            following: data.following,
            createdAt: data.created_at,
            htmlUrl: data.html_url,
        }
    },
})
