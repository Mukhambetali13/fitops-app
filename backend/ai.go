package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type FoodItem struct {
	Name     string  `json:"name"`
	Grams    int     `json:"grams"`
	Calories int     `json:"calories"`
	Protein  float64 `json:"protein"`
	Fat      float64 `json:"fat"`
	Carbs    float64 `json:"carbs"`
}

type FoodAIResponse struct {
	MealName      string     `json:"meal_name"`
	Items         []FoodItem `json:"items"`
	TotalCalories int        `json:"total_calories"`
	TotalProtein  float64    `json:"total_protein"`
	TotalFat      float64    `json:"total_fat"`
	TotalCarbs    float64    `json:"total_carbs"`
	Notes         string     `json:"notes,omitempty"`
}

const systemPrompt = `Ты — профессиональный диетолог и эксперт по нутрициологии. 
Проанализируй предоставленную фотографию еды и/или текстовое описание на русском языке.
Определи список продуктов, их примерный вес в граммах, калорийность (ккал), белки (г), жиры (г) и углеводы (г).

Верни результат СТРОГО в формате JSON без какого-либо дополнительного текста или markdown-разметки:
{
  "meal_name": "Название приема пищи (например: Обед - Борщ и хлеб)",
  "items": [
    {
      "name": "Название продукта/ингредиента",
      "grams": 250,
      "calories": 210,
      "protein": 8.5,
      "fat": 10.0,
      "carbs": 22.0
    }
  ],
  "total_calories": 210,
  "total_protein": 8.5,
  "total_fat": 10.0,
  "total_carbs": 22.0,
  "notes": "Опциональный комментарий или совет"
}`

func AnalyzeFoodWithAI(ctx context.Context, userText string, imageBase64 string, imageMime string) (*FoodAIResponse, error) {
	groqKey := os.Getenv("GROQ_API_KEY")
	geminiKey := os.Getenv("GEMINI_API_KEY")

	if groqKey != "" {
		return analyzeWithGroq(ctx, groqKey, userText, imageBase64, imageMime)
	}
	if geminiKey != "" {
		return analyzeWithGemini(ctx, geminiKey, userText, imageBase64, imageMime)
	}

	return nil, fmt.Errorf("GROQ_API_KEY или GEMINI_API_KEY не установлен в переменных окружения.")
}

// Keep backward compatibility
func AnalyzeFoodWithGemini(ctx context.Context, userText string, imageBase64 string, imageMime string) (*FoodAIResponse, error) {
	return AnalyzeFoodWithAI(ctx, userText, imageBase64, imageMime)
}

// --- Groq Implementation ---

type groqImageURLPart struct {
	URL string `json:"url"`
}

type groqContentPart struct {
	Type     string            `json:"type"`
	Text     string            `json:"text,omitempty"`
	ImageURL *groqImageURLPart `json:"image_url,omitempty"`
}

type groqMessage struct {
	Role    string            `json:"role"`
	Content []groqContentPart `json:"content"`
}

type groqResponseFormat struct {
	Type string `json:"type"`
}

type groqRequest struct {
	Model          string             `json:"model"`
	Messages       []groqMessage      `json:"messages"`
	ResponseFormat groqResponseFormat `json:"response_format,omitempty"`
	Temperature    float64            `json:"temperature"`
}

type groqResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func analyzeWithGroq(ctx context.Context, apiKey, userText, imageBase64, imageMime string) (*FoodAIResponse, error) {
	model := os.Getenv("GROQ_MODEL")
	if model == "" {
		if imageBase64 != "" {
			model = "qwen/qwen3.6-27b"
		} else {
			model = "llama-3.3-70b-versatile"
		}
	}

	prompt := systemPrompt
	if userText != "" {
		prompt += "\nДополнительный комментарий пользователя: " + userText
	}

	contentParts := []groqContentPart{
		{Type: "text", Text: prompt},
	}

	if imageBase64 != "" {
		if imageMime == "" {
			imageMime = "image/jpeg"
		}
		dataURL := imageBase64
		if !strings.HasPrefix(imageBase64, "data:") {
			dataURL = fmt.Sprintf("data:%s;base64,%s", imageMime, imageBase64)
		}
		contentParts = append(contentParts, groqContentPart{
			Type:     "image_url",
			ImageURL: &groqImageURLPart{URL: dataURL},
		})
	}

	reqBody := groqRequest{
		Model: model,
		Messages: []groqMessage{
			{
				Role:    "user",
				Content: contentParts,
			},
		},
		ResponseFormat: groqResponseFormat{Type: "json_object"},
		Temperature:    0.2,
	}

	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("ошибка запроса Groq: %w", err)
	}

	url := "https://api.groq.com/openai/v1/chat/completions"
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return nil, fmt.Errorf("ошибка HTTP Groq: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("ошибка обращения к Groq API: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("ошибка чтения ответа Groq: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ошибка Groq API (код %d): %s", resp.StatusCode, string(respBytes))
	}

	var gResp groqResponse
	if err := json.Unmarshal(respBytes, &gResp); err != nil {
		return nil, fmt.Errorf("ошибка декодирования ответа Groq: %w", err)
	}

	if len(gResp.Choices) == 0 {
		return nil, fmt.Errorf("Groq отдал пустой ответ")
	}

	responseText := strings.TrimSpace(gResp.Choices[0].Message.Content)
	responseText = strings.TrimPrefix(responseText, "```json")
	responseText = strings.TrimPrefix(responseText, "```")
	responseText = strings.TrimSuffix(responseText, "```")
	responseText = strings.TrimSpace(responseText)

	var result FoodAIResponse
	if err := json.Unmarshal([]byte(responseText), &result); err != nil {
		return nil, fmt.Errorf("ошибка разбора JSON от Groq: %w (ответ: %s)", err, responseText)
	}

	return &result, nil
}

// --- Gemini Implementation ---

type geminiPart struct {
	Text       string            `json:"text,omitempty"`
	InlineData *geminiInlineData `json:"inline_data,omitempty"`
}

type geminiInlineData struct {
	MimeType string `json:"mime_type"`
	Data     string `json:"data"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiGenConfig struct {
	ResponseMimeType string `json:"response_mime_type,omitempty"`
}

type geminiRequest struct {
	Contents         []geminiContent `json:"contents"`
	GenerationConfig geminiGenConfig `json:"generationConfig,omitempty"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func analyzeWithGemini(ctx context.Context, apiKey, userText, imageBase64, imageMime string) (*FoodAIResponse, error) {
	prompt := systemPrompt
	if userText != "" {
		prompt += "\nДополнительный комментарий пользователя: " + userText
	}

	parts := []geminiPart{
		{Text: prompt},
	}

	if imageBase64 != "" {
		if imageMime == "" {
			imageMime = "image/jpeg"
		}
		if idx := strings.Index(imageBase64, ","); idx != -1 {
			imageBase64 = imageBase64[idx+1:]
		}
		parts = append(parts, geminiPart{
			InlineData: &geminiInlineData{
				MimeType: imageMime,
				Data:     imageBase64,
			},
		})
	}

	reqBody := geminiRequest{
		Contents: []geminiContent{
			{Parts: parts},
		},
		GenerationConfig: geminiGenConfig{
			ResponseMimeType: "application/json",
		},
	}

	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("ошибка формирования запроса Gemini: %w", err)
	}

	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return nil, fmt.Errorf("ошибка создания HTTP запроса: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("ошибка при обращении к Gemini API: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("ошибка чтения ответа Gemini: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ошибка Gemini API (код %d): %s", resp.StatusCode, string(respBytes))
	}

	var gResp geminiResponse
	if err := json.Unmarshal(respBytes, &gResp); err != nil {
		return nil, fmt.Errorf("ошибка декодирования ответа Gemini: %w", err)
	}

	if len(gResp.Candidates) == 0 || len(gResp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("Gemini отдал пустой ответ")
	}

	responseText := gResp.Candidates[0].Content.Parts[0].Text
	responseText = strings.TrimPrefix(responseText, "```json")
	responseText = strings.TrimPrefix(responseText, "```")
	responseText = strings.TrimSuffix(responseText, "```")
	responseText = strings.TrimSpace(responseText)

	var result FoodAIResponse
	if err := json.Unmarshal([]byte(responseText), &result); err != nil {
		return nil, fmt.Errorf("ошибка разбора JSON от Gemini: %w (ответ: %s)", err, responseText)
	}

	return &result, nil
}

// ---------- Workout Trainer AI ----------

func AskWorkoutTrainer(ctx context.Context, exerciseName, question string) (string, error) {
	groqKey := os.Getenv("GROQ_API_KEY")
	geminiKey := os.Getenv("GEMINI_API_KEY")

	prompt := fmt.Sprintf(`Ты — профессиональный мастер-тренер по бодибилдингу и физической реабилитации.
Упражнение: "%s"
Вопрос/ситуация пользователя: "%s"

Дай исчерпывающий, профессиональный и понятный ответ на русском языке:
1. Идеальная биомеханика и техника по шагам.
2. Самые опасные ошибки и как их избежать.
3. Советы по подбору веса или модификации упражнения.`, exerciseName, question)

	if groqKey != "" {
		return askGroqText(ctx, groqKey, prompt)
	}
	if geminiKey != "" {
		return askGeminiText(ctx, geminiKey, prompt)
	}

	return "", fmt.Errorf("GROQ_API_KEY или GEMINI_API_KEY не установлен.")
}

func askGroqText(ctx context.Context, apiKey, prompt string) (string, error) {
	model := os.Getenv("GROQ_MODEL")
	if model == "" {
		model = "llama-3.3-70b-versatile"
	}

	reqBody := groqRequest{
		Model: model,
		Messages: []groqMessage{
			{
				Role: "user",
				Content: []groqContentPart{
					{Type: "text", Text: prompt},
				},
			},
		},
		Temperature: 0.3,
	}

	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(jsonBytes))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("ошибка Groq (%d): %s", resp.StatusCode, string(respBytes))
	}

	var gResp groqResponse
	if err := json.Unmarshal(respBytes, &gResp); err != nil {
		return "", err
	}
	if len(gResp.Choices) == 0 {
		return "", fmt.Errorf("пустой ответ")
	}

	return strings.TrimSpace(gResp.Choices[0].Message.Content), nil
}

func askGeminiText(ctx context.Context, apiKey, prompt string) (string, error) {
	reqBody := geminiRequest{
		Contents: []geminiContent{
			{Parts: []geminiPart{{Text: prompt}}},
		},
	}
	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("ошибка Gemini (%d): %s", resp.StatusCode, string(respBytes))
	}

	var gResp geminiResponse
	if err := json.Unmarshal(respBytes, &gResp); err != nil {
		return "", err
	}
	if len(gResp.Candidates) == 0 || len(gResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("пустой ответ")
	}

	return strings.TrimSpace(gResp.Candidates[0].Content.Parts[0].Text), nil
}

