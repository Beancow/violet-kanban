terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "6.8.0"
    }
  }
}

provider "google" {
  project = process.env.NEXT_PUBLIC_GOOGLE_PROJECT_ID
  region  = process.env.NEXT_PUBLIC_GOOGLE_REGION
  zone    = process.env.NEXT_PUBLIC_GOOGLE_ZONE
}

resource "google_compute_network" "vpc_network" {
  name = "terraform-network"
}
