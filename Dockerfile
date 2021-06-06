FROM node:16-alpine

# Install all build dependencies
RUN apk update  \
    && apk add --virtual build-dependencies \
    build-base \
    dos2unix \
    python2-dev \
    && python2  \
    && apk add bash \
    && apk add libc6-compat

# Create app directory
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app



# Install GYP dependencies globally, will be used to code build other dependencies
RUN npm install -g --production node-gyp \
    && npm install -g --production node-pre-gyp \
    && npm cache clean --force \
    && npm install -g nodemon


# Install dependencies
COPY package.json .

USER node

RUN npm install \
    && npm cache clean --force

# Bundle app source
COPY --chown=node:node . .

EXPOSE 3001


CMD [ "nodemon", "index.js" ]