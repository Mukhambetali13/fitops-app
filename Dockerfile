FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM golang:1.22-alpine AS backend
WORKDIR /app/backend
COPY backend/go.mod ./
RUN go mod download || true
COPY backend/ ./
COPY --from=frontend /app/frontend/dist ./web/dist
RUN go mod tidy && go build -o /fitops .

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=backend /fitops /fitops
ENV PORT=8080
EXPOSE 8080
CMD ["/fitops"]
