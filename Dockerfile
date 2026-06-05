FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:css

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/*.html ./
COPY --from=build /app/admin ./admin
COPY --from=build /app/content ./content
COPY --from=build /app/css ./css
COPY --from=build /app/images ./images
COPY --from=build /app/js ./js
COPY --from=build /app/projects ./projects
COPY --from=build /app/services ./services
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
