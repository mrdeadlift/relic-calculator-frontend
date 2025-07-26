const path = require('path')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const CompressionPlugin = require('compression-webpack-plugin')

module.exports = {
  // Bundle splitting for better caching
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        // Vue runtime
        vue: {
          test: /[\\/]node_modules[\\/]vue[\\/]/,
          name: 'vue',
          chunks: 'all',
          priority: 20,
        },
        // Common utilities
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
        // Large libraries
        lodash: {
          test: /[\\/]node_modules[\\/]lodash[\\/]/,
          name: 'lodash',
          chunks: 'all',
          priority: 15,
        },
      },
    },
    // Runtime chunk for better caching
    runtimeChunk: 'single',
  },

  // Performance budgets
  performance: {
    maxAssetSize: 250000, // 250KB
    maxEntrypointSize: 400000, // 400KB
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
  },

  plugins: [
    // Bundle analysis (only in development)
    ...(process.env.ANALYZE_BUNDLE ? [new BundleAnalyzerPlugin()] : []),

    // Gzip compression for production
    ...(process.env.NODE_ENV === 'production'
      ? [
          new CompressionPlugin({
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 8192,
            minRatio: 0.8,
          }),
        ]
      : []),
  ],

  // Module resolution optimizations
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@composables': path.resolve(__dirname, 'src/composables'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@stores': path.resolve(__dirname, 'src/stores'),
    },
    // Prioritize ES modules
    mainFields: ['browser', 'module', 'main'],
  },

  // Source map optimization
  devtool:
    process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',

  // Cache configuration
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },

  // Module rules for optimization
  module: {
    rules: [
      // Tree shaking for CSS
      {
        test: /\.css$/,
        sideEffects: false,
      },
      // Optimize images
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8KB
          },
        },
        generator: {
          filename: 'images/[name].[hash:8][ext]',
        },
      },
      // Font optimization
      {
        test: /\.(woff2?|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash:8][ext]',
        },
      },
    ],
  },

  // Development server optimizations
  devServer: {
    compress: true,
    hot: true,
    // Enable HTTP/2
    http2: true,
    // Optimize rebuild times
    watchFiles: {
      paths: ['src/**/*'],
      options: {
        usePolling: false,
        interval: 1000,
      },
    },
  },
}
