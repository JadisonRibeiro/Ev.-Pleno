import bcrypt from 'bcryptjs';

const BCRYPT_PREFIX = /^\$2[aby]\$\d{2}\$/;

/** Detecta se o valor na planilha já é um hash bcrypt. */
export function isHashed(stored: string): boolean {
  return BCRYPT_PREFIX.test(stored.trim());
}

/**
 * Valida uma senha contra o valor armazenado (hash ou texto puro).
 * Se o armazenado for texto puro, comparação é byte-a-byte (aceita
 * plaintext legado da planilha até a primeira migração).
 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const storedTrim = stored.trim();
  if (isHashed(storedTrim)) {
    return bcrypt.compare(plain, storedTrim);
  }
  return plain === storedTrim;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
