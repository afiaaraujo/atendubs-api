import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

import patientRoutes from './routes/patientRoutes.js';
import { loginSchema } from './schemas/patientSchema.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

// Configuração do Socket.io para comunicação em tempo real (Painel / TV)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

// Disponibiliza a instância do Socket.io para os controllers via req.app.get('io')
app.set('io', io);

// Middlewares Globais
app.use(cors());
app.use(express.json());

// Tarefa 5 / Segurança: Rota POST /api/login com consulta real no banco e BCrypt
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, senha } = loginSchema.parse(req.body);

    // 1. Busca o usuário real no banco de dados SQLite via Prisma
    const userFound = await prisma.user.findUnique({
      where: { usuario }
    });

    if (!userFound) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    // 2. Compara a senha enviada com o hash seguro armazenado no banco
    const senhaValida = await bcrypt.compare(senha, userFound.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    // 3. Retorna os dados do usuário com sucesso (sem expor a senha)
    return res.json({
      sucesso: true,
      usuario: { 
        nome: userFound.nome, 
        cargo: userFound.cargo,
        consultorio: userFound.consultorio || null 
      },
      token: 'token-simulacao-atendubs'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos.',
        detalhes: error.errors.map((err) => err.message)
      });
    }

    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
});

// Registro dos Módulos de Rotas
app.use('/api', patientRoutes);

// Socket.io - Gerenciamento de conexões dos clientes
io.on('connection', (socket) => {
  console.log('Cliente conectado ao WebSocket:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado do WebSocket:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});