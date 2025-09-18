import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { authUsers } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

interface JWTPayload {
  sub: string; // user ID
  email: string;
  isActive: boolean;
  iat?: number;
  exp?: number;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    fullName: string;
    isActive: boolean;
  };
}

export async function verifyJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    console.log('🔐 [JWT] Verificando token para:', req.method, req.path);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [JWT] Header Authorization não encontrado ou inválido');
      return res.status(401).json({ message: 'Token de acesso requerido' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('❌ [JWT] JWT_SECRET não configurado');
      return res.status(500).json({ message: 'Erro de configuração do servidor' });
    }

    // Verify JWT signature and expiry
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Validate user still exists and is active
    const user = await db.select()
      .from(authUsers)
      .where(and(
        eq(authUsers.id, parseInt(decoded.sub)),
        eq(authUsers.isActive, true)
      ))
      .limit(1);

    if (!user || user.length === 0) {
      return res.status(401).json({ message: 'Usuário não encontrado ou inativo' });
    }

    const authUser = user[0];

    // Add user to request object
    req.user = {
      id: authUser.id,
      email: authUser.email,
      fullName: authUser.fullName,
      isActive: authUser.isActive
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expirado' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    console.error('Erro na verificação do JWT:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

export function generateJWT(userId: number, email: string, isActive: boolean): string {
  const jwtSecret = process.env.JWT_SECRET;

  console.log('🔐 [JWT] Verificando JWT_SECRET:', jwtSecret ? 'presente' : 'ausente');

  if (!jwtSecret) {
    console.error('❌ [JWT] JWT_SECRET não encontrado nas variáveis de ambiente');
    throw new Error('JWT_SECRET não configurado');
  }

  const payload: JWTPayload = {
    sub: userId.toString(),
    email,
    isActive
  };

  // Token expires in 7 days
  return jwt.sign(payload, jwtSecret, { 
    expiresIn: '7d',
    algorithm: 'HS256'
  });
}