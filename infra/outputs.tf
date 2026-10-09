output "d1_id" {
  description = "Wrangler database_id for the DB binding."
  value       = cloudflare_d1_database.app.id
}

output "d1_name" {
  description = "Wrangler database_name for the DB binding."
  value       = cloudflare_d1_database.app.name
}

output "r2_bucket_name" {
  description = "Wrangler bucket_name for the BUCKET binding."
  value       = cloudflare_r2_bucket.app.name
}
