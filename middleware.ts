import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge, getTokenFromHeader } from '@/lib/auth-edge';

const publicPaths = ['/login', '/api/auth/login', '/api/auth/register', '/api/auth/me', '/api/arduino/auth', '/api/entrega', '/api/devolucao'];

const arduinoPaths = ['/api/arduino/auth', '/api/entrega', '/api/devolucao'];
const ARDUINO_SECRET = process.env.ARDUINO_SECRET;

const ALLOWED_IPS = (process.env.ARDUINO_ALLOWED_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);

const RATE_LIMIT_MAX = process.env.ARDUINO_RATE_LIMIT_MAX ? parseInt(process.env.ARDUINO_RATE_LIMIT_MAX, 10) : 0;
const RATE_LIMIT_WINDOW_MS = process.env.ARDUINO_RATE_LIMIT_WINDOW_MS ? parseInt(process.env.ARDUINO_RATE_LIMIT_WINDOW_MS, 10) : 60000;

type RateEntry = { count: number; resetAt: number };
const rateMap = new Map<string, RateEntry>();

function getClientIp(request: NextRequest): string {
  return (request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || request.ip || 'unknown');
}

function checkRateLimit(ip: string): boolean {
  if (RATE_LIMIT_MAX <= 0) return true;

  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;

  entry.count += 1;
  return true;
}

const ROUTE_ID_CARGOS: Record<string, number[]> = {
  '/funcionarios': [3],
  '/epis': [2, 3],
  '/estoque': [2, 3],
  '/entrega': [2, 3],
  '/devolucao': [2, 3],
  '/alertas': [3, 4],
  '/relatorios': [3, 4],
  '/dashboard': [2, 3, 4],
};

function allowedFor(pathname: string, id_cargo: number): boolean {
  for (const [route, cargos] of Object.entries(ROUTE_ID_CARGOS)) {
    if (pathname.startsWith(route)) return cargos.includes(id_cargo);
  }
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Chave de API compartilhada para rotas do armário Arduino (não usam token de usuário)
  if (arduinoPaths.some((path) => pathname.startsWith(path))) {
    const key = request.headers.get('x-arduino-key');
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader) || request.cookies.get('auth_token')?.value;

    if (token) return NextResponse.next();

    const clientIp = getClientIp(request);

    // Restrição por IP (opcional, configurada via ARDUINO_ALLOWED_IPS)
    if (ALLOWED_IPS.length > 0 && !ALLOWED_IPS.includes(clientIp)) return NextResponse.json({ error: 'IP não autorizado' }, { status: 403 });

    // Rate limiting (opcional, configurado via ARDUINO_RATE_LIMIT_MAX / WINDOW_MS)
    if (!checkRateLimit(clientIp)) return NextResponse.json({ error: 'Muitas requisições. Tente novamente mais tarde.' }, { status: 429 });

    // Caso contrário (chamada do Arduino), exige a chave compartilhada
    if (!ARDUINO_SECRET || !key || key !== ARDUINO_SECRET) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    return NextResponse.next();
  }

  if (publicPaths.some((path) => pathname.startsWith(path))) return NextResponse.next();

  const authHeader = request.headers.get('authorization');
  const token = getTokenFromHeader(authHeader) || request.cookies.get('auth_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyTokenEdge(token);

  if (!payload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return response;
  }

  // Usuários sem acesso ao site não podem acessar nenhuma rota protegida
  if (!payload.acesso_site) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verifica se o cargo tem permissão para a rota
  if (!allowedFor(pathname, payload.id_cargo)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'sem_permissao');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};