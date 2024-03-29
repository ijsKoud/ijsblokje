FROM node:18-alpine AS base


# --- Builder ---
FROM base AS builder
WORKDIR /ijsblokje

RUN apk add --no-cache libc6-compat
RUN apk update

# Copy obly the needed files
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=discord-bot --docker


# --- Installer ---
FROM base AS installer
WORKDIR /ijsblokje

RUN apk add --no-cache libc6-compat
RUN apk update

# Install dependencies
COPY .gitignore .gitignore
COPY --from=builder /ijsblokje/out/json/ .
COPY --from=builder /ijsblokje/out/yarn.lock ./yarn.lock

COPY --from=builder /ijsblokje/.yarnrc.yml .yarnrc.yml
COPY --from=builder /ijsblokje/.yarn .yarn

RUN yarn --immutable

# Build the project
COPY --from=builder /ijsblokje/out/full/ .
COPY --from=builder /ijsblokje/tsconfig.json tsconfig.json
RUN yarn turbo run build --filter=discord-bot

# Remove dev-dependencies from node_modules
RUN yarn pinst --disable
RUN yarn workspaces focus --production --all


# --- Runner ---
FROM base AS runner

WORKDIR /ijsblokje

ENV NODE_ENV="production"

# Set the user
RUN addgroup --system --gid 1001 app
RUN adduser --system --uid 1001 app
USER app

# Copy over the application
COPY --from=installer --chown=app:app /ijsblokje/apps/discord-bot/dist ./apps/discord-bot/dist
COPY --from=installer --chown=app:app /ijsblokje/apps/discord-bot/package.json ./apps/discord-bot/package.json

# Copy over the packages
COPY --from=installer --chown=app:app /ijsblokje/package.json package.json
COPY --from=installer --chown=app:app /ijsblokje/node_modules node_modules

# @ijsblokje/server
COPY --from=installer --chown=app:app /ijsblokje/packages/server/dist ./packages/server/dist
COPY --from=installer --chown=app:app /ijsblokje/packages/server/package.json ./packages/server/package.json

# @ijsblokje/utils
COPY --from=installer --chown=app:app /ijsblokje/packages/utils/dist ./packages/utils/dist
COPY --from=installer --chown=app:app /ijsblokje/packages/utils/package.json ./packages/utils/package.json

CMD node ./apps/discord-bot/dist/index.js