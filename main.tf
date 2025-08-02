terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "6.8.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "5.35.0"
    }
  }
  backend "gcs" {
    bucket = "violet-kanban-terraform-state"
    prefix = "terraform/state"
  }
  required_version = ">= 1.0"
}


variable "GOOGLE_PROJECT_ID" {
  description = "The Google Cloud project ID"
  type        = string
}

variable "GOOGLE_REGION" {
  description = "The Google Cloud region"
  type        = string
}

variable "GOOGLE_ZONE" {
  description = "The Google Cloud zone"
  type        = string
}

variable "environment" {
  description = "The deployment environment"
  type        = string
  default     = "dev"
}

provider "google" {
  project = var.GOOGLE_PROJECT_ID
  region  = var.GOOGLE_REGION
  zone    = var.GOOGLE_ZONE
}

# Enable required APIs
resource "google_project_service" "firestore" {
  provider = google-beta
  project  = var.GOOGLE_PROJECT_ID
  service  = "firestore.googleapis.com"
}

resource "google_project_service" "firebase" {
  provider = google-beta
  project  = var.GOOGLE_PROJECT_ID
  service  = "firebase.googleapis.com"
}

# Create Firestore database
resource "google_firestore_database" "database" {
  provider    = google-beta
  project     = var.GOOGLE_PROJECT_ID
  name        = "(default)"
  location_id = var.GOOGLE_REGION
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.firestore]
}

# Create Firebase project
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.GOOGLE_PROJECT_ID

  depends_on = [google_project_service.firebase]
}