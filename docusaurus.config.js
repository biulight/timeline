// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require('prism-react-renderer');
const lightTheme = themes.github;
const darkTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'biulight Site',
  tagline: '持续记录学习',
  url: 'https://your-docusaurus-test-site.com',
  baseUrl: '/timeline/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  // organizationName: 'facebook', // Usually your GitHub org/user name.
  // projectName: 'docusaurus', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          path: 'blog',
          routeBasePath: 'blog',
          showReadingTime: true,
          blogSidebarTitle: 'All our posts',
          blogSidebarCount: 'ALL',
          feedOptions: {
            type: 'all',
            copyright: `Copyright © ${new Date().getFullYear()} Biulight`,
            createFeedItems: async (params) => {
              const { blogPosts, defaultCreateFeedItems, ...rest } = params;
              return defaultCreateFeedItems({
                // keep only the 10 most recent blog posts in the feed
                blogPosts: blogPosts.filter((item, index) => index < 10),
                ...rest,
              });
            },
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        gtag: {
          trackingID: 'G-9T8R2R2Y3V',
          anonymizeIP: true, // Should IPs be anonymized?
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'biulight Site',
        logo: {
          alt: 'biulight Site Logo',
          src: 'img/logo1.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'frontend',
            position: 'left',
            label: 'Frontend',
          },
          {
            type: 'docSidebar',
            sidebarId: 'learning',
            position: 'left',
            label: 'Learning',
          },
          {
            type: 'docSidebar',
            sidebarId: 'developing',
            position: 'left',
            label: 'Developing',
          },
          { to: '/blog', label: 'Blog', position: 'left' },
          // {
          //   type: 'docsVersionDropdown',
          //   position: 'right',
          // },
          {
            href: 'https://github.com/biulight/blog',
            label: 'GitHub',
            position: 'right',
          },
          { href: 'https://blog.biulight.cn/timeline/blog/rss.xml', label: 'RSS', position: 'right' },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Frontend',
                to: '/frontend',
              },
            ],
          },
          // {
          //   title: 'Community',
          //   items: [
          //     {
          //       label: 'Stack Overflow',
          //       href: 'https://stackoverflow.com/questions/tagged/docusaurus',
          //     },
          //     {
          //       label: 'Discord',
          //       href: 'https://discordapp.com/invite/docusaurus',
          //     },
          //     {
          //       label: 'Twitter',
          //       href: 'https://twitter.com/docusaurus',
          //     },
          //   ],
          // },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/biulight/blog',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Biulight. Built with Docusaurus.<br /><a href="//beian.miit.gov.cn">苏ICP备2020068292号-3</a>`,
      },
      prism: {
        theme: lightTheme,
        darkTheme: darkTheme,
      },
      algolia: {
        // Algolia 提供的应用 ID
        appId: 'YHLGHU6YJW',
        //  公开 API 密钥：提交它没有危险
        apiKey: 'a2e1086e4eb8f15bcd10b7e5a892a8e2',
        indexName: 'biulight',
        // 可选：见下文
        contextualSearch: true,
        // 可选：声明哪些域名需要用 window.location 型的导航而不是 history.push。 适用于 Algolia 配置会爬取多个文档站点，而我们想要用 window.location.href 在它们之间跳转时。
        externalUrlRegex: 'external\\.com|domain\\.com',
        // 可选：替换 Algolia 的部分网址。 在使用相同搜索索引支持多个不同 baseUrl 的部署时非常有用。 你可以在 “from” 中使用正则表达式或字符串。 比方说，localhost:3000 和 myCompany.com/docs
        replaceSearchResultPathname: {
          from: '/docs/', // or as RegExp: /\/docs\//
          to: '/',
        },
        // 可选：Algolia 搜索参数
        searchParameters: {},
        // 可选：默认启用的搜索页路径（传递 `false` 以禁用它）
        searchPagePath: 'search',
        // 可选：Docsearch 的 insights 功能是否启用（默认为 `false`）
        insights: false,
        //... 其他 Algolia 参数
      },
    }),
};

module.exports = config;
