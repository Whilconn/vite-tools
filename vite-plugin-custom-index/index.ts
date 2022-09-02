import * as fs from 'fs';
import { resolve } from 'path';
import { ViteDevServer } from 'vite';

export const customIndexPlugin = (indexPath: string) => ({
  name: 'vite-plugin-custom-index',
  configureServer(server: ViteDevServer) {
    indexPath = indexPath.replace(/^[\\/]/, '');

    return () => {
      server.middlewares.use(async (req: any, res, next) => {
        const urlPath = req.url.replace(/(\?|#).*$/, '');
        const rawFile = resolve(server.config.root, urlPath);
        const servedFile = resolve(server.config.root, indexPath);

        console.log('🔔 [request path]:', urlPath);

        if (res.writableEnded) {
          console.error('❌ response writableEnded');
          return next();
        }

        if (/xhr|scripts/.test(req.headers['sec-fetch-dest'])) {
          console.error('❌ request type error');
          return next();
        }

        if (!/\.html$/.test(urlPath)) {
          console.error('❌ requested file is not html');
          return next();
        }

        if (fs.existsSync(rawFile)) {
          console.error('❌ requested file existed:', rawFile);
          return next();
        }

        if (!fs.existsSync(servedFile)) {
          console.error('❌ served file not found:', servedFile);
          return next();
        }

        try {
          let html = fs.readFileSync(servedFile, 'utf-8');
          html = await server.transformIndexHtml(urlPath, html, req.originalUrl);

          console.log('🔔 [response file]:', indexPath);

          return res.end(html);
        } catch (e) {
          console.error(`❌ ${e.message}`);
          return next(e);
        }
      });
    };
  },
});
