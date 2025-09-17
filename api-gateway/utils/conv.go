package utils

// ToString returns the value if it's a string, otherwise empty string.
func ToString(v any) string {
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}
