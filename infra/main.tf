provider "cloudflare" {}

resource "cloudflare_d1_database" "app" {
  account_id            = var.account_id
  name                  = var.d1_name
  primary_location_hint = var.primary_location_hint

  # Replacing persistent resources would discard application data.
  lifecycle {
    prevent_destroy = true
  }
}

resource "cloudflare_r2_bucket" "app" {
  account_id = var.account_id
  name       = var.r2_bucket_name
  location   = var.r2_location

  lifecycle {
    prevent_destroy = true
  }
}
