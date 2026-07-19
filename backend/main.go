package main

import (
	"context"
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
)

//go:embed all:web/dist
var webFS embed.FS

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	ctx := context.Background()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL не задан")
	}
	appPassword := os.Getenv("APP_PASSWORD")
	if appPassword == "" {
		log.Fatal("APP_PASSWORD не задан")
	}
	secret := os.Getenv("AUTH_SECRET")
	if secret == "" {
		log.Fatal("AUTH_SECRET не задан (случайная строка для подписи токенов)")
	}
	authSecret = []byte(secret)
	port := getenv("PORT", "8080")

	pool = connectDB(ctx, databaseURL)
	defer pool.Close()

	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/login", loginHandler(appPassword))
	mux.HandleFunc("GET /api/today", requireAuth(todayHandler))
	mux.HandleFunc("GET /api/roster", requireAuth(rosterHandler))
	mux.HandleFunc("GET /api/settings", requireAuth(settingsHandler))
	mux.HandleFunc("PUT /api/settings", requireAuth(settingsHandler))
	mux.HandleFunc("GET /api/weights", requireAuth(weightsHandler))
	mux.HandleFunc("POST /api/weights", requireAuth(weightsHandler))
	mux.HandleFunc("GET /api/checklist", requireAuth(checklistHandler))
	mux.HandleFunc("POST /api/checklist", requireAuth(checklistHandler))
	mux.HandleFunc("PATCH /api/checklist/{id}", requireAuth(checklistItemHandler))
	mux.HandleFunc("DELETE /api/checklist/{id}", requireAuth(checklistItemHandler))
	mux.HandleFunc("GET /api/smoking", requireAuth(smokingHandler))
	mux.HandleFunc("POST /api/smoking/start", requireAuth(smokingStartHandler))
	mux.HandleFunc("POST /api/smoking/relapse", requireAuth(smokingRelapseHandler))
	mux.HandleFunc("POST /api/smoking/craving", requireAuth(smokingCravingHandler))
	mux.HandleFunc("PUT /api/smoking/settings", requireAuth(smokingSettingsHandler))

	// Serve the built React app for everything else (SPA).
	distFS, err := fs.Sub(webFS, "web/dist")
	if err != nil {
		log.Fatal(err)
	}
	fileServer := http.FileServer(http.FS(distFS))
	mux.Handle("/", spaHandler(distFS, fileServer))

	log.Printf("fitops запущен на :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}

// spaHandler serves static files, falling back to index.html for client-side routes.
func spaHandler(distFS fs.FS, fileServer http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if path != "/" {
			if _, err := fs.Stat(distFS, path[1:]); err != nil {
				r.URL.Path = "/"
			}
		}
		fileServer.ServeHTTP(w, r)
	}
}
