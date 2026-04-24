/**
 * Uso: npx tsx src/scripts/hash-password.ts "minha-senha"
 * Cola o hash resultante na coluna `senha_hash` da aba Usuarios.
 */
import bcrypt from 'bcryptjs';

const senha = process.argv[2];
if (!senha) {
  console.error('Informe a senha como argumento.');
  process.exit(1);
}

const hash = bcrypt.hashSync(senha, 10);
console.log(hash);
