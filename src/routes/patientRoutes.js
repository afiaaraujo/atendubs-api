import { Router } from 'express';
import { PatientController } from '../controllers/patientController.js';

const router = Router();

// Fila e Cadastro
router.post('/pacientes', PatientController.create);
router.get('/pacientes', PatientController.listWaiting);

// Atendimento
router.put('/pacientes/:id/chamar', PatientController.callNext);
router.put('/pacientes/:id/finalizar', PatientController.finish);

// Relatórios
router.get('/relatorios', PatientController.reports);

export default router;
