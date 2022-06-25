FROM node:16-alpine

# Create user ijsblockje
RUN addgroup --system --gid 1639 ijsblokje
RUN adduser --system --uid 1639 ijsblokje

# Create Directories with correct permissions
RUN mkdir -p /ijsblokje/node_modules && chown -R ijsblokje:ijsblokje /ijsblokje/

# Move to correct dir
WORKDIR /ijsblokje

# Register Environment Variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy Existing Files
COPY package.json yarn.lock .yarnrc.yml next.config.js global.d.ts next-env.d.ts tsconfig.json ./
copy prisma ./prisma
COPY .yarn ./.yarn
COPY public ./public
COPY src ./src

# Install dependencies
RUN yarn install --immutable

# Change User
USER ijsblokje

# Start Application
CMD ["yarn", "start"]
