import { request, resourceApi, queryString } from './apiClient';
export const goalApi = {
  ...resourceApi('/goals'),
  contributions: async (id, signal) => {
    const d = await request(`/goals/${encodeURIComponent(id)}/contributions`, {
      signal
    });
    return { items: d.contributions };
  },
  contribute: (id, body) =>
    request(`/goals/${encodeURIComponent(id)}/contributions`, {
      method: 'POST',
      body
    }),
  removeContribution: (id, contributionId) =>
    request(
      `/goals/${encodeURIComponent(id)}/contributions/${encodeURIComponent(contributionId)}`,
      { method: 'DELETE' }
    )
};
export default goalApi;
