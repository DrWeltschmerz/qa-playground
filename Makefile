SHELL := /bin/sh

# Allow overriding docker command (e.g., make DOCKER="sudo docker")
DOCKER ?= docker

.PHONY: up down logs test test-all test-ui test-ui-modal test-ui-tools test-api-only test-exercises test-smoke test-contract docs-users docs-all docs-gateway docs-gateway-export docs-adapters k6-smoke k6-baseline k6-stress k6-soak

up:
	$(DOCKER) compose up -d --build

down:
	$(DOCKER) compose down -v

logs:
	$(DOCKER) compose logs -f --tail=200 api

# Run Playwright tests (uses npx to avoid local install requirement)
# Usage: make test [WORKERS=8] [BASE_URL=http://localhost:8080]
WORKERS ?= 8
BASE_URL ?= http://localhost:8080
test:
	BASE_URL=$(BASE_URL) npx -y playwright@1.55.0 test --workers=$(WORKERS)
test-all: test

# UI-only test harness
test-ui:
	BASE_URL=$(BASE_URL) npx -y playwright@1.55.0 test --project=ui-demo --workers=$(WORKERS)

# Focused UI tests
test-ui-modal:
	BASE_URL=$(BASE_URL) npx -y playwright@1.55.0 test tests/ui/demo.modal.spec.ts --project=ui-demo --workers=$(WORKERS)

test-ui-tools:
	BASE_URL=$(BASE_URL) npx -y playwright@1.55.0 test tests/ui/tools-ui.*.spec.ts --project=ui-demo --workers=$(WORKERS)

# Other suites
test-api-only:
	BASE_URL=$(BASE_URL) npx -y playwright@1.55.0 test --project=api-tests --workers=$(WORKERS)

test-exercises:
	BASE_URL=$(BASE_URL) npx -y playwright@1.55.0 test --project=exercises --workers=$(WORKERS)

# Tag-based slices
test-smoke:
	BASE_URL=$(BASE_URL) npx -y playwright@1.55.0 test --project=smoke --workers=$(WORKERS)

test-contract:
	BASE_URL=$(BASE_URL) npx -y playwright@1.55.0 test --project=contract --workers=$(WORKERS)

# Generate all documentation
docs-all: docs-users docs-gateway docs-adapters
	@echo "All API documentation generated successfully!"

# Generate gateway documentation  
docs-gateway:
	@which swag >/dev/null 2>&1 || (echo "Installing swag..." && go install github.com/swaggo/swag/cmd/swag@latest)
	cd api-gateway && swag init --ot go,json --output docs/
	@echo "Gateway documentation generated"

# Export gateway swagger.json to static/specs/gateway.json for offline browsing
docs-gateway-export: docs-gateway
	mkdir -p api-gateway/static/specs
	cp -v api-gateway/docs/swagger.json api-gateway/static/specs/gateway.json
	@echo "Gateway JSON exported to api-gateway/static/specs/gateway.json"

# Generate adapter documentation
docs-adapters:
	@which swag >/dev/null 2>&1 || (echo "Installing swag..." && go install github.com/swaggo/swag/cmd/swag@latest)
	cd services/adapter-a && swag init
	cd services/adapter-b && swag init
	@echo "Adapter documentation generated"



# Generate users-adapter-gin Swagger JSON locally and copy to the gateway's static specs
docs-users:
	@which swag >/dev/null 2>&1 || (echo "Installing swag..." && go install github.com/swaggo/swag/cmd/swag@latest)
	@which jq >/dev/null 2>&1 || (echo "Installing jq..." && sudo apt-get update && sudo apt-get install -y jq)
	rm -rf tmp-users-adapter-gin
	git clone --depth 1 https://github.com/DrWeltschmerz/users-adapter-gin tmp-users-adapter-gin
	@echo "Generating comprehensive Swagger documentation from users-adapter-gin source code..."
	@set -e; cd tmp-users-adapter-gin; \
		echo "Normalizing go.mod (removing local replace directives)..."; \
		sed -i -E '/^replace .*DrWeltschmerz\/(users-core|users-adapter-gorm|jwt-auth)/d' go.mod; \
		echo "Pinning module versions..."; \
		go mod edit -require=github.com/DrWeltschmerz/users-core@v1.2.0; \
		go mod edit -require=github.com/DrWeltschmerz/users-adapter-gorm@v1.2.0; \
		go mod edit -require=github.com/DrWeltschmerz/jwt-auth@v1.2.0; \
		go mod tidy; \
		echo "Running enhanced documentation generator..."; \
		../scripts/generate-users-swagger.sh $$PWD
	@test -s tmp-users-adapter-gin/docs/swagger.json || (echo "ERROR: swagger.json was not generated" && exit 1)
	mkdir -p api-gateway/static/specs
	cp -v tmp-users-adapter-gin/docs/swagger.json api-gateway/static/specs/users.json
	@echo "users.json generated at api-gateway/static/specs/users.json"
	@echo "Endpoints: $$(cat api-gateway/static/specs/users.json | jq '.paths | length' 2>/dev/null || echo 'unknown')"
	@echo "Cleaning up tmp-users-adapter-gin..."
	rm -rf tmp-users-adapter-gin || true

# k6
k6-smoke:
	@echo "Run: docker run --network host -i grafana/k6 run -e BASE_URL=$${BASE_URL:-http://localhost:8080} -e SERVICE_API_KEY=$${SERVICE_API_KEY:-service-secret} - < tests/perf/k6-smoke.js"
k6-baseline:
	@echo "Run: docker run --network host -i grafana/k6 run -e BASE_URL=$${BASE_URL:-http://localhost:8080} -e SERVICE_API_KEY=$${SERVICE_API_KEY:-service-secret} - < tests/perf/k6-baseline.js"
k6-stress:
	@echo "Run: docker run --network host -i grafana/k6 run -e BASE_URL=$${BASE_URL:-http://localhost:8080} -e SERVICE_API_KEY=$${SERVICE_API_KEY:-service-secret} - < tests/perf/k6-stress.js"
k6-soak:
	@echo "Run: docker run --network host -i grafana/k6 run -e BASE_URL=$${BASE_URL:-http://localhost:8080} -e SERVICE_API_KEY=$${SERVICE_API_KEY:-service-secret} - < tests/perf/k6-soak.js"
