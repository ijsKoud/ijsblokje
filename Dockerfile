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

# Copy Existing Files
COPY package.json yarn.lock .yarnrc.yml tsconfig.json ./
COPY .yarn ./.yarn
COPY src ./src

# Install dependencies
RUN yarn install --immutable

# Change User
USER ijsblokje

# Start Application
CMD ["yarn", "start"]
