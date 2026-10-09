variable "account_id" {
  description = "Cloudflare account ID, supplied through TF_VAR_account_id."
  type        = string
}

variable "environment" {
  description = "Deployment environment."
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be staging or production."
  }
}

variable "d1_name" {
  description = "D1 database name for this environment."
  type        = string

  validation {
    condition     = endswith(var.d1_name, "-${var.environment}")
    error_message = "D1 database name must end with the selected environment."
  }
}

variable "r2_bucket_name" {
  description = "Application R2 bucket name, not the state bucket."
  type        = string

  validation {
    condition     = endswith(var.r2_bucket_name, "-${var.environment}")
    error_message = "R2 bucket name must end with the selected environment."
  }
}

variable "primary_location_hint" {
  description = "Optional D1 creation location hint; leave null when importing."
  type        = string
  default     = null
}

variable "r2_location" {
  description = "Optional R2 creation location hint; leave null when importing."
  type        = string
  default     = null
}
