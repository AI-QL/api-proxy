#!/usr/bin/env node

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// ========== Default Config ==========
const defaultPort = 9017;
const defaultTarget = 'https://api.openai.com';

// ========== Core Proxy App ==========
function createProxyApp(target, host) {
  const app = express();

  app.use('/', createProxyMiddleware(
    {
      ...target,
      changeOrigin: true,
      on: {
        proxyReq: (proxyReq, req, res) => {
          proxyReq.removeHeader('x-forwarded-for');
          proxyReq.removeHeader('x-real-ip');

          if (host) {
            proxyReq.setHeader('Host', host);
          }

        },
        proxyRes: (proxyRes, req, res) => {
          proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, api_key, Authorization';
        },
        error: (err, req, res) => {
          console.error('Proxy error:', err);
          res.status(500).json({
            error: 'Proxy Error',
            message: err.message
          });
        },
      },
    }));

  return app;
}

// ========== Main App ==========
const parseArguments = () => {
  const argv = yargs(hideBin(process.argv))
    .options({
      port: {
        type: 'number',
        demandOption: false,
        describe: 'Server port number (valid range: 1-65535)',
        alias: 'P'
      },
      target: {
        type: 'string',
        demandOption: false,
        describe: 'Target URL or API endpoint to connect to',
        alias: 'T'
      },
      host: {
        type: 'string',
        demandOption: false,
        describe: 'Host header specifying the domain name',
        alias: 'H'
      },
      secure: {
        type: 'boolean',
        demandOption: false,
        describe: 'Enables security features, such as TLS certificate validation',
        alias: 'S'
      }
    })
    .check(argv => {
      if (argv.port !== undefined) {
        if (!Number.isInteger(argv.port) || argv.port <= 0 || argv.port > 65535) {
          throw new Error('Port must be an integer between 1 and 65535');
        }
      }
      if (argv.security !== undefined && argv.security !== false) {
        throw new Error('Do not set --security to true. If provided, --security must be false (use --security=false) because security features are enabled by default.');
      }
      return true;
    }).strict()
    .help().alias('help', 'h')
    .argv;

  return argv;

};

const validatePort = (port) => {
  const portNum = parseInt(port);
  if (isNaN(portNum)) throw new Error(`Invalid port: ${port}`);
  if (portNum < 1 || portNum > 65535) throw new Error(`Port out of range: ${port}`);
  return portNum;
};

const validateTarget = (target) => {
  try {
    new URL(target);
    return target;
  } catch {
    throw new Error(`Invalid target URL: ${target}`);
  }
};

const runProxy = () => {
  try {
    const args = parseArguments();
    const port = args.port || process.env.PORT || defaultPort;
    const target = args.target || process.env.TARGET || defaultTarget;
    const host = args.host || process.env.HOST;
    const secure = args.secure ?? process.env.SECURE

    const validatedPort = validatePort(port);
    const validatedTarget = validateTarget(target);

    const validatedProxyParams = {
      target: validatedTarget
    }

    if (secure === 'false' || secure === false) {
      validatedProxyParams.secure = false
    }

    const app = createProxyApp(validatedProxyParams, host);

    const server = app.listen(validatedPort, () => {
      console.log('API Proxy running:');
      console.log(`    Local  : http://localhost:${validatedPort}`);
      console.log(`    Target : ${validatedTarget}`);
      console.log(`    Host   : ${host ? host : 'Inherited from the target URL'}`);
      console.log(`    Secure : ${validatedProxyParams.secure ?? 'Enabled by default'}`);
      console.log('\nPress Ctrl+C to stop');
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${validatedPort} is already in use`);
      } else {
        console.error(`❌ Server error: ${err.message}`);
      }
      process.exit(1);
    });

    process.on('SIGINT', () => {
      console.log('\nShutting down proxy...');
      server.close(() => process.exit(0));
    });

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

runProxy();