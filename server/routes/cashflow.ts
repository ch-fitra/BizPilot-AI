import { Router, Request, Response } from 'express';
import { runSupabaseQuery } from '../db/supabaseClient';
import { AnalysisHistoryRepository } from '../repositories/analysisHistoryRepository';

const router = Router();

function getBusinessId(req: Request): string | null {
  return req.businessId || (req.query.business_id as string) || null;
}

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const months = parseInt(req.query.months as string, 10) || 6;

    const analysisRecords = await AnalysisHistoryRepository.getAll(businessId);
    const monthlyMap: Record<string, { income: number; expense: number; analysis_count: number }> = {};

    for (const record of analysisRecords) {
      const date = new Date(record.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { income: 0, expense: 0, analysis_count: 0 };
      }
      monthlyMap[key].income += record.total_sales || 0;
      monthlyMap[key].analysis_count += 1;
    }

    const cashflowEntries = await runSupabaseQuery<any[]>('cashflow_entries.summary', (supabase) => {
      let query = supabase
        .from('cashflow_entries')
        .select('*')
        .order('entry_date', { ascending: false });

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query;
    });

    for (const entry of cashflowEntries || []) {
      const date = new Date(entry.entry_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { income: 0, expense: 0, analysis_count: 0 };
      }
      if (entry.type === 'income') {
        monthlyMap[key].income += Number(entry.amount) || 0;
      } else if (entry.type === 'expense') {
        monthlyMap[key].expense += Number(entry.amount) || 0;
      }
    }

    const now = new Date();
    const series: any[] = [];
    let totalIncome = 0;
    let totalExpense = 0;

    for (let i = months - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      const monthData = monthlyMap[key] || { income: 0, expense: 0, analysis_count: 0 };
      const netProfit = monthData.income - monthData.expense;

      series.push({
        month: key,
        label,
        income: monthData.income,
        expense: monthData.expense,
        net_profit: netProfit,
        analysis_count: monthData.analysis_count,
      });

      totalIncome += monthData.income;
      totalExpense += monthData.expense;
    }

    const expenseByCategory: Record<string, number> = {};
    for (const entry of cashflowEntries || []) {
      if (entry.type === 'expense') {
        const cat = entry.category || 'lainnya';
        expenseByCategory[cat] = (expenseByCategory[cat] || 0) + (Number(entry.amount) || 0);
      }
    }

    return res.json({
      success: true,
      data: {
        summary: {
          total_income: totalIncome,
          total_expense: totalExpense,
          net_profit: totalIncome - totalExpense,
          profit_margin_pct: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0,
          months_covered: months,
        },
        monthly_series: series,
        expense_by_category: Object.entries(expenseByCategory).map(([category, amount]) => ({
          category,
          amount,
        })),
      },
    });
  } catch (err: any) {
    console.error('[Cashflow] Summary error:', err);
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

router.get('/expenses', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const limitParam = parseInt(req.query.limit as string, 10) || 50;

    const entries = await runSupabaseQuery<any[]>('cashflow_entries.expenses', (supabase) => {
      let query = supabase
        .from('cashflow_entries')
        .select('*')
        .order('entry_date', { ascending: false })
        .limit(limitParam);

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query;
    });

    return res.json({ success: true, data: entries || [], count: entries?.length || 0 });
  } catch (err: any) {
    console.error('[Cashflow] Get expenses error:', err);
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

router.post('/expense', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { type, category, amount, description, entry_date } = req.body;

    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'type wajib diisi: "income" atau "expense"',
      });
    }
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount wajib berupa angka positif (dalam IDR)',
      });
    }

    const data = await runSupabaseQuery<any>('cashflow_entries.create', (supabase) =>
      supabase
        .from('cashflow_entries')
        .insert({
          business_id: businessId,
          type,
          category: category || 'lainnya',
          amount: Number(amount),
          description: description || '',
          entry_date: entry_date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single()
    );

    return res.status(201).json({ success: true, data });
  } catch (err: any) {
    console.error('[Cashflow] Create entry error:', err);
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

router.delete('/expense/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const businessId = getBusinessId(req);

    await runSupabaseQuery<null>('cashflow_entries.delete', (supabase) => {
      let query = supabase.from('cashflow_entries').delete().eq('id', id);
      if (businessId) {
        query = query.eq('business_id', businessId);
      }
      return query;
    });

    return res.json({ success: true, message: 'Entri cashflow dihapus.' });
  } catch (err: any) {
    console.error('[Cashflow] Delete entry error:', err);
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

export default router;
