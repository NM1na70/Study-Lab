# Build the client and server with the pinned Node and pnpm versions
FROM node:24.22.2-bookworm-slim AS build
WORKDIR /app

# Skip local Git hook installation in the build image
ENV CI=true LEFTHOOK=0
RUN npm install --global pnpm@10.32.1

# Install the frozen dependency tree before copying application sources for better layer reuse
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build && pnpm prune --prod

# Keep only runtime dependencies and built assets in the smaller final image
FROM node:24.22.2-alpine AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 DATABASE_PATH=/app/data/study.sqlite
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node scripts/backup.mjs scripts/restore.mjs ./scripts/

# Remove package-manager tools and prepare a learner-data directory owned by the non-root user
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /opt/yarn-v* /usr/local/bin/yarn* && mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3000

# Check the API and SQLite readiness before Docker reports the application as healthy
HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=12 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist/server/src/server/main.js"]
