import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

type StockStatus = 'Disponível' | 'Estoque baixo' | 'Vencido' | 'Vencer';

interface StockRow {
  id: string;
  epi: string;
  compartimento: string;
  disponivel: number;
  minimo: number;
  status: StockStatus;
}

export async function GET() {
  try {
    const [rows] = await pool.execute(
      `SELECT
        e.id_epi,
        e.nome,
        e.compartimento,
        e.quantidade_estoque,
        e.quantidade_minima,
        e.data_fabricacao,
        e.lote,
        e.validade_ca
       FROM epi e
       WHERE e.quantidade_estoque > 0
       ORDER BY e.nome`
    );

    const epis = rows as any[];
    const stock: StockRow[] = epis.map((epi, index) => {
      let status: StockStatus = 'Disponível';

      // Check if expired (using validade_ca as expiry date)
      if (epi.validade_ca) {
        const validadeDate = new Date(epi.validade_ca);
        if (validadeDate.getTime() < Date.now()) {
          status = 'Vencido';
        } else {
          // Check if expiring within 30 days
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          if (validadeDate <= thirtyDaysFromNow) {
            status = 'Vencer';
          }
        }
      }

      // Check if low stock (only if not already vencido/vencer)
      if (status === 'Disponível' && epi.quantidade_estoque <= epi.quantidade_minima && epi.quantidade_minima > 0) {
        status = 'Estoque baixo';
      }

      return {
        id: String(epi.id_epi),
        epi: epi.nome,
        compartimento: epi.compartimento || 'N/A',
        disponivel: epi.quantidade_estoque,
        minimo: epi.quantidade_minima,
        status,
      };
    });

    return NextResponse.json({ stock });
  } catch (error) {
    console.error('Erro ao buscar estoque:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estoque' },
      { status: 500 }
    );
  }
}