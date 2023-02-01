FROM node:16-alpine

# Installs latest Chromium (100) package.
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD 1
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium-browser

# Add user so we don't need --no-sandbox.
RUN addgroup -S pptruser && adduser -S -G pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

WORKDIR /home/pptruser

COPY package*.json ./

RUN npm ci --only=production

COPY . .

# Fix pptr can't write anywhere cause files created by Docker
RUN chown -R pptruser:pptruser /home/pptruser/*

# Run everything after as non-privileged user.
USER pptruser

EXPOSE 3000

# CMD [ "npm", "run", "deploy" ]
CMD ["tail", "-f", "/dev/null"]

