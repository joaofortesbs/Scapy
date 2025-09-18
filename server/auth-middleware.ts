import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { authUsers } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// JWT_SECRET should be defined in your environment variables
const JWT_SECRET = process.env.JWT_SECRET as string;

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
  console.log(`🔐 [JWT] Verificando token para: ${req.method} ${req.path}`);

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ [JWT] Header Authorization não encontrado ou inválido');
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  console.log(`🔑 [JWT] Token extraído: ${token.substring(0, 20)}...`);

  if (!JWT_SECRET) {
    console.error('❌ [JWT] JWT_SECRET não configurado no ambiente.');
    return res.status(500).json({ message: 'Erro de configuração do servidor' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    console.log(`✅ [JWT] Token válido para usuário ID: ${decoded.sub}`);

    // Validate user still exists and is active
    const user = await db.select()
      .from(authUsers)
      .where(and(
        eq(authUsers.id, parseInt(decoded.sub)),
        eq(authUsers.isActive, true)
      ))
      .limit(1);

    if (!user || user.length === 0) {
      console.error(`❌ [JWT] Usuário com ID ${decoded.sub} não encontrado ou inativo.`);
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
    console.error('❌ [JWT] Erro na verificação do token:', error);

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expirado' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    } else {
      return res.status(500).json({ message: 'Erro interno do servidor durante a autenticação' });
    }
  }
}

export function generateJWT(userId: number, email: string, isActive: boolean): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET não configurado');
  }

  const payload: JWTPayload = {
    sub: userId.toString(),
    email,
    isActive
  };

  // Token expires in 7 days
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
    algorithm: 'HS256'
  });
}