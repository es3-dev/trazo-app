import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) return res.status(422).json({ error: 'Datos inválidos', details: err.flatten() });
  if (err?.code === 'P2002') return res.status(409).json({ error: 'Ya existe un registro con ese valor' });
  if (err?.code === 'P2025') return res.status(404).json({ error: 'Registro no encontrado' });
  if (err?.code === 'P2003') return res.status(409).json({ error: 'No se puede eliminar porque el registro está en uso' });
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
};
