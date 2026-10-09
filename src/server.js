import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';

import patientRoutes from './routes/patientRoutes.js';
import { loginSchema } from './schemas/patientSchema.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

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

// Tarefa 5: Rota POST /api/login (Autenticação com validação do Zod)
app.post('/api/login', (req, res) => {
  try {
    const { usuario, senha } = loginSchema.parse(req.body);

    if (usuario === 'admin' && senha === '123456') {
      return res.json({
        sucesso: true,
        usuario: { nome: 'Administrador UBS', cargo: 'RECEPCAO' },
        token: 'token-simulacao-atendubs'
      });
    }

    if (usuario === 'medico' && senha === '123456') {
      return res.json({
        sucesso: true,
        usuario: { nome: 'Dr. Silva', cargo: 'MEDICO', consultorio: 'Consultório 01' },
        token: 'token-simulacao-atendubs'
      });
    }

    return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
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

// Registro dos Módulos de Rotas (Tarefas 3, 4, 6, 7 e 8)
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