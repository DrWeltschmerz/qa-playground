# syntax=docker/dockerfile:1
FROM golang:1.24-alpine AS builder
WORKDIR /app
RUN apk add --no-cache git
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Install swag and generate docs
RUN go install github.com/swaggo/swag/cmd/swag@latest
RUN swag init --ot go,json --output docs/
# Fix the generated docs to remove problematic fields
RUN sed -i 's/LeftDelim:.*"{{",//g; s/RightDelim:.*"}}",//g' docs/docs.go
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server

FROM gcr.io/distroless/base-debian12
WORKDIR /
EXPOSE 8082
COPY --from=builder /app/server /server
USER 65532:65532
ENTRYPOINT ["/server"]
