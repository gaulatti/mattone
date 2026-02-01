package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Database DatabaseConfig
	Cognito  CognitoConfig
	Port     string
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Name     string
}

type CognitoConfig struct {
	Region     string
	UserPoolID string
	ClientID   string
}

func Load() (*Config, error) {
	dbPort, err := strconv.Atoi(getEnvOrDefault("DB_PORT", "5432"))
	if err != nil {
		return nil, fmt.Errorf("invalid DB_PORT: %w", err)
	}

	return &Config{
		Database: DatabaseConfig{
			Host:     getEnvOrDefault("DB_HOST", "localhost"),
			Port:     dbPort,
			User:     getEnvOrDefault("DB_USER", "postgres"),
			Password: os.Getenv("DB_PASS"),
			Name:     getEnvOrDefault("DB_NAME", "mattone"),
		},
		Cognito: CognitoConfig{
			Region:     os.Getenv("COGNITO_REGION"),
			UserPoolID: os.Getenv("COGNITO_USER_POOL_ID"),
			ClientID:   os.Getenv("COGNITO_CLIENT_ID"),
		},
		Port: getEnvOrDefault("PORT", "8080"),
	}, nil
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func (c *CognitoConfig) GetJWKSURL() string {
	return fmt.Sprintf("https://cognito-idp.%s.amazonaws.com/%s/.well-known/jwks.json",
		c.Region, c.UserPoolID)
}

func (c *CognitoConfig) GetIssuer() string {
	return fmt.Sprintf("https://cognito-idp.%s.amazonaws.com/%s",
		c.Region, c.UserPoolID)
}
