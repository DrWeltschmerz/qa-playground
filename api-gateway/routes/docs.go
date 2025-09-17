package routes

import "github.com/gin-gonic/gin"

// @Summary API Documentation Index
// @Description Lists all available API documentation
// @Tags documentation
// @Produce html
// @Success 200 {string} string "HTML page"
// @Router /docs [get]
func DocsIndex(c *gin.Context) {
	html := `<!DOCTYPE html>
<html>
<head>
	<title>API Documentation</title>
	<style>
		body { font-family: Arial, sans-serif; margin: 40px; }
		.api-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
		.api-card h3 { margin-top: 0; color: #2c3e50; }
		.api-card a { color: #3498db; text-decoration: none; }
		.api-card a:hover { text-decoration: underline; }
	</style>
</head>
<body>
	<h1>QA Showcase - API Documentation</h1>
	<div class="api-card">
		<h3>Gateway API</h3>
		<p>Main API gateway with AI completion and user management</p>
		<a href="/swagger/index.html">View Documentation</a>
		<p style="margin-top:8px"><a href="/specs/gateway.json" target="_blank">View JSON spec (offline)</a></p>
	</div>
	<div class="api-card">
		<h3>AI Adapter A</h3>
		<p>AI completion service adapter A</p>
		<a href="http://localhost:8081/swagger/index.html" target="_blank">View Documentation</a>
	</div>
	<div class="api-card">
		<h3>AI Adapter B</h3>
		<p>AI completion service adapter B</p>
		<a href="http://localhost:8082/swagger/index.html" target="_blank">View Documentation</a>
	</div>
	<div class="api-card">
		<h3>Users API</h3>
		<p>User management and authentication</p>
		<a href="/docs/users/index.html">View Documentation</a>
	</div>
	<div class="api-card">
		<h3>Unified API Browser</h3>
		<p>Interactive browser for all APIs with spec switching</p>
		<a href="/docs/unified">View All APIs</a>
	</div>
</body>
</html>`
	c.Header("Content-Type", "text/html")
	c.String(200, html)
}

// @Summary Users API Swagger UI
// @Description Swagger UI for the Users API
// @Tags documentation
// @Produce html
// @Success 200 {string} string "HTML page"
// @Router /docs/users/{path} [get]
func UsersSwaggerHandler(c *gin.Context) {
	html := `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Users API Documentation</title>
	<link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
	<style>
		html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
		*, *:before, *:after { box-sizing: inherit; }
		body { margin:0; background: #fafafa; }
		.loading { padding: 40px; text-align: center; color: #666; }
		.error { padding: 40px; text-align: center; color: #d32f2f; background: #ffebee; border-radius: 8px; margin: 20px; }
	</style>
</head>
<body>
	<div id="swagger-ui">
		<div class="loading">Loading Users API documentation...</div>
	</div>
	<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
	<script>
		function initializeSwagger() {
			if (typeof SwaggerUIBundle === 'undefined') {
				setTimeout(initializeSwagger, 100);
				return;
			}
			fetch('/specs/users.json')
				.then(response => {
					if (!response.ok) {
						throw new Error('Failed to load users spec: HTTP ' + response.status);
					}
					return response.json();
				})
				.then(spec => {
					console.log('Loaded users spec with', Object.keys(spec.paths || {}).length, 'endpoints');
					const ui = SwaggerUIBundle({
						spec: spec,
						dom_id: '#swagger-ui',
						deepLinking: true,
						presets: [
							SwaggerUIBundle.presets.apis,
							SwaggerUIBundle.presets.standalone
						],
						layout: "BaseLayout",
						validatorUrl: null,
						requestInterceptor: function(req) {
							console.log('API Request:', req.method, req.url);
							return req;
						},
						onComplete: function() {
							console.log('Users API Swagger UI loaded successfully');
						},
						onFailure: function(error) {
							console.error('Swagger UI initialization failed:', error);
							document.getElementById('swagger-ui').innerHTML = 
								'<div class="error"><h3>Failed to initialize Users API documentation</h3><p>' + 
								error.message + '</p></div>';
						}
					});
				})
				.catch(error => {
					console.error('Error loading users spec:', error);
					document.getElementById('swagger-ui').innerHTML = 
						'<div class="error"><h3>Error loading Users API specification</h3><p>' + 
						error.message + '</p><p><a href="/specs/users.json" target="_blank">View raw specification</a></p></div>';
				});
		}
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', initializeSwagger);
		} else {
			initializeSwagger();
		}
	</script>
</body>
</html>`
	c.Header("Content-Type", "text/html")
	c.String(200, html)
}

// @Summary Unified API Browser
// @Description Interactive browser for all APIs with spec switching
// @Tags documentation
// @Produce html
// @Success 200 {string} string "HTML page"
// @Router /docs/unified [get]
func UnifiedSwaggerHandler(c *gin.Context) {
	html := `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>QA Showcase - Unified API Browser</title>
	<link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
	<style>
		html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
		*, *:before, *:after { box-sizing: inherit; }
		body { margin:0; background: #fafafa; }
		.api-selector { padding: 20px; background: #fff; border-bottom: 1px solid #ddd; }
		.api-selector h2 { margin: 0 0 15px 0; color: #3b4151; }
		.api-selector select { padding: 10px; font-size: 16px; border: 1px solid #ddd; border-radius: 4px; }
	</style>
</head>
<body>
	<div class="api-selector">
		<h2>QA Showcase API Documentation</h2>
		<label for="api-select">Select API:</label>
		<select id="api-select" onchange="loadAPI()">
			<option value="/swagger/doc.json">Gateway API (Main)</option>
			<option value="/specs/users.json">Users API</option>
			<option value="http://localhost:8081/swagger/doc.json">AI Adapter A</option>
			<option value="http://localhost:8082/swagger/doc.json">AI Adapter B</option>
		</select>
	</div>
	<div id="swagger-ui"></div>
	<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
	<script>
		let ui;
		function loadAPI() {
			const select = document.getElementById('api-select');
			const url = select.value;
			const uiContainer = document.getElementById('swagger-ui');
			uiContainer.innerHTML = '<div style="padding: 20px; text-align: center;">Loading API specification...</div>';
			if (url.startsWith('http://localhost:808')) {
				fetch(url)
					.then(response => {
						if (!response.ok) {
							throw new Error('HTTP ' + response.status + ': ' + response.statusText);
						}
						return response.json();
					})
					.then(spec => {
						initializeUIWithSpec(spec);
					})
					.catch(error => {
						console.warn('CORS/fetch error for', url, '- providing direct link instead');
						const serviceName = url.includes('8081') ? 'AI Adapter A' : 'AI Adapter B';
						const directUrl = url.replace('/swagger/doc.json', '/swagger/index.html');
						uiContainer.innerHTML = 
							'<div style="padding: 40px; text-align: center; background: #f8f9fa; border-radius: 8px; margin: 20px;">' +
								'<h3>🔗 ' + serviceName + '</h3>' +
								'<p>Due to CORS restrictions, this API must be viewed directly.</p>' +
								'<p><a href="' + directUrl + '" target="_blank" style="background: #007bff; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; display: inline-block;">' +
									'Open ' + serviceName + ' Documentation' +
								'</a></p>' +
								'<p style="margin-top: 20px; color: #666; font-size: 14px;">' +
									'This will open the full Swagger UI in a new tab where you can explore and test the API.' +
								'</p>' +
							'</div>';
					});
			} else {
				fetch(url)
					.then(response => {
						if (!response.ok) {
							throw new Error('HTTP ' + response.status + ': ' + response.statusText);
						}
						return response.json();
					})
					.then(spec => {
						console.log('Loaded same-origin spec:', url);
						initializeUIWithSpec(spec);
					})
					.catch(error => {
						console.error('Error loading spec:', error);
						uiContainer.innerHTML = 
							'<div style="padding: 40px; text-align: center; color: #d32f2f; background: #ffebee; border-radius: 8px; margin: 20px;">' +
								'<h3>Error loading API specification</h3>' +
								'<p>' + error.message + '</p>' +
								'<p><a href="' + url + '" target="_blank">View raw specification</a></p>' +
							'</div>';
					});
			}
		}
		function initializeUIWithSpec(spec) {
			try {
				ui = SwaggerUIBundle({
					spec: spec,
					dom_id: '#swagger-ui',
					deepLinking: true,
					presets: [
						SwaggerUIBundle.presets.apis,
						SwaggerUIBundle.presets.standalone
					],
					layout: "BaseLayout",
					validatorUrl: null,
					requestInterceptor: function(req) {
						console.log('API Request:', req.method, req.url);
						return req;
					},
					onComplete: function() {
						console.log('Swagger UI loaded successfully');
					},
					onFailure: function(error) {
						console.error('Swagger UI initialization failed:', error);
						document.getElementById('swagger-ui').innerHTML = 
							'<div style="padding: 40px; text-align: center; color: #d32f2f; background: #ffebee; border-radius: 8px; margin: 20px;">' +
								'<h3>Failed to initialize API documentation</h3>' +
								'<p>' + error.message + '</p>' +
							'</div>';
					}
				});
			} catch (error) {
				console.error('Error initializing Swagger UI:', error);
			}
		}
	</script>
</body>
</html>`
	c.Header("Content-Type", "text/html")
	c.String(200, html)
}
