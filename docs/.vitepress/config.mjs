import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'AI Excellence Framework',
  description: 'A comprehensive framework for reducing friction in AI-assisted software development',

  // Clean URLs (no .html extension)
  cleanUrls: true,

  // Build output
  outDir: '../dist',

  // Theme configuration
  themeConfig: {
    // Logo and title
    logo: '/logo.svg',
    siteTitle: 'AI Excellence Framework',

    // Navigation bar
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Documentation', link: '/docs/' },
      { text: 'Commands', link: '/commands/' },
      {
        text: 'Guides',
        items: [
          { text: 'Quick Reference', link: '/QUICK-REFERENCE' },
          { text: 'When AI Helps', link: '/WHEN-AI-HELPS' },
          { text: 'IDE Integration', link: '/IDE-INTEGRATION' },
          { text: 'Security Scanning', link: '/SAST-INTEGRATION' },
          { text: 'Metrics Dashboard', link: '/METRICS-VISUALIZATION' },
          { text: 'Team Memory', link: '/TEAM-MEMORY-FEDERATION' },
          { text: 'Model Selection', link: '/MODEL-SELECTION' },
          { text: 'Troubleshooting', link: '/TROUBLESHOOTING' }
        ]
      },
      {
        text: 'v1.0.0',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'Claude Agent SDK', link: '/AGENT-SDK' },
          { text: 'AAIF Standard', link: '/AAIF' },
          { text: 'MCP OAuth', link: '/MCP-OAUTH' },
          { text: 'MCP Tasks', link: '/MCP-TASKS' },
          { text: 'MCP Registry', link: '/MCP-REGISTRY' },
          { text: 'Research Citations', link: '/RESEARCH-CITATIONS' },
          { text: 'DORA Integration', link: '/DORA-INTEGRATION' },
          { text: 'PostgreSQL Deployment', link: '/POSTGRESQL-DEPLOYMENT' },
          { text: 'Enterprise Guide', link: '/guides/enterprise' },
          { text: 'VS Code Integration', link: '/guides/vscode-integration' },
          { text: 'GitHub', link: 'https://github.com/ai-excellence-framework/ai-excellence-framework' }
        ]
      }
    ],

    // Sidebar configuration
    sidebar: {
      '/docs/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is AI Excellence?', link: '/docs/' },
            { text: 'Why This Framework?', link: '/docs/why' },
            { text: 'Core Concepts', link: '/docs/concepts' }
          ]
        },
        {
          text: 'The Friction Problem',
          items: [
            { text: 'Understanding Friction', link: '/docs/friction/' },
            { text: 'Context Management', link: '/docs/friction/context' },
            { text: 'Security Concerns', link: '/docs/friction/security' },
            { text: 'Quality Degradation', link: '/docs/friction/quality' },
            { text: 'Research Findings', link: '/docs/friction/research' }
          ]
        },
        {
          text: 'Mitigation Strategies',
          items: [
            { text: 'Overview', link: '/docs/mitigations/' },
            { text: 'CLAUDE.md Best Practices', link: '/docs/mitigations/claude-md' },
            { text: 'Slash Commands', link: '/docs/mitigations/commands' },
            { text: 'Subagents', link: '/docs/mitigations/agents' },
            { text: 'MCP Server', link: '/docs/mitigations/mcp' },
            { text: 'Git Hooks', link: '/docs/mitigations/hooks' }
          ]
        },
        {
          text: 'Security',
          items: [
            { text: 'Overview', link: '/docs/security/' },
            { text: 'AI-Specific Vulnerabilities', link: '/docs/security/ai-vulns' },
            { text: 'MCP Security', link: '/MCP-SECURITY' },
            { text: 'SAST Integration', link: '/SAST-INTEGRATION' },
            { text: 'Security Checklist', link: '/docs/security/checklist' }
          ]
        },
        {
          text: 'Team Adoption',
          items: [
            { text: 'Team Setup', link: '/docs/team/' },
            { text: 'Memory Federation', link: '/TEAM-MEMORY-FEDERATION' },
            { text: 'Convention Enforcement', link: '/docs/team/conventions' },
            { text: 'Metrics & Insights', link: '/METRICS-VISUALIZATION' }
          ]
        }
      ],
      '/commands/': [
        {
          text: 'Slash Commands',
          items: [
            { text: 'Overview', link: '/commands/' },
            { text: '/plan', link: '/commands/plan' },
            { text: '/verify', link: '/commands/verify' },
            { text: '/handoff', link: '/commands/handoff' },
            { text: '/assumptions', link: '/commands/assumptions' },
            { text: '/review', link: '/commands/review' },
            { text: '/security-review', link: '/commands/security-review' },
            { text: '/refactor', link: '/commands/refactor' },
            { text: '/test-coverage', link: '/commands/test-coverage' }
          ]
        },
        {
          text: 'Subagents',
          items: [
            { text: 'Overview', link: '/commands/agents/' },
            { text: 'Explorer', link: '/commands/agents/explorer' },
            { text: 'Reviewer', link: '/commands/agents/reviewer' },
            { text: 'Tester', link: '/commands/agents/tester' }
          ]
        }
      ],
      '/': [
        {
          text: 'Guides',
          items: [
            { text: 'Quick Reference', link: '/QUICK-REFERENCE' },
            { text: 'Architecture', link: '/ARCHITECTURE' },
            { text: 'When AI Helps', link: '/WHEN-AI-HELPS' },
            { text: 'IDE Integration', link: '/IDE-INTEGRATION' },
            { text: 'SAST Integration', link: '/SAST-INTEGRATION' },
            { text: 'Metrics Dashboard', link: '/METRICS-VISUALIZATION' },
            { text: 'DORA Integration', link: '/DORA-INTEGRATION' },
            { text: 'Team Memory', link: '/TEAM-MEMORY-FEDERATION' },
            { text: 'PostgreSQL Deployment', link: '/POSTGRESQL-DEPLOYMENT' },
            { text: 'Claude Agent SDK', link: '/AGENT-SDK' },
            { text: 'MCP Security', link: '/MCP-SECURITY' },
            { text: 'MCP OAuth', link: '/MCP-OAUTH' },
            { text: 'MCP Tasks', link: '/MCP-TASKS' },
            { text: 'MCP Registry', link: '/MCP-REGISTRY' },
            { text: 'AAIF Standard', link: '/AAIF' },
            { text: 'Model Selection', link: '/MODEL-SELECTION' },
            { text: 'Troubleshooting', link: '/TROUBLESHOOTING' },
            { text: 'Research Citations', link: '/RESEARCH-CITATIONS' }
          ]
        },
        {
          text: 'Contributing',
          items: [
            { text: 'How to Contribute', link: '/CONTRIBUTING' },
            { text: 'Session Notes', link: '/session-notes/' }
          ]
        }
      ]
    },

    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ai-excellence-framework/ai-excellence-framework' }
    ],

    // Footer
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-2026 AI Excellence Framework Contributors'
    },

    // Edit link
    editLink: {
      pattern: 'https://github.com/ai-excellence-framework/ai-excellence-framework/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    // Last updated
    lastUpdated: {
      text: 'Updated at',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    },

    // Search (local)
    search: {
      provider: 'local'
    },

    // Outline depth
    outline: {
      level: [2, 3],
      label: 'On this page'
    }
  },

  // Markdown configuration
  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  },

  // Head metadata
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'en' }],
    ['meta', { name: 'og:site_name', content: 'AI Excellence Framework' }],
    ['meta', { name: 'og:title', content: 'AI Excellence Framework' }],
    ['meta', { name: 'og:description', content: 'A comprehensive framework for reducing friction in AI-assisted software development' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'AI Excellence Framework' }],
    ['meta', { name: 'twitter:description', content: 'Reduce friction in AI-assisted development' }]
  ],

  // Sitemap
  sitemap: {
    hostname: 'https://ai-excellence-framework.github.io/'
  }
})
