FROM golang:1.24-alpine AS builder

WORKDIR /app
RUN apk add build-base
COPY go.mod go.sum ./
RUN go mod download
COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o backend .


FROM alpine:3.20 AS runner
WORKDIR /app

COPY --from=builder /app/backend .
RUN apk update && apk add ca-certificates bash
EXPOSE 8080

CMD ["./backend"]

