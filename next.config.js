module.exports = {
  output: 'export',
  // GitHub Pages serves the site under /nbl; Workers serves it at the root.
  // Set NEXT_BASE_PATH=/nbl for the Pages build, leave unset for Workers.
  basePath: process.env.NEXT_BASE_PATH || '',
  images: {
    unoptimized: true,
    domains: ['gravatar.com']
  },
  eslint: {
    // dirs: ['components', 'layouts', 'lib', 'pages']
  },
  async headers() {
    return [
      {
        source: '/:path*{/}?',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'interest-cohort=()'
          }
        ]
      }
    ]
  },
  transpilePackages: ['dayjs'],
  webpack: (config) => {
    // pdfjs-dist (via react-pdf / react-notion-x) requires 'canvas' at bundle
    // time, but nothing on the site renders PDFs, so stub it out instead of
    // installing the native canvas module (no prebuilt binary for Node 26).
    config.resolve.alias.canvas = false
    return config
  }
  // webpack: (config, { dev, isServer }) => {
  //   // Replace React with Preact only in client production build
  //   if (!dev && !isServer) {
  //     Object.assign(config.resolve.alias, {
  //       react: 'preact/compat',
  //       'react-dom/test-utils': 'preact/test-utils',
  //       'react-dom': 'preact/compat'
  //     })
  //   }
  //   return config
  // }
}
