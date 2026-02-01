package services

import (
	"bufio"
	"fmt"
	"regexp"
	"strings"

	"github.com/gaulatti/mattone/models"
)

var (
	extinfRegex = regexp.MustCompile(`^#EXTINF:-?\d+\s*(.*)$`)
	tvgNameRegex = regexp.MustCompile(`tvg-name="([^"]*)"`)
	tvgLogoRegex = regexp.MustCompile(`tvg-logo="([^"]*)"`)
	groupTitleRegex = regexp.MustCompile(`group-title="([^"]*)"`)
)

type M3UParser struct{}

func NewM3UParser() *M3UParser {
	return &M3UParser{}
}

// ParseM3U parses m3u content and returns a slice of Channel structs
func (p *M3UParser) ParseM3U(content, sourceURL string) ([]models.Channel, error) {
	var channels []models.Channel
	scanner := bufio.NewScanner(strings.NewReader(content))
	
	var currentChannel *models.Channel
	
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		
		// Skip empty lines and m3u header
		if line == "" || line == "#EXTM3U" {
			continue
		}
		
		// Check if this is an EXTINF line
		if strings.HasPrefix(line, "#EXTINF:") {
			currentChannel = &models.Channel{
				SourceURL: sourceURL,
			}
			
			// Extract attributes from EXTINF line
			if matches := extinfRegex.FindStringSubmatch(line); len(matches) > 1 {
				attrs := matches[1]
				
				// Extract tvg-name
				if match := tvgNameRegex.FindStringSubmatch(attrs); len(match) > 1 {
					currentChannel.TvgName = match[1]
				}
				
				// Extract tvg-logo
				if match := tvgLogoRegex.FindStringSubmatch(attrs); len(match) > 1 {
					currentChannel.TvgLogo = match[1]
				}
				
				// Extract group-title
				if match := groupTitleRegex.FindStringSubmatch(attrs); len(match) > 1 {
					currentChannel.GroupTitle = match[1]
				}
				
				// If tvg-name is empty, try to extract from the channel name (after last comma)
				if currentChannel.TvgName == "" {
					parts := strings.Split(attrs, ",")
					if len(parts) > 0 {
						currentChannel.TvgName = strings.TrimSpace(parts[len(parts)-1])
					}
				}
			}
		} else if currentChannel != nil && !strings.HasPrefix(line, "#") {
			// This is the stream URL line
			currentChannel.StreamURL = line
			
			// Only add if we have a valid stream URL
			if currentChannel.StreamURL != "" {
				channels = append(channels, *currentChannel)
			}
			
			currentChannel = nil
		}
	}
	
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error scanning m3u content: %w", err)
	}
	
	return channels, nil
}
