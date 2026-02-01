package handlers

import (
	"net/http"

	"github.com/gaulatti/mattone/db"
	"github.com/gaulatti/mattone/models"
	"github.com/gaulatti/mattone/services"
	"github.com/google/uuid"
	"github.com/labstack/echo/v5"
)

type DeviceHandler struct {
	sseService *services.SSEService
}

func NewDeviceHandler(sseService *services.SSEService) *DeviceHandler {
	return &DeviceHandler{
		sseService: sseService,
	}
}

type RegisterDeviceRequest struct {
	DeviceCode string `json:"device_code" validate:"required"`
}

type PlayCommandRequest struct {
	Type    string `json:"type" validate:"required"`
	URL     string `json:"url"`
	VideoID string `json:"videoId"`
}

// WhoAmI checks if a device is registered
func (h *DeviceHandler) WhoAmI(c echo.Context) error {
	deviceID := c.Request().Header.Get("X-Device-ID")
	if deviceID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "missing X-Device-ID header")
	}

	var device models.Device
	err := db.GetDB().Where("device_code = ?", deviceID).First(&device).Error
	if err != nil {
		return c.NoContent(http.StatusNotFound)
	}

	return c.NoContent(http.StatusNoContent)
}

// RegisterDevice registers a new device for the authenticated user
func (h *DeviceHandler) RegisterDevice(c echo.Context) error {
	user := c.Get("user").(*models.User)

	var req RegisterDeviceRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if req.DeviceCode == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "device_code is required")
	}

	// Check if device already exists for this user
	var existingDevice models.Device
	err := db.GetDB().Where("device_code = ?", req.DeviceCode).First(&existingDevice).Error
	if err == nil {
		if existingDevice.UserID == user.ID {
			return c.JSON(http.StatusOK, existingDevice)
		}
		return echo.NewHTTPError(http.StatusConflict, "device already registered to another user")
	}

	device := models.Device{
		DeviceCode: req.DeviceCode,
		UserID:     user.ID,
	}

	if err := db.GetDB().Create(&device).Error; err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to register device")
	}

	return c.JSON(http.StatusCreated, device)
}

// ListDevices returns all devices for the authenticated user
func (h *DeviceHandler) ListDevices(c echo.Context) error {
	user := c.Get("user").(*models.User)

	var devices []models.Device
	if err := db.GetDB().Where("user_id = ?", user.ID).Find(&devices).Error; err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch devices")
	}

	return c.JSON(http.StatusOK, devices)
}

// DeleteDevice unregisters a device
func (h *DeviceHandler) DeleteDevice(c echo.Context) error {
	user := c.Get("user").(*models.User)
	deviceID := c.PathParam("id")

	deviceUUID, err := uuid.Parse(deviceID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid device ID")
	}

	var device models.Device
	err = db.GetDB().Where("id = ? AND user_id = ?", deviceUUID, user.ID).First(&device).Error
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "device not found")
	}

	if err := db.GetDB().Delete(&device).Error; err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to delete device")
	}

	// Disconnect SSE if connected
	h.sseService.UnregisterConnection(device.DeviceCode)

	return c.NoContent(http.StatusNoContent)
}

// PlayOnDevice sends a play command to a device
func (h *DeviceHandler) PlayOnDevice(c echo.Context) error {
	user := c.Get("user").(*models.User)
	deviceID := c.PathParam("id")

	deviceUUID, err := uuid.Parse(deviceID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid device ID")
	}

	var req PlayCommandRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	// Validate request
	if req.Type == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "type is required")
	}

	var device models.Device
	err = db.GetDB().Where("id = ? AND user_id = ?", deviceUUID, user.ID).First(&device).Error
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "device not found")
	}

	// Build command payload
	payload := make(map[string]interface{})
	if req.Type == "m3u" {
		if req.URL == "" {
			return echo.NewHTTPError(http.StatusBadRequest, "url is required for m3u type")
		}
		payload["url"] = req.URL
	} else if req.Type == "youtube" {
		if req.VideoID == "" {
			return echo.NewHTTPError(http.StatusBadRequest, "videoId is required for youtube type")
		}
		payload["videoId"] = req.VideoID
	} else {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid type")
	}

	// Send SSE command
	cmd := services.SSECommand{
		Type:    "play",
		Payload: payload,
	}

	if err := h.sseService.SendCommand(device.DeviceCode, cmd); err != nil {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "device not connected")
	}

	return c.JSON(http.StatusOK, map[string]string{"status": "command sent"})
}

// StopOnDevice sends a stop command to a device
func (h *DeviceHandler) StopOnDevice(c echo.Context) error {
	user := c.Get("user").(*models.User)
	deviceID := c.PathParam("id")

	deviceUUID, err := uuid.Parse(deviceID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid device ID")
	}

	var device models.Device
	err = db.GetDB().Where("id = ? AND user_id = ?", deviceUUID, user.ID).First(&device).Error
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "device not found")
	}

	// Send SSE command
	cmd := services.SSECommand{
		Type:    "stop",
		Payload: map[string]interface{}{},
	}

	if err := h.sseService.SendCommand(device.DeviceCode, cmd); err != nil {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "device not connected")
	}

	return c.JSON(http.StatusOK, map[string]string{"status": "command sent"})
}
