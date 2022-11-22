# Builder Steps
FROM node:19-alpine as base
WORKDIR /ijsblokje

COPY --chown=node:node yarn.lock .
COPY --chown=node:node package.json .
COPY --chown=node:node .yarnrc.yml .
COPY --chown=node:node .yarn/ .yarn/

RUN mkdir /ijsblokje/data

# Builder Steps
FROM base as builder

COPY --chown=node:node tsconfig.json tsconfig.json
COPY --chown=node:node src/ src/

RUN yarn install --immutable
RUN yarn build

# Runner Steps
FROM base as runner

ENV NODE_ENV="production"
COPY --chown=node:node --from=builder /ijsblokje/dist dist
COPY --chown=node:node --from=builder /ijsblokje/node_modules node_modules

RUN chown node:node /ijsblokje
RUN chown node:node /ijsblokje/data

USER node

CMD [ "yarn", "run", "start" ]