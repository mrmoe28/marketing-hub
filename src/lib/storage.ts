import { put } from "@vercel/blob";

export interface StorageProvider {
  getClientPrefix(clientId: string): string;
  getSignedUploadUrl(params: {
    clientId: string;
    filename: string;
  }): Promise<{ uploadUrl: string; publicUrl: string }>;
  listFiles(prefix: string): Promise<string[]>;
}

class VercelBlobStorage implements StorageProvider {
  getClientPrefix(clientId: string): string {
    return `clients/${clientId}/`;
  }

  async getSignedUploadUrl(params: { clientId: string; filename: string }) {
    const { clientId, filename } = params;
    const pathname = `${this.getClientPrefix(clientId)}${filename}`;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN not configured");
    }

    const blob = await put(pathname, new Blob([]), {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return {
      uploadUrl: blob.url,
      publicUrl: blob.url,
    };
  }

  async listFiles(prefix: string): Promise<string[]> {
    return [];
  }
}

class S3Storage implements StorageProvider {
  getClientPrefix(clientId: string): string {
    return `clients/${clientId}/`;
  }

  async getSignedUploadUrl(params: { clientId: string; filename: string }): Promise<{ uploadUrl: string; publicUrl: string }> {
    throw new Error("S3 storage not implemented yet");
  }

  async listFiles(prefix: string): Promise<string[]> {
    throw new Error("S3 storage not implemented yet");
  }
}

class SupabaseStorage implements StorageProvider {
  getClientPrefix(clientId: string): string {
    return `clients/${clientId}/`;
  }

  async getSignedUploadUrl(params: { clientId: string; filename: string }): Promise<{ uploadUrl: string; publicUrl: string }> {
    throw new Error("Supabase storage not implemented yet");
  }

  async listFiles(prefix: string): Promise<string[]> {
    throw new Error("Supabase storage not implemented yet");
  }
}

function getStorageProvider(): StorageProvider {
  const driver = process.env.STORAGE_DRIVER || "vercel-blob";

  switch (driver) {
    case "vercel-blob":
      return new VercelBlobStorage();
    case "s3":
      return new S3Storage();
    case "supabase":
      return new SupabaseStorage();
    default:
      throw new Error(`Unknown storage driver: ${driver}`);
  }
}

export const storage = getStorageProvider();
