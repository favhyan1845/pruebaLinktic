import { http, HttpResponse } from 'msw';
console.log('Mock handlers loaded');
interface LoginRequestBody {
  email: string;
  password: string;
}

interface RefreshRequestBody {
  refreshToken: string;
}

interface UpdateProfileRequestBody {
  name: string;
}

const users = [
  {
    id: '1',
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    createdAt: new Date().toISOString(),
  },
];

let accessToken = '';
let refreshToken = '';

const generateTokens = (user: any) => {
  const newAccessToken = `access-token-${user.id}-${Date.now()}`;
  const newRefreshToken = `refresh-token-${user.id}-${Date.now()}`;
  accessToken = newAccessToken;
  refreshToken = newRefreshToken;
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};


export const handlers = [
  http.post('/users/login', async ({ request }) => {
    console.log('Received login request');
    console.log('Request headers:', Array.from(request.headers.entries()));
    const requestBody = (await request.json()) as LoginRequestBody;
    console.log('Request body:', requestBody);
    const { email, password } = requestBody;
    const user = users.find(u => u.email === email && u.password === password);
console.log('Login attempt:', email, password, 'User found:', user);
    if (!user) {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const tokens = generateTokens(user);
    return HttpResponse.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  }),

  // Handler para la ruta GET /dashboard
  http.get('/dashboard', () => {
    console.log('Received GET /dashboard request');
    return HttpResponse.json({ message: 'Dashboard mock data', user: { name: 'Test User' } }, { status: 200 });
  }),

  // Handler para la ruta GET /login
  http.get('/login', () => {
    console.log('Received GET /login request');
    return HttpResponse.json({ message: 'Login page mock data' }, { status: 200 });
  }),

  http.post('/users/refresh', async ({ request }) => {
    const { refreshToken: reqRefreshToken } = (await request.json()) as RefreshRequestBody;

    if (reqRefreshToken !== refreshToken || !refreshToken) {
      return new HttpResponse(null, { status: 401, statusText: 'Invalid refresh token' });
    }

    // In a real app, you'd verify the refresh token and generate new tokens
    // For this mock, we'll just assume it's valid and generate new ones for the first user
    const user = users[0]; // Assuming we refresh for the first user for simplicity
    const tokens = generateTokens(user);
    return HttpResponse.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  }),

  http.get('/users/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || token !== accessToken) {
      return new HttpResponse(null, { status: 401, statusText: 'Unauthorized' });
    }

    // In a real app, you'd decode the token and get user info
    // For this mock, we'll just return the first user's data
    const user = users[0];
    return HttpResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    });
  }),

  http.put('/users/me', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || token !== accessToken) {
      return new HttpResponse(null, { status: 401, statusText: 'Unauthorized' });
    }

    const { name } = (await request.json()) as UpdateProfileRequestBody;
    if (!name) {
      return new HttpResponse(null, { status: 400, statusText: 'Name is required' });
    }

    // Update the user's name in the mock data
    users[0].name = name;

    return HttpResponse.json({
      id: users[0].id,
      email: users[0].email,
      name: users[0].name,
      createdAt: users[0].createdAt,
    });
  }),
];
