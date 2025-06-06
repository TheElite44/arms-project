import type { RequestHandler } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_HANIME_API || '';

export const GET: RequestHandler = async () => {
  try {
    const response = await fetch(`${API_URL}/docs/genre`);
    if (!response.ok) {
      return new Response(
        JSON.stringify({ status: 'error', error: 'Failed to fetch genres' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const data = await response.json();
    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ status: 'error', error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};