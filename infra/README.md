# Cloudflare infrastructure

OpenTofu manages one D1 database and one application R2 bucket per environment.
Workers, bindings, email, cron triggers, secrets, and migrations remain in Wrangler.

| Environment | D1                     | R2                     | State key                    |
| ----------- | ---------------------- | ---------------------- | ---------------------------- |
| staging     | nolimits-d1-staging    | nolimits-r2-staging    | staging/terraform.tfstate    |
| production  | nolimits-d1-production | nolimits-r2-production | production/terraform.tfstate |

Use OpenTofu 1.10+ for these backends: native S3 lockfiles were added in 1.10.
The module's language minimum is 1.9. Commit `.terraform.lock.hcl` when updating
providers; never commit credentials, state, or `.terraform/`.

## Bootstrap state once

1. Create the private R2 bucket `nolimits-tofu-state` in the Cloudflare dashboard.
   Keep it outside this module to avoid the backend bootstrap dependency. Do not
   enable public access or lifecycle deletion of state objects.
2. Create R2 S3 API credentials with **Object Read & Write**, scoped only to that
   bucket. They must list/read/write/delete both state and `.tflock` objects.
3. Confirm the account ID in both `environments/*.backend.hcl` endpoints matches
   `CLOUDFLARE_ACCOUNT_ID`; update the endpoints if using another account.

`use_lockfile = true` relies on R2 conditional `PutObject` (`If-None-Match`).
Verify lock contention against the real bucket before concurrent use. Do not
disable locking to work around errors. R2 does not provide S3 bucket versioning;
keep private state backups before infrastructure changes.

## Credentials

Supply these through your shell or secret store, not `.tfvars` or backend files:

```sh
export CLOUDFLARE_API_TOKEN='<Cloudflare API token>'
export CLOUDFLARE_ACCOUNT_ID='<Cloudflare account ID>'
export TF_VAR_account_id="$CLOUDFLARE_ACCOUNT_ID"
export AWS_ACCESS_KEY_ID='<R2 state access key ID>'
export AWS_SECRET_ACCESS_KEY='<R2 state secret access key>'
```

The Cloudflare token needs account D1 Edit and Workers R2 Storage Edit. Deployment
also needs Workers Scripts Edit. R2 state credentials are separate from that token;
the deploy workflow does not run OpenTofu and does not need them.

Set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the GitHub `staging` and
`production` environments (or repository secrets). Configure production approval
rules. Provision Worker runtime secrets separately for each Wrangler environment.

## Import existing staging resources

Run from `infra/`, using the default workspace:

```sh
tofu init -reconfigure -backend-config=environments/staging.backend.hcl
tofu import -var-file=environments/staging.tfvars cloudflare_d1_database.app \
  "$CLOUDFLARE_ACCOUNT_ID/dfbcb92f-3dc5-45e3-ba81-4067ce11cc32"
tofu import -var-file=environments/staging.tfvars cloudflare_r2_bucket.app \
  "$CLOUDFLARE_ACCOUNT_ID/nolimits-r2-staging/default"
tofu plan -var-file=environments/staging.tfvars
```

Import before applying staging; do not recreate existing resources. Review any
changes after import, particularly location hints. Both resources prevent destruction.

## Plan and apply

Run from `infra/`. Always pair the backend and variable file for the same environment:

```sh
ENV=staging # Use production to create the separate production resources.
tofu init -reconfigure -backend-config="environments/$ENV.backend.hcl"
tofu plan -var-file="environments/$ENV.tfvars"
tofu apply -var-file="environments/$ENV.tfvars"
tofu output -json
```

Use `-reconfigure`, not `-migrate-state`, when switching environments. Do not use
workspaces or copy staging state into production. Backend selection persists locally;
reinitialize before every environment switch.

## Wire Wrangler and deploy

After applying, copy `tofu output -json` values into `app/wrangler.jsonc`:

| Output                 | Selected `env.staging` or `env.production` field |
| ---------------------- | ------------------------------------------------ |
| `d1_id.value`          | `d1_databases[0].database_id`                    |
| `d1_name.value`        | `d1_databases[0].database_name`                  |
| `r2_bucket_name.value` | `r2_buckets[0].bucket_name`                      |

Replace `TODO_TOFU_OUTPUT_production` before deploying production. Keep the top-level
staging bindings synchronized if staging outputs change. Staging keeps the existing
Worker name `nolimitsfordeafchildren`; production uses `nolimitsfordeafchildren-production`.

From the repository root:

```sh
CLOUDFLARE_ENV=staging pnpm --filter nolimits-app build
pnpm --filter nolimits-app exec wrangler d1 migrations apply DB --env staging --remote
pnpm --filter nolimits-app exec vinext-cloudflare deploy --config dist/server/wrangler.json
```

Substitute `production` in both build and migration commands for production. The Vite
plugin selects and flattens the environment **at build time**. Deploy the generated
config without `--env`; changing `CLOUDFLARE_ENV` only at deployment is too late.

Pushes to `main` deploy staging. Published releases deploy production. Manual dispatch
selects either environment. Production fails before build while its D1 ID is a placeholder.

## Offline checks

```sh
tofu fmt -check -recursive .
tofu init -backend=false
tofu validate
```

These checks do not access Cloudflare or the state bucket; initialization downloads
the provider. Remote import, plan, apply, and lock verification require credentials.
