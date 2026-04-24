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
