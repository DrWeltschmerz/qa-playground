# k6 Load Tests

- k6-smoke.js — quick CI/local smoke
- k6-baseline.js — steady-state baseline
- k6-stress.js — ramp-up to find limits
- k6-soak.js — longer run to detect leaks

Run with Docker or native k6.

Env vars:
- BASE_URL — base HTTP URL for the gateway (default http://localhost:8080)
- SERVICE_API_KEY — maps to the gateway header `x-api-key` (default service-secret)

Tip: When running with Docker locally, use `--network host` so k6 can reach services on localhost:

Example:
```zsh
docker run --network host -i grafana/k6 run \
	-e BASE_URL=http://localhost:8080 \
	-e SERVICE_API_KEY=service-secret \
	- < tests/perf/k6-baseline.js
```
