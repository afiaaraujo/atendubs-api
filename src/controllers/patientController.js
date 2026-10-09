import { prisma } from '../lib/prisma.js';
import { createPatientSchema, callPatientSchema } from '../schemas/patientSchema.js';
import { z } from 'zod';

export const PatientController = {
  // Tarefa 3: Rota POST /pacientes (Cadastrar na fila)
  async create(req, res) {
    try {
      const { nome, cpf, prioridade } = createPatientSchema.parse(req.body);

      const isPreferencial = prioridade === 'PREFERENCIAL';
      const tipoPrioridade = isPreferencial ? 'PREFERENCIAL' : 'GERAL';
      const prefixo = isPreferencial ? 'P' : 'G';

      const inicioHoje = new Date();
      inicioHoje.setHours(0, 0, 0, 0);

      const totalHoje = await prisma.patient.count({
        where: {
          prioridade: tipoPrioridade,
          criadoEm: { gte: inicioHoje }
        }
      });

      const numeroSequencial = String(totalHoje + 1).padStart(3, '0');
      const senhaGerada = `${prefixo}-${numeroSequencial}`;

      const novoPaciente = await prisma.patient.create({
        data: {
          nome,
          cpf,
          prioridade: tipoPrioridade,
          senha: senhaGerada,
          status: 'AGUARDANDO'
        }
      });

      const io = req.app.get('io');
      if (io) io.emit('novaSenha', novoPaciente);

      return res.status(201).json(novoPaciente);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos.',
          detalhes: error.errors.map((err) => err.message)
        });
      }

      console.error('Erro ao cadastrar paciente:', error);
      return res.status(500).json({ error: 'Erro interno ao cadastrar paciente.' });
    }
  },

  // Tarefa 4: Rota GET /pacientes (Listar fila de espera)
  async listWaiting(req, res) {
    try {
      const fila = await prisma.patient.findMany({
        where: { status: 'AGUARDANDO' },
        orderBy: [
          { prioridade: 'desc' }, // PREFERENCIAL primeiro
          { criadoEm: 'asc' }    // Mais antigos primeiro
        ]
      });

      return res.json(fila);
    } catch (error) {
      console.error('Erro ao buscar fila:', error);
      return res.status(500).json({ error: 'Erro interno ao buscar fila.' });
    }
  },

  // Tarefa 6: Rota PUT /pacientes/:id/chamar (Chamar paciente)
  async callNext(req, res) {
    try {
      const { id } = req.params;
      const { consultorio } = callPatientSchema.parse(req.body || {});

      const pacienteAtualizado = await prisma.patient.update({
        where: { id: String(id) },
        data: {
          status: 'EM_ATENDIMENTO',
          consultorio
        }
      });

      const io = req.app.get('io');
      if (io) io.emit('chamarPaciente', pacienteAtualizado);

      return res.json(pacienteAtualizado);
    } catch (error) {
      console.error('Erro ao chamar paciente:', error);
      return res.status(500).json({ error: 'Erro ao chamar paciente.' });
    }
  },

  // Tarefa 7: Rota PUT /pacientes/:id/finalizar (Finalizar atendimento)
  async finish(req, res) {
    try {
      const { id } = req.params;

      const pacienteFinalizado = await prisma.patient.update({
        where: { id: String(id) },
        data: { status: 'ATENDIDO' }
      });

      const io = req.app.get('io');
      if (io) io.emit('atendimentoFinalizado', pacienteFinalizado);

      return res.json(pacienteFinalizado);
    } catch (error) {
      console.error('Erro ao finalizar atendimento:', error);
      return res.status(500).json({ error: 'Erro ao finalizar atendimento.' });
    }
  },

  // Tarefa 8: Rota GET /relatorios (Métricas do sistema)
  async reports(req, res) {
    try {
      const totalAtendidos = await prisma.patient.count({ where: { status: 'ATENDIDO' } });
      const totalAguardando = await prisma.patient.count({ where: { status: 'AGUARDANDO' } });
      const totalEmAtendimento = await prisma.patient.count({ where: { status: 'EM_ATENDIMENTO' } });

      return res.json({
        totalAtendidos,
        totalAguardando,
        totalEmAtendimento,
        totalGeral: totalAtendidos + totalAguardando + totalEmAtendimento
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      return res.status(500).json({ error: 'Erro interno ao gerar relatório.' });
    }
  }
};
