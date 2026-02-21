FROM node:18-alpine as build
WORKDIR /app
# Use /api so frontend calls nginx reverse proxy
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
# Copy built React app
COPY --from=build /app/dist /usr/share/nginx/html
# Copy nginx config with reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
