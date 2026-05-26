import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Required for @ricky0123/vad-react (ONNX Runtime Web WASM files)
  webpack: (config) => {
    // Force webpack to resolve modules from the project root, not the
    // parent /Users/shekheee directory which has a stray package.json
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      'node_modules',
    ]
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      'onnxruntime-node$': false,
    }
    // Stop webpack from trying to bundle the pdfjs worker as a separate chunk.
    // Server-side API routes don't need a real worker thread.
    config.resolve.alias['pdfjs-dist/legacy/build/pdf.worker.mjs'] =
      path.resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')
    return config
  },
  // Allow serving ONNX WASM files
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ]
  },
};

export default nextConfig;

