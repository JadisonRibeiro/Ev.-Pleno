export type Role = 'admin' | 'lider';

/**
 * Aba `Usuarios`: nome | celula | e-mail | senha | permissão
 */
export interface LeaderUser {
  _row: number;
  nome: string;
  celula: string;
  email: string;
  senha: string;     // texto puro (legado) ou bcrypt hash
  role: Role;
}

/**
 * Aba `DADOS` da planilha de células:
 * Foto Perfil | Nome da Celula | Lider | Cor da rede | Status |
 * Cidade | Bairro | Endereço | Latitude | Longitude | Tipo de Celula
 */
export interface Cell {
  _row: number;
  nome: string;
  lider: string;
  cor: string;
  status: string;
  cidade: string;
  bairro: string;
  endereco: string;
  latitude: string;
  longitude: string;
  tipo: string;
  fotoPerfil: string;
}

/**
 * Aba `Respostas ao formulário 1` (Google Forms):
 * Carimbo de data/hora | Nome Completo | Telefone | Data de nascimento |
 * Endereço | Bairro | Abrigo | Batismo nas águas | Encontro com Deus |
 * Escola de Discípulos | Célula | Endereço e Bairro
 */
export interface Member {
  _row: number;
  id: string;                 // derivado do número da linha (não há coluna ID)
  dataCadastro: string;       // Carimbo de data/hora
  nome: string;
  telefone: string;
  dataNascimento: string;
  endereco: string;
  bairro: string;
  abrigo: string;
  batismo: string;
  encontroDeus: string;
  escolaDiscipulos: string;
  celula: string;
  enderecoBairro: string;
}

export interface AuthPayload {
  sub: string;
  nome: string;
  role: Role;
  celula: string;
}

/** Colunas canônicas da aba `Usuarios` (com acento/hífen). */
export const USER_COLUMNS = {
  nome: 'nome',
  celula: 'celula',
  email: 'e-mail',
  senha: 'senha',
  permissao: 'permissão',
} as const;

/** Colunas canônicas da aba `DADOS` (planilha de células). */
export const CELL_COLUMNS = {
  fotoPerfil: 'Foto Perfil',
  nome: 'Nome da Celula',
  lider: 'Lider',
  cor: 'Cor da rede',
  status: 'Status',
  cidade: 'Cidade',
  bairro: 'Bairro',
  endereco: 'Endereço',
  latitude: 'Latitude',
  longitude: 'Longitude',
  tipo: 'Tipo de Celula',
} as const;

/**
 * Colunas do formulário Google Forms de membros. A coluna "Nome Completo"
 * vem com \n (quebra de linha) no final no header do Sheets — preservamos
 * o valor exato porque é o identificador na API.
 */
export const MEMBER_COLUMNS = {
  dataCadastro: 'Carimbo de data/hora',
  nome: 'Nome Completo\n',
  telefone: 'Telefone',
  dataNascimento: 'Data de nascimento',
  endereco: 'Endereço',
  bairro: 'Bairro',
  abrigo: 'Abrigo',
  batismo: 'Batismo nas águas',
  encontroDeus: 'Encontro com Deus',
  escolaDiscipulos: 'Escola de Discípulos ', // trailing space no sheet
  celula: 'Célula',
  enderecoBairro: 'Endereço e Bairro',
} as const;
