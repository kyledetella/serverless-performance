package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
)

type Event struct {
	Foo string `json:"foo"`
}

type Result struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

func Handler(event Event) (Result, error) {
	eventJson, _ := json.MarshalIndent(event, "", "  ")
	log.Printf("Event: %s", eventJson)

	now := int64(time.Nanosecond) * time.Now().UnixNano() / int64(time.Millisecond)

	return Result{Status: "ok", Message: fmt.Sprintf("Completed at %d", now)}, nil
}

func main() {
	lambda.Start(Handler)
}
