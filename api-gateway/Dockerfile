# syntax=docker/dockerfile:1.6
FROM golang:1.24-alpine AS builder
WORKDIR /app
ENV GOTOOLCHAIN=local
RUN apk add --no-cache build-base git
COPY go.mod go.sum ./
ENV GOMODCACHE=/go/pkg/mod
RUN --mount=type=cache,target=/go/pkg/mod \
	--mount=type=cache,target=/root/.cache/go-build \
	go mod download
COPY . .
ENV CGO_ENABLED=1 GOOS=linux GOARCH=amd64
RUN --mount=type=cache,target=/go/pkg/mod \
	--mount=type=cache,target=/root/.cache/go-build \
	go build -buildvcs=false -trimpath -o server ./

FROM alpine:3.20
WORKDIR /
ENV PORT=8080
EXPOSE 8080
RUN adduser -D -H -u 65532 appuser && apk add --no-cache ca-certificates
COPY --from=builder /app/server /server
COPY static /static
USER 65532:65532
ENTRYPOINT ["/server"]
