import { request, queryString } from './apiClient';
export const searchApi = {
  list: async ({ q, page = 1, limit = 20 } = {}, signal) => {
    const d = await request('/search' + queryString({ q }), { signal });
    const urls = {
      transactions: '/transactions',
      categories: '/categories',
      goals: '/goals',
      bills: '/bills',
      tips: '/saving-tips',
      insights: '/insights',
      notes: '/saved'
    };
    const items = Object.entries(d.results).flatMap(([type, rows]) =>
      rows.map((r) => ({
        id: `${type}:${r.id}`,
        type,
        title: r.title || r.name || r.description || 'Monthly insight',
        snippet: r.content || r.summary || r.description,
        url: urls[type]
      }))
    );
    return {
      items: items.slice((page - 1) * limit, page * limit),
      total: items.length
    };
  }
};
export default searchApi;
