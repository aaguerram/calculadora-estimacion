# syntax=docker/dockerfile:1

# ---------- dependencias (compartido) ----------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- desarrollo: Vite con HMR ----------
FROM deps AS dev
ENV NODE_ENV=development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---------- build de produccion ----------
FROM deps AS build
COPY . .
ARG VITE_POSTGREST_URL=/api
ENV VITE_POSTGREST_URL=$VITE_POSTGREST_URL
RUN npm run build

# ---------- produccion: estaticos por nginx ----------
FROM nginx:1.27-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
