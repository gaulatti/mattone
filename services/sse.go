package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
)

type SSEService struct {
	connections map[string]http.ResponseWriter
	mutex       sync.RWMutex
}

type SSECommand struct {
	Type    string                 `json:"type"`
	Payload map[string]interface{} `json:"payload"`
}

func NewSSEService() *SSEService {
	return &SSEService{
		connections: make(map[string]http.ResponseWriter),
	}
}

// RegisterConnection adds a device connection to the SSE service
func (s *SSEService) RegisterConnection(deviceCode string, w http.ResponseWriter) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	s.connections[deviceCode] = w
}

// UnregisterConnection removes a device connection from the SSE service
func (s *SSEService) UnregisterConnection(deviceCode string) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	delete(s.connections, deviceCode)
}

// SendCommand sends an SSE event to a specific device
func (s *SSEService) SendCommand(deviceCode string, cmd SSECommand) error {
	s.mutex.RLock()
	w, exists := s.connections[deviceCode]
	s.mutex.RUnlock()

	if !exists {
		return fmt.Errorf("device not connected: %s", deviceCode)
	}

	// Marshal command to JSON
	data, err := json.Marshal(cmd)
	if err != nil {
		return fmt.Errorf("failed to marshal command: %w", err)
	}

	// Write SSE event
	flusher, ok := w.(http.Flusher)
	if !ok {
		return fmt.Errorf("streaming not supported")
	}

	fmt.Fprintf(w, "data: %s\n\n", data)
	flusher.Flush()

	return nil
}

// IsDeviceConnected checks if a device is currently connected
func (s *SSEService) IsDeviceConnected(deviceCode string) bool {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	_, exists := s.connections[deviceCode]
	return exists
}

// GetConnectedDevices returns a list of all connected device codes
func (s *SSEService) GetConnectedDevices() []string {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	
	devices := make([]string, 0, len(s.connections))
	for deviceCode := range s.connections {
		devices = append(devices, deviceCode)
	}
	return devices
}
