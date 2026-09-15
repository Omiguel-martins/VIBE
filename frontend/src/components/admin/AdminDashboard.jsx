import { useState } from 'react';

export default function AdminDashboard() {
  const [period, setPeriod] = useState('7d');

  // Dados mockados para simulação visual
  const stats = {
    '7d': { clients: 12, sales: 350.00, orders: 4 },
    '15d': { clients: 25, sales: 850.50, orders: 10 },
    '30d': { clients: 48, sales: 2100.00, orders: 25 },
    '60d': { clients: 90, sales: 4500.00, orders: 55 },
    '90d': { clients: 150, sales: 7800.00, orders: 89 },
    '6m': { clients: 300, sales: 15000.00, orders: 180 },
    '1y': { clients: 600, sales: 32000.00, orders: 400 },
    '2y': { clients: 1200, sales: 65000.00, orders: 850 },
  };

  const productRanking = [
    { name: 'Vibe - Boa Menina', sales: 15, revenue: 1198.50 },
    { name: 'Vibe - Rosa da Manhã', sales: 10, revenue: 799.00 },
    { name: 'Combo VIBE Completo', sales: 4, revenue: 800.00 },
    { name: 'Vibe - Invencível', sales: 2, revenue: 159.80 },
  ];

  const currentStats = stats[period];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header-container">
        <div>
          <h1 className="admin-page-title">Visão Geral</h1>
          <p className="admin-page-subtitle">Acompanhe o crescimento da VIBE.</p>
        </div>
        
        <div className="period-filter">
          <label>Filtrar por período:</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="admin-select" style={{ width: 'auto', marginLeft: '10px', padding: '10px' }}>
            <option value="7d">Últimos 7 dias</option>
            <option value="15d">Últimos 15 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="60d">Últimos 60 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="6m">Últimos 6 meses</option>
            <option value="1y">Último 1 ano</option>
            <option value="2y">Últimos 2 anos</option>
          </select>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Novos Clientes</h3>
          <div className="stat-value">{currentStats.clients}</div>
          <p className="stat-trend positive">+15% vs período anterior</p>
        </div>
        <div className="stat-card">
          <h3>Vendas Gerais (Faturamento)</h3>
          <div className="stat-value">R$ {currentStats.sales.toFixed(2).replace('.', ',')}</div>
          <p className="stat-trend positive">+8% vs período anterior</p>
        </div>
        <div className="stat-card">
          <h3>Pedidos Realizados</h3>
          <div className="stat-value">{currentStats.orders}</div>
          <p className="stat-trend neutral">Estável</p>
        </div>
      </div>
      
      <div className="dashboard-section">
        <h3 className="section-title">Vendas por Produto</h3>
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th style={{ textAlign: 'center' }}>Unidades Vendidas</th>
                <th style={{ textAlign: 'right' }}>Faturamento</th>
              </tr>
            </thead>
            <tbody>
              {productRanking.map((item, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: '500' }}>{item.name}</td>
                  <td style={{ textAlign: 'center' }}>{item.sales}</td>
                  <td style={{ textAlign: 'right' }}>R$ {item.revenue.toFixed(2).replace('.', ',')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note-text">*Os dados acima são simulados para demonstração da interface. Eles serão integrados ao banco de dados reais assim que lançarmos o fluxo de checkout.</p>
      </div>
    </div>
  );
}
