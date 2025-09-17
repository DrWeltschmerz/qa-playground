package scripts

import (
	"encoding/json"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"io/ioutil"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

type SwaggerSpec struct {
	OpenAPI    string                 `json:"openapi"`
	Info       map[string]interface{} `json:"info"`
	Servers    []map[string]string    `json:"servers"`
	Paths      map[string]interface{} `json:"paths"`
	Components map[string]interface{} `json:"components"`
}

type EndpointInfo struct {
	Method      string
	Path        string
	Summary     string
	Description string
	Tags        []string
	Security    []map[string][]string
	RequestBody interface{}
	Responses   map[string]interface{}
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run generate-users-docs.go <users-adapter-gin-dir>")
		os.Exit(1)
	}

	sourceDir := os.Args[1]
	endpoints := extractEndpoints(sourceDir)

	spec := SwaggerSpec{
		OpenAPI: "3.0.0",
		Info: map[string]interface{}{
			"title":       "Users API",
			"version":     "1.0.0",
			"description": "API documentation for user management and authentication",
		},
		Servers: []map[string]string{
			{"url": "/"},
		},
		Paths: generatePaths(endpoints),
		Components: map[string]interface{}{
			"schemas": map[string]interface{}{
				"User": map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"id":       map[string]string{"type": "string"},
						"email":    map[string]string{"type": "string", "format": "email"},
						"username": map[string]string{"type": "string"},
						"roles":    map[string]interface{}{"type": "array", "items": map[string]string{"$ref": "#/components/schemas/Role"}},
					},
				},
				"Role": map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"id":          map[string]string{"type": "string"},
						"name":        map[string]string{"type": "string"},
						"description": map[string]string{"type": "string"},
					},
				},
			},
			"securitySchemes": map[string]interface{}{
				"BearerAuth": map[string]interface{}{
					"type":         "http",
					"scheme":       "bearer",
					"bearerFormat": "JWT",
				},
			},
		},
	}

	outputPath := filepath.Join(sourceDir, "docs", "swagger.json")
	os.MkdirAll(filepath.Dir(outputPath), 0755)

	data, _ := json.MarshalIndent(spec, "", "  ")
	ioutil.WriteFile(outputPath, data, 0644)

	fmt.Printf("Generated swagger.json with %d endpoints\n", len(endpoints))
}

func extractEndpoints(sourceDir string) []EndpointInfo {
	var endpoints []EndpointInfo

	// Parse the handler files
	handlerFile := filepath.Join(sourceDir, "ginadapter", "handler.go")
	adapterFile := filepath.Join(sourceDir, "ginadapter", "ginadapter.go")

	endpoints = append(endpoints, parseHandlerFile(handlerFile)...)
	endpoints = append(endpoints, parseRoutes(adapterFile)...)

	return endpoints
}

func parseHandlerFile(filePath string) []EndpointInfo {
	var endpoints []EndpointInfo

	src, err := ioutil.ReadFile(filePath)
	if err != nil {
		return endpoints
	}

	content := string(src)

	// Extract function comments and names
	fset := token.NewFileSet()
	node, err := parser.ParseFile(fset, filePath, src, parser.ParseComments)
	if err != nil {
		return endpoints
	}

	for _, decl := range node.Decls {
		if fn, ok := decl.(*ast.FuncDecl); ok {
			if fn.Name.IsExported() && strings.Contains(fn.Name.Name, "Register") {
				endpoints = append(endpoints, EndpointInfo{
					Method: "POST", Path: "/register",
					Summary: "Register a new user",
					Tags:    []string{"auth"},
				})
			} else if strings.Contains(fn.Name.Name, "Login") {
				endpoints = append(endpoints, EndpointInfo{
					Method: "POST", Path: "/login",
					Summary: "User login",
					Tags:    []string{"auth"},
				})
			} else if strings.Contains(fn.Name.Name, "Profile") {
				endpoints = append(endpoints, EndpointInfo{
					Method: "GET", Path: "/user/profile",
					Summary:  "Get user profile",
					Tags:     []string{"user"},
					Security: []map[string][]string{{"BearerAuth": {}}},
				})
			}
		}
	}

	return endpoints
}

func parseRoutes(filePath string) []EndpointInfo {
	var endpoints []EndpointInfo

	content, err := ioutil.ReadFile(filePath)
	if err != nil {
		return endpoints
	}

	// Parse route registrations
	routePattern := regexp.MustCompile(`r\.(GET|POST|PUT|DELETE)\("([^"]+)"`)
	matches := routePattern.FindAllStringSubmatch(string(content), -1)

	for _, match := range matches {
		method, path := match[1], match[2]
		endpoints = append(endpoints, EndpointInfo{
			Method:  method,
			Path:    path,
			Summary: fmt.Sprintf("%s %s", method, path),
		})
	}

	return endpoints
}

func generatePaths(endpoints []EndpointInfo) map[string]interface{} {
	paths := make(map[string]interface{})

	for _, endpoint := range endpoints {
		if paths[endpoint.Path] == nil {
			paths[endpoint.Path] = make(map[string]interface{})
		}

		pathItem := paths[endpoint.Path].(map[string]interface{})

		operation := map[string]interface{}{
			"summary": endpoint.Summary,
			"tags":    endpoint.Tags,
			"responses": map[string]interface{}{
				"200": map[string]interface{}{
					"description": "Success",
				},
			},
		}

		if len(endpoint.Security) > 0 {
			operation["security"] = endpoint.Security
		}

		pathItem[strings.ToLower(endpoint.Method)] = operation
		paths[endpoint.Path] = pathItem
	}

	return paths
}
