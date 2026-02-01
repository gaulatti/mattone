package handlers

import (
	"net/http"

	"github.com/gaulatti/mattone/db"
	"github.com/gaulatti/mattone/models"
	"github.com/labstack/echo/v5"
)

type ChannelHandler struct{}

func NewChannelHandler() *ChannelHandler {
	return &ChannelHandler{}
}

// ListChannels returns all channels with optional group filter
func (h *ChannelHandler) ListChannels(c echo.Context) error {
	group := c.QueryParam("group")

	query := db.GetDB()
	if group != "" {
		query = query.Where("group_title = ?", group)
	}

	var channels []models.Channel
	if err := query.Order("tvg_name ASC").Find(&channels).Error; err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch channels")
	}

	return c.JSON(http.StatusOK, channels)
}

// ListGroups returns all unique group titles
func (h *ChannelHandler) ListGroups(c echo.Context) error {
	var groups []string
	if err := db.GetDB().Model(&models.Channel{}).
		Distinct("group_title").
		Order("group_title ASC").
		Pluck("group_title", &groups).Error; err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch groups")
	}

	return c.JSON(http.StatusOK, groups)
}
