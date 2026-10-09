bucket = "nolimits-tofu-state"
key    = "staging/terraform.tfstate"
region = "auto"

endpoints = {
  s3 = "https://cd0db0257b50e56cf8b1d020ffbfff0e.r2.cloudflarestorage.com"
}

use_lockfile                = true
use_path_style              = true
skip_credentials_validation = true
skip_region_validation      = true
skip_requesting_account_id  = true
skip_metadata_api_check     = true
skip_s3_checksum            = true
