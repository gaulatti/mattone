package middleware

import (
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gaulatti/mattone/config"
	"github.com/gaulatti/mattone/db"
	"github.com/gaulatti/mattone/models"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v5"
	"gorm.io/gorm"
)

type JWKS struct {
	Keys []JWK `json:"keys"`
}

type JWK struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	Alg string `json:"alg"`
	Use string `json:"use"`
	N   string `json:"n"`
	E   string `json:"e"`
}

type JWTValidator struct {
	config    *config.CognitoConfig
	jwks      *JWKS
	jwksMutex sync.RWMutex
	lastFetch time.Time
}

func NewJWTValidator(cfg *config.CognitoConfig) *JWTValidator {
	return &JWTValidator{
		config: cfg,
	}
}

func (v *JWTValidator) fetchJWKS() error {
	v.jwksMutex.Lock()
	defer v.jwksMutex.Unlock()

	// Refresh only if older than 1 hour
	if time.Since(v.lastFetch) < time.Hour && v.jwks != nil {
		return nil
	}

	resp, err := http.Get(v.config.GetJWKSURL())
	if err != nil {
		return fmt.Errorf("failed to fetch JWKS: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read JWKS response: %w", err)
	}

	var jwks JWKS
	if err := json.Unmarshal(body, &jwks); err != nil {
		return fmt.Errorf("failed to parse JWKS: %w", err)
	}

	v.jwks = &jwks
	v.lastFetch = time.Now()
	return nil
}

func (v *JWTValidator) getPublicKey(token *jwt.Token) (interface{}, error) {
	// Ensure JWKS is fetched
	if err := v.fetchJWKS(); err != nil {
		return nil, err
	}

	kid, ok := token.Header["kid"].(string)
	if !ok {
		return nil, errors.New("kid not found in token header")
	}

	v.jwksMutex.RLock()
	defer v.jwksMutex.RUnlock()

	for _, key := range v.jwks.Keys {
		if key.Kid == kid {
			return v.jwkToRSAPublicKey(&key)
		}
	}

	return nil, fmt.Errorf("unable to find key with kid: %s", kid)
}

func (v *JWTValidator) jwkToRSAPublicKey(jwk *JWK) (*rsa.PublicKey, error) {
	nBytes, err := base64.RawURLEncoding.DecodeString(jwk.N)
	if err != nil {
		return nil, err
	}

	eBytes, err := base64.RawURLEncoding.DecodeString(jwk.E)
	if err != nil {
		return nil, err
	}

	n := new(big.Int).SetBytes(nBytes)
	e := new(big.Int).SetBytes(eBytes)

	return &rsa.PublicKey{
		N: n,
		E: int(e.Int64()),
	}, nil
}

func (v *JWTValidator) Middleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "missing authorization header")
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid authorization header format")
			}

			tokenString := parts[1]

			token, err := jwt.Parse(tokenString, v.getPublicKey)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, fmt.Sprintf("invalid token: %v", err))
			}

			if !token.Valid {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token claims")
			}

			// Validate issuer
			iss, ok := claims["iss"].(string)
			if !ok || iss != v.config.GetIssuer() {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid issuer")
			}

			// Validate client_id or aud
			clientID, hasClientID := claims["client_id"].(string)
			aud, hasAud := claims["aud"].(string)
			if (!hasClientID || clientID != v.config.ClientID) && (!hasAud || aud != v.config.ClientID) {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid audience")
			}

			// Extract sub claim
			sub, ok := claims["sub"].(string)
			if !ok || sub == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "missing sub claim")
			}

			// Find or create user
			user, err := v.findOrCreateUser(sub)
			if err != nil {
				return echo.NewHTTPError(http.StatusInternalServerError, "failed to get user")
			}

			// Store user in context
			c.Set("user", user)

			return next(c)
		}
	}
}

func (v *JWTValidator) findOrCreateUser(cognitoSub string) (*models.User, error) {
	var user models.User
	
	err := db.GetDB().Where("cognito_sub = ?", cognitoSub).First(&user).Error
	if err == nil {
		return &user, nil
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Create new user
	user = models.User{
		CognitoSub: cognitoSub,
	}

	if err := db.GetDB().Create(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}
