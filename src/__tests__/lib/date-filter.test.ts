describe('Date Filtering & Revenue Calculations', () => {
  const sampleSales = [
    {
      id: 'sale-1',
      invoiceNo: 'INV-2026-0001',
      totalAmount: 150.00,
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      createdAt: new Date('2026-10-31T09:30:00Z'),
      items: [
        { quantity: 2, priceAtSale: 50.00, costAtSale: 30.00 },
        { quantity: 1, priceAtSale: 50.00, costAtSale: 25.00 },
      ]
    },
    {
      id: 'sale-2',
      invoiceNo: 'INV-2026-0002',
      totalAmount: 320.50,
      paymentMethod: 'MOMO',
      status: 'COMPLETED',
      createdAt: new Date('2026-10-31T14:15:00Z'),
      items: [
        { quantity: 3, priceAtSale: 100.00, costAtSale: 60.00 },
        { quantity: 1, priceAtSale: 20.50, costAtSale: 10.00 },
      ]
    },
    {
      id: 'sale-3',
      invoiceNo: 'INV-2026-0003',
      totalAmount: 500.00,
      paymentMethod: 'CARD',
      status: 'COMPLETED',
      createdAt: new Date('2026-10-30T11:00:00Z'),
      items: [
        { quantity: 5, priceAtSale: 100.00, costAtSale: 70.00 },
      ]
    },
    {
      id: 'sale-4',
      invoiceNo: 'INV-2026-0004',
      totalAmount: 80.00,
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      createdAt: new Date('2026-10-25T16:00:00Z'),
      items: [
        { quantity: 2, priceAtSale: 40.00, costAtSale: 20.00 },
      ]
    }
  ];

  function toLocalDateString(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function calculateDailyRevenue(sales: typeof sampleSales, targetDate: string) {
    const matching = sales.filter(s => toLocalDateString(s.createdAt) === targetDate);
    const totalRevenue = matching.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalItems = matching.reduce((sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0), 0);
    const paymentBreakdown: Record<string, number> = {};
    matching.forEach(s => {
      paymentBreakdown[s.paymentMethod] = (paymentBreakdown[s.paymentMethod] || 0) + s.totalAmount;
    });

    return {
      date: targetDate,
      salesCount: matching.length,
      totalRevenue,
      totalItems,
      averageOrderValue: matching.length > 0 ? totalRevenue / matching.length : 0,
      paymentBreakdown
    };
  }

  test('filters sales accurately by a specific date', () => {
    const targetDate = toLocalDateString(sampleSales[0].createdAt);
    const result = calculateDailyRevenue(sampleSales, targetDate);

    expect(result.salesCount).toBe(2);
    expect(result.totalRevenue).toBe(470.50);
    expect(result.totalItems).toBe(7);
    expect(result.paymentBreakdown['CASH']).toBe(150.00);
    expect(result.paymentBreakdown['MOMO']).toBe(320.50);
    expect(result.averageOrderValue).toBeCloseTo(235.25);
  });

  test('returns 0 revenue for date with no sales', () => {
    const result = calculateDailyRevenue(sampleSales, '2026-01-01');
    expect(result.salesCount).toBe(0);
    expect(result.totalRevenue).toBe(0);
    expect(result.totalItems).toBe(0);
    expect(result.averageOrderValue).toBe(0);
  });

  test('extracts unique dates with sales correctly', () => {
    const map = new Map<string, number>();
    sampleSales.forEach(s => {
      const d = toLocalDateString(s.createdAt);
      map.set(d, (map.get(d) || 0) + 1);
    });

    const uniqueDates = Array.from(map.keys());
    expect(uniqueDates.length).toBe(3);
    expect(map.get(toLocalDateString(sampleSales[0].createdAt))).toBe(2);
    expect(map.get(toLocalDateString(sampleSales[2].createdAt))).toBe(1);
    expect(map.get(toLocalDateString(sampleSales[3].createdAt))).toBe(1);
  });
});
