package utils

import (
	"crypto/rand"
	"encoding/hex"
	"time"
)

// GenID returns a random hex string (fallback to timestamp-based if RNG fails)
func GenID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return hex.EncodeToString([]byte(time.Now().Format(time.RFC3339Nano)))
	}
	return hex.EncodeToString(b)
}
