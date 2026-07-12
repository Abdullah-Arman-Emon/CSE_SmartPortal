FROM node:20-alpine AS builder

WORKDIR /app

# package-lock.json is gitignored in this repo, so use `npm install`
# (a `COPY package-lock.json` would fail the build when the lock file is absent).
COPY package.json ./
RUN npm install

COPY . .

# Same-origin relative base. All API calls become /api/... and the reverse proxy
# forwards /api/ to the backend. Override at build time only if you know why.
ARG VITE_BACKEND_URL=/api
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
