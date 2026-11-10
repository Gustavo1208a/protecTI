import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge, getTokenFromHeader } from '@/lib/auth-edge';

const publicPaths = ['/login', '/api/auth/login', '/api/auth/register', '/api/auth/me', '/api/arduino/auth', '/api/arduino/entrega'];

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
    if (pathname.startsWith(route)) {
      return cargos.includes(id_cargo);
    }
  }
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

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