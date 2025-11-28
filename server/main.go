package main

import (
	"database/sql"
	"encoding/json"
	"io"
	"log"
	"maps"
	"net/http"
	"strings"
	"time"
	"os"
	"crypto/tls"
	"crypto/x509"

	"finituz.com/k8s_viewer/internal/db"
	"finituz.com/k8s_viewer/internal/k8s"
	"finituz.com/k8s_viewer/internal/migrations"
)

type HealthResponse struct {
	Status     string `json:"status"`
	StatusCode int    `json:"statusCode"`
	Message    string `json:"message"`
}

var kube_token = func() string {
	data, err := os.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/token")
	if err != nil {
		log.Fatalf("❌ Cannot read Kubernetes token: %v", err)
	}
	return strings.TrimSpace(string(data))
}()

var kube_client = func() *http.Client {
	caCert, err := os.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/ca.crt")
	if err != nil {
		log.Fatalf("❌ Cannot read Kubernetes CA: %v", err)
	}

	caPool := x509.NewCertPool()
	caPool.AppendCertsFromPEM(caCert)

	tlsConfig := &tls.Config{
		RootCAs: caPool,
	}

	transport := &http.Transport{
		TLSClientConfig: tlsConfig,
	}

	return &http.Client{Transport: transport}
}()


func proxyHandler(base_url string, proxy_path string) http.HandlerFunc {
	log.Println("✅ Proxy path set", proxy_path)

	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		url := base_url + strings.Replace(r.URL.Path, proxy_path, "/", 1) + "?" + r.URL.RawQuery

		log.Println("-> Request to endpoint:", url)
		req, _ := http.NewRequest(r.Method, url, r.Body)
		req.Header = r.Header

		req.Header.Set("Authorization", "Bearer "+kube_token)

		resp, err := kube_client.Do(req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		maps.Copy(w.Header(), resp.Header)

		w.WriteHeader(resp.StatusCode)
		io.Copy(w, resp.Body)
	}
}

func configHandler(_db *sql.DB) http.HandlerFunc {
	log.Println("✅ Config path set /v1/config")

	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		jsonStr, err := db.GetConfigsJSON(_db)
		if err != nil {
			http.Error(w, "Failed to get configs", http.StatusInternalServerError)
			log.Println("Error fetching configs:", err)
			return
		} else {
			log.Println("✅ Config fetched by", r.RemoteAddr)
		}

		w.Write([]byte(jsonStr))
	}
}

func healthCheckHandler(_db *sql.DB, base_url string) http.HandlerFunc {
	log.Println("✅ Health Check path set /v1/health")
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		client := http.Client{Timeout: 3 * time.Second}

		if err := _db.Ping(); err != nil {
			w.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(w).Encode(HealthResponse{
				Status:     "unhealthy",
				StatusCode: http.StatusServiceUnavailable,
				Message:    "Database error: " + err.Error(),
			})
			return
		}

		resp, err := client.Get(base_url + "/readyz")
		if err != nil || resp.StatusCode != http.StatusOK {
			if resp != nil {
				resp.Body.Close()
			}
			w.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(w).Encode(HealthResponse{
				Status:     "unhealthy",
				StatusCode: http.StatusServiceUnavailable,
				Message:    "K8S API error: " + err.Error(),
			})
			return
		}
		if resp != nil {
			resp.Body.Close()
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(HealthResponse{
			Status:     "healthy",
			StatusCode: http.StatusOK,
			Message:    "database and K8S API are alive",
		})
	}
}


func healthByNodeHandler(_db *sql.DB) http.HandlerFunc {
	log.Println("✅ Node Health Check path set /proxy/v1/node")

	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		node := r.URL.Query().Get("node")

		// Validate input
		if node == "" {
			http.Error(w, `{"error":"query param required: ?node=<node-name>"}`, http.StatusBadRequest)
			log.Println("❌ Missing node parameter")
			return
		}

		jsonStr, err := k8s.GetNodeHealthJSONByName(_db, node)
		if err != nil {
			http.Error(w, `{"error":"Failed to fetch node health"}`, http.StatusInternalServerError)
			log.Println("❌ DB Error:", err)
			return
		}

		log.Printf("📤 Node health fetched: node=%s by %s\n", node, r.RemoteAddr)
		w.Write([]byte(jsonStr))
	}
}


func healthByPodHandler(_db *sql.DB) http.HandlerFunc {
	log.Println("✅ Health pod Check path set /proxy/v1/pod")

	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		ns := r.URL.Query().Get("namespace")
		pod := r.URL.Query().Get("pod")

		// Validate input
		if ns == "" || pod == "" {
			http.Error(w, `{"error":"query params required: ?namespace=xxx&pod=yyy"}`, http.StatusBadRequest)
			log.Println("❌ Missing namespace or pod parameter")
			return
		}

		jsonStr, err := k8s.GetPodHealthJSON(_db, ns, pod)
		if err != nil {
			http.Error(w, `{"error":"Failed to fetch health"}`, http.StatusInternalServerError)
			log.Println("❌ DB Error:", err)
			return
		}

		log.Printf("📤 Health fetched: pod=%s namespace=%s by %s\n", pod, ns, r.RemoteAddr)
		w.Write([]byte(jsonStr))
	}
}


func main() {
	DB_PORT := ":8080"
	versioning := "/proxy/v1/"
	BASE_URL := "https://kubernetes.default.svc"

	database, err := db.OpenSqliteConn("./k8s.db")
	if err != nil {
		log.Fatal(err)
	}

	migrations.Run(database)

	http.HandleFunc(versioning, proxyHandler(BASE_URL, versioning))
	http.HandleFunc(versioning+"health", healthCheckHandler(database, BASE_URL))
	http.HandleFunc(versioning+"config", configHandler(database))
	http.HandleFunc(versioning+"pod", healthByPodHandler(database))
	http.HandleFunc(versioning+"node", healthByNodeHandler(database))

	log.Printf("✅ Proxy running on port %s", DB_PORT)
	go func() {
			if err := http.ListenAndServe(DB_PORT, nil); err != nil {
					log.Fatalf("❌ server error: %v", err)
			}
	}()

	for {
		k8s.StorePodsHealth(database)
		k8s.StoreNodesHealth(database)
		time.Sleep(30 * time.Second) 
	}

}
