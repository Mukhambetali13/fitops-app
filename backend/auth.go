package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"net/http"
	"strconv"
	"strings"
	"time"
)

var authSecret []byte

const tokenTTL = 30 * 24 * time.Hour // 30 days

func signToken(expiry int64) string {
	payload := strconv.FormatInt(expiry, 10)
	mac := hmac.New(sha256.New, authSecret)
	mac.Write([]byte(payload))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return payload + "." + sig
}

func verifyToken(token string) bool {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return false
	}
	expected := signToken(mustParseInt(parts[0]))
	if subtle.ConstantTimeCompare([]byte(expected), []byte(token)) != 1 {
		return false
	}
	exp, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		return false
	}
	return time.Now().Unix() < exp
}

func mustParseInt(s string) int64 {
	v, _ := strconv.ParseInt(s, 10, 64)
	return v
}

func loginHandler(appPassword string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct{ Password string `json:"password"` }
		if err := decodeJSON(r, &body); err != nil {
			writeError(w, http.StatusBadRequest, "неверный запрос")
			return
		}
		if subtle.ConstantTimeCompare([]byte(body.Password), []byte(appPassword)) != 1 {
			writeError(w, http.StatusUnauthorized, "неверный пароль")
			return
		}
		expiry := time.Now().Add(tokenTTL).Unix()
		writeJSON(w, http.StatusOK, map[string]string{"token": signToken(expiry)})
	}
}

func requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		token := strings.TrimPrefix(h, "Bearer ")
		if token == "" || !verifyToken(token) {
			writeError(w, http.StatusUnauthorized, "требуется авторизация")
			return
		}
		next(w, r)
	}
}
