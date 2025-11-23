package k8s

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"time"
	"fmt"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// ----------------------- Models -----------------------

type PodHealthCheck struct {
	ID           int    `json:"id"`
	Pod          string `json:"pod"`
	Namespace    string `json:"namespace"`
	Timestamp    string `json:"timestamp"`
	Status       int    `json:"status"`
	Message      string `json:"message"`
}

// ----------------------- DB Fetch -----------------------

func GetPodHealthJSON(db *sql.DB, ns, pod string) (string, error) {
	rows, err := db.Query(`
		SELECT id, pod, namespace, timestamp, status, message
		FROM pod_health_check
		WHERE namespace = ? AND pod = ?
		ORDER BY id DESC
	`, ns, pod)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	var checks []PodHealthCheck
	for rows.Next() {
		var h PodHealthCheck
		if err := rows.Scan(&h.ID, &h.Pod, &h.Namespace, &h.Timestamp, &h.Status, &h.Message); err != nil {
			return "", err
		}
		checks = append(checks, h)
	}

	b, err := json.MarshalIndent(checks, "", "  ")
	if err != nil {
		return "", err
	}

	return string(b), nil
}

// ----------------------- Store Health -----------------------

func StorePodsHealth(db *sql.DB) {
	if err := ClearPodHealthOlderThan(db, 1); err != nil {
		log.Println("Erro ao limpar logs antigos:", err)
	}

	ctx := context.Background()
	clientset, err := createClient()
	if err != nil {
		log.Println("K8s client error:", err)
		return
	}

	pods, err := clientset.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
	if err != nil {
		log.Println("Error listing pods:", err)
		return
	}

	stmt, err := db.Prepare(`
		INSERT INTO pod_health_check (pod, namespace, timestamp, status, message)
		VALUES (?, ?, ?, ?, ?)
	`)
	if err != nil {
		log.Println("DB prepare error:", err)
		return
	}
	defer stmt.Close()

	now := time.Now().Format(time.RFC3339)

	for _, p := range pods.Items {
		status := calcStatus(p)
		msg := statusMessage(p)

		_, err = stmt.Exec(p.Name, p.Namespace, now, status, msg)
		if err != nil {
			log.Println("Insert error:", err)
		}
	}

	log.Printf("Stored %d pod health entries\n", len(pods.Items))
}

// ----------------------- Helpers -----------------------

// calcStatus returns 1 = Ready, 0 = Not ready, Pending, Failed, etc.
func calcStatus(p v1.Pod) int {
	if p.Status.Phase != v1.PodRunning {
		return 0
	}
	for _, cs := range p.Status.ContainerStatuses {
		if !cs.Ready {
			return 0
		}
	}
	return 1
}

func ClearPodHealthOlderThan(db *sql.DB, hours int) error {
	_, err := db.Exec(`
		DELETE FROM pod_health_check 
		WHERE timestamp < datetime('now', ?)
	`, "-"+fmt.Sprintf("%d hours", hours))

	if err != nil {
		return err
	}

	log.Printf("⏳ Removidos registros mais antigos que %d horas\n", hours)
	return nil
}

// statusMessage returns a readable string for UI
func statusMessage(p v1.Pod) string {
	if p.Status.Phase != v1.PodRunning {
		return string(p.Status.Phase) // Pending, Unknown, Failed, etc
	}
	for _, cs := range p.Status.ContainerStatuses {
		if !cs.Ready {
			return "NOT_OK"
		}
	}
	return "OK"
}


// createClient attempts in-cluster, falls back to kubeconfig
func createClient() (*kubernetes.Clientset, error) {
	config, err := rest.InClusterConfig()
	if err == nil {
		return kubernetes.NewForConfig(config)
	}

	kubeconfig := clientcmd.RecommendedHomeFile
	config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return nil, err
	}

	return kubernetes.NewForConfig(config)
}
