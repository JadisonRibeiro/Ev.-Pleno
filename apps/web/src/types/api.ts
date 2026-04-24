export type Role = 'admin' | 'lider';

export interface AuthUser {
  sub: string;
  nome: string;
  role: Role;
  celula: string;
}

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

export interface Member {
  _row: number;
  id: string;
  dataCadastro: string;
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

export interface AmorDecision {
  _row: number;
  id: string;
  dataCadastro: string;
  nome: string;
  telefone: string;
  endereco: string;
  decisao: string;
  decidiuNo: string;
  jaEmCelula: string;
  responsavel: string;
  dataNascimento: string;
  tipoCelulaInteresse: string;
  bairro: string;
  convidadoPor: string;
  idade: string;
  opcaoCelula: string;
}

export interface AbrigoAluno {
  _row: number;
  id: string;
  nome: string;
  celula: string;
  totalLicoes: number;
  aulasFeitas: string;
  licoesFaltando: number;
  aulasFaltando: string;
  statusConclusao: string;
  progresso: string;
  concluido: boolean;
}

export const ABRIGO_TOTAL_LICOES = 10;
