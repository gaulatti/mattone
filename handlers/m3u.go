package handlers

import (
	"fmt"
	"io"
	"net/http"

	"github.com/gaulatti/mattone/db"
	"github.com/gaulatti/mattone/models"
	"github.com/gaulatti/mattone/services"
	"github.com/labstack/echo/v5"
)

type M3UHandler struct {
	parser *services.M3UParser
}

func NewM3UHandler() *M3UHandler {
	return &M3UHandler{
		parser: services.NewM3UParser(),
	}
}

type ImportM3URequest struct {
	URL string `json:"url" validate:"required"`
}

type ImportM3UResponse struct {
	ImportedCount int    `json:"imported_count"`
	SourceURL     string `json:"source_url"`
}

// ImportM3U fetches and imports channels from an m3u URL
func (h *M3UHandler) ImportM3U(c echo.Context) error {
	var req ImportM3URequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if req.URL == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "url is required")
	}

	// Fetch m3u content
	resp, err := http.Get(req.URL)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("failed to fetch m3u: %v", err))
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("failed to fetch m3u: status %d", resp.StatusCode))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to read m3u content")
	}

	// Parse m3u content
	channels, err := h.parser.ParseM3U(string(body), req.URL)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("failed to parse m3u: %v", err))
	}

	if len(channels) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "no valid channels found in m3u")
	}

	// Delete existing channels from this source
	if err := db.GetDB().Where("source_url = ?", req.URL).Delete(&models.Channel{}).Error; err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to clear existing channels")
	}

	// Insert new channels
	if err := db.GetDB().Create(&channels).Error; err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to save channels")
	}

	return c.JSON(http.StatusOK, ImportM3UResponse{
		ImportedCount: len(channels),
		SourceURL:     req.URL,
	})
}
