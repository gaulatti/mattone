package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gaulatti/mattone/db"
	"github.com/gaulatti/mattone/models"
	"github.com/gaulatti/mattone/services"
	"github.com/labstack/echo/v5"
)

type SSEHandler struct {
	sseService *services.SSEService
}

func NewSSEHandler(sseService *services.SSEService) *SSEHandler {
	return &SSEHandler{
		sseService: sseService,
	}
}

// HandleSSE establishes an SSE connection for a device
func (h *SSEHandler) HandleSSE(c echo.Context) error {
	deviceCode := c.Request().Header.Get("X-Device-ID")
	if deviceCode == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "missing X-Device-ID header")
	}

	// Verify device exists in database
	var device models.Device
	if err := db.GetDB().Where("device_code = ?", deviceCode).First(&device).Error; err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "device not found")
	}

	// Set SSE headers
	w := c.Response()
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Register connection
	h.sseService.RegisterConnection(deviceCode, w)
	defer h.sseService.UnregisterConnection(deviceCode)

	// Send initial connection message
	fmt.Fprintf(w, "data: {\"type\":\"connected\"}\n\n")
	w.Flush()

	// Keep connection alive with heartbeat
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	// Wait for client disconnect or context cancellation
	ctx := c.Request().Context()
	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			// Send heartbeat
			fmt.Fprintf(w, ":heartbeat\n\n")
			w.Flush()
		}
	}
}
