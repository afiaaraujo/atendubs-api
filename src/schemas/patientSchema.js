import { z } from 'zod';

export const createPatientSchema = z.object({
  nome: z.string({ required_error: 'Nome é obrigatório.' })
    .min(3, 'O nome deve ter no mínimo 3 caracteres.'),
  cpf: z.string({ required_error: 'CPF é obrigatório.' })
    .min(11, 'CPF deve ter pelo menos 11 dígitos.')
    .max(14, 'CPF inválido.'),
  prioridade: z.enum(['GERAL', 'PREFERENCIAL'], {
    invalid_type_error: 'Prioridade deve ser GERAL ou PREFERENCIAL.'
  }).optional().default('GERAL')
});

export const callPatientSchema = z.object({
  consultorio: z.string().optional().default('Consultório 01')
});

// Schema de Login
export const loginSchema = z.object({
  usuario: z.string({ required_error: 'Usuário é obrigatório.' })
    .min(1, 'Usuário não pode estar vazio.'),
  senha: z.string({ required_error: 'Senha é obrigatória.' })
    .min(1, 'Senha não pode estar vazia.')
});