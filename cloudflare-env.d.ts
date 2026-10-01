declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    WEB101_FLAG?: string;
    WEB102_FLAG?: string;
    FORENSICS103_FLAG?: string;
    CRYPTO104_FLAG?: string;
    BUCKET?: R2Bucket;
  }
}
