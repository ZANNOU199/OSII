import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import process from 'node:process';
import { createServer as createViteServer } from 'vite';
import { MENU_ITEMS, NEIGHBORHOODS } from './src/data/menu';

const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const fedapayBaseUrl = 'https://sandbox-api.fedapay.com/v1';

app.use(express.json({ limit: '32kb' }));

const getResource = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== 'object') return {};
  const record = body as Record<string, unknown>;
  const data = record.data && typeof record.data === 'object'
    ? record.data as Record<string, unknown>
    : record;
  const transaction = data.transaction ?? data['v1/transaction'] ?? data;
  return transaction && typeof transaction === 'object'
    ? transaction as Record<string, unknown>
    : {};
};

const getFedaPayErrorMessage = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') return '';
  const record = payload as Record<string, unknown>;
  const messages: string[] = [];

  for (const key of ['message', 'error', 'detail']) {
    if (typeof record[key] === 'string') messages.push(record[key]);
  }

  if (record.errors && typeof record.errors === 'object') {
    for (const [field, value] of Object.entries(record.errors)) {
      const fieldMessages = Array.isArray(value) ? value : [value];
      for (const message of fieldMessages) {
        if (typeof message === 'string') messages.push(`${field}: ${message}`);
      }
    }
  }

  return [...new Set(messages)].join(' ').slice(0, 500);
};

const fedapayRequest = async (endpoint: string, init?: RequestInit): Promise<Record<string, unknown>> => {
  const secretKey = process.env.FEDAPAY_SECRET_KEY?.trim();
  if (!secretKey) {
    const error = new Error('La clé sandbox FedaPay manque dans le fichier .env.');
    Object.assign(error, { statusCode: 503 });
    throw error;
  }

  const response = await fetch(`${fedapayBaseUrl}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers
    }
  });
  const responseBody = await response.text();
  let payload: unknown;
  try {
    payload = responseBody ? JSON.parse(responseBody) : {};
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const providerMessage = getFedaPayErrorMessage(payload);
    const detail = providerMessage ? ` : ${providerMessage}` : '';
    const error = new Error(`FedaPay a refusé la requête (${response.status})${detail}.`);
    Object.assign(error, { statusCode: 502 });
    throw error;
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('FedaPay a retourné une réponse invalide.');
  }
  return payload as Record<string, unknown>;
};

const getAppBaseUrl = (request: Request): URL => {
  const configuredUrl = process.env.APP_URL?.trim();
  const origin = configuredUrl || request.get('origin') || `http://localhost:${port}`;
  const baseUrl = new URL(origin);
  if (baseUrl.protocol !== 'https:' && baseUrl.hostname !== 'localhost' && baseUrl.hostname !== '127.0.0.1') {
    throw new Error('APP_URL doit utiliser HTTPS.');
  }
  return baseUrl;
};

const createVerificationToken = (transactionId: string, amount: number): string => {
  const signingKey = process.env.FEDAPAY_SECRET_KEY?.trim();
  if (!signingKey) throw new Error('La clé sandbox FedaPay manque dans le fichier .env.');
  return createHmac('sha256', signingKey).update(`${transactionId}:${amount}`).digest('hex');
};

app.post('/api/payments/start', async (request: Request, response: Response) => {
  try {
    const body = request.body as {
      customer?: { fullName?: string; phone?: string };
      deliveryType?: string;
      neighborhood?: string;
      address?: string;
      items?: Array<{ menuItemId?: string; quantity?: number; variant?: string; spice?: string; selectedPrice?: number }>;
    };
    const fullName = body.customer?.fullName?.trim();
    const phone = body.customer?.phone?.replace(/\D/g, '');
    const deliveryType = body.deliveryType;
    const neighborhood = NEIGHBORHOODS.find((entry) => entry.name === body.neighborhood);
    const address = body.address?.trim() || '';

    if (!fullName || fullName.length > 100 || !phone || phone.length < 8 || phone.length > 15) {
      response.status(400).json({ error: 'Vérifie ton nom et ton numéro de téléphone.' });
      return;
    }
    if (deliveryType !== 'delivery' && deliveryType !== 'pickup') {
      response.status(400).json({ error: 'Mode de réception invalide.' });
      return;
    }
    if (!neighborhood || (deliveryType === 'delivery' && (!address || address.length > 240))) {
      response.status(400).json({ error: 'Vérifie le quartier et l’adresse de livraison.' });
      return;
    }
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) {
      response.status(400).json({ error: 'Le panier est vide ou contient trop d’articles.' });
      return;
    }

    let subtotal = 0;
    const descriptions: string[] = [];
    for (const requestedItem of body.items) {
      const menuItem = MENU_ITEMS.find((entry) => entry.id === requestedItem.menuItemId);
      const quantity = requestedItem.quantity;
      if (!menuItem || !Number.isInteger(quantity) || !quantity || quantity < 1 || quantity > 20) {
        response.status(400).json({ error: 'Un article du panier est invalide.' });
        return;
      }

      let unitPrice = menuItem.price;
      let choice = '';
      if (menuItem.category === 'degue') {
        const variant = requestedItem.variant;
        if (!variant || !['Mil', 'Couscous', 'Mélangé'].includes(variant)) {
          response.status(400).json({ error: 'Choisis la préparation du dèguè.' });
          return;
        }
        const selectedPrice = requestedItem.selectedPrice;
        if (selectedPrice !== 300 && selectedPrice !== 500) {
          response.status(400).json({ error: 'Choisis le prix du dèguè.' });
          return;
        }
        unitPrice = selectedPrice;
        choice = variant;
      } else if (menuItem.category === 'chawarma') {
        if (!['pimente', 'non_pimente'].includes(requestedItem.spice || '')) {
          response.status(400).json({ error: 'Choisis si tu souhaites le chawarma pimenté.' });
          return;
        }
        choice = requestedItem.spice === 'pimente' ? 'pimenté' : 'non pimenté';
      }

      subtotal += unitPrice * quantity;
      descriptions.push(`${quantity}x ${menuItem.name}${choice ? ` (${choice})` : ''}`);
    }

    const deliveryFee = deliveryType === 'delivery' ? neighborhood.fee : 0;
    const amount = subtotal + deliveryFee;
    const [firstname, ...lastNameParts] = fullName.split(/\s+/);
    const callbackUrl = getAppBaseUrl(request);
    callbackUrl.searchParams.set('fedapay_return', '1');

    const transactionResponse = await fedapayRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        description: `Commande Chez OSI: ${descriptions.join(', ')}`,
        amount,
        currency: { iso: 'XOF' },
        mode: 'momo_test',
        callback_url: callbackUrl.toString(),
        customer: {
          firstname,
          lastname: lastNameParts.join(' ') || firstname,
          phone_number: { number: Number(phone), country: 'BJ' }
        }
      })
    });
    const transaction = getResource(transactionResponse);
    const transactionId = transaction.id;
    if (typeof transactionId !== 'number' && typeof transactionId !== 'string') {
      throw new Error('FedaPay n’a pas retourné l’identifiant de transaction.');
    }

    const tokenResponse = await fedapayRequest(`/transactions/${encodeURIComponent(String(transactionId))}/token`, {
      method: 'POST'
    });
    const tokenData = tokenResponse.data && typeof tokenResponse.data === 'object'
      ? tokenResponse.data as Record<string, unknown>
      : tokenResponse;
    const paymentUrl = tokenData.url;
    if (typeof paymentUrl !== 'string' || !paymentUrl.startsWith('https://')) {
      throw new Error('FedaPay n’a pas retourné de lien de paiement valide.');
    }

    response.json({
      transactionId: String(transactionId),
      amount,
      paymentUrl,
      verificationToken: createVerificationToken(String(transactionId), amount)
    });
  } catch (error) {
    const statusCode = typeof error === 'object' && error && 'statusCode' in error
      ? Number(error.statusCode)
      : 502;
    console.error('FedaPay payment initialization failed:', error);
    response.status(statusCode).json({
      error: error instanceof Error ? error.message : 'Impossible de démarrer le paiement FedaPay.'
    });
  }
});

app.get('/api/payments/:transactionId', async (request: Request, response: Response) => {
  try {
    const transactionId = request.params.transactionId;
    const amount = Number(request.query.amount);
    const token = request.query.token;
    if (!/^\d+$/.test(transactionId) || !Number.isInteger(amount) || typeof token !== 'string') {
      response.status(400).json({ error: 'Vérification de paiement invalide.' });
      return;
    }

    const expectedToken = createVerificationToken(transactionId, amount);
    const expectedBuffer = Buffer.from(expectedToken, 'hex');
    const receivedBuffer = Buffer.from(token, 'hex');
    if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) {
      response.status(403).json({ error: 'Vérification de paiement refusée.' });
      return;
    }

    const transactionResponse = await fedapayRequest(`/transactions/${encodeURIComponent(transactionId)}`);
    const transaction = getResource(transactionResponse);
    const transactionAmount = Number(transaction.amount);
    if (transactionAmount !== amount) {
      response.status(409).json({ error: 'Le montant de la transaction ne correspond pas.' });
      return;
    }

    response.json({ status: transaction.status, amount: transactionAmount });
  } catch (error) {
    const statusCode = typeof error === 'object' && error && 'statusCode' in error
      ? Number(error.statusCode)
      : 502;
    console.error('FedaPay payment verification failed:', error);
    response.status(statusCode).json({
      error: error instanceof Error ? error.message : 'Impossible de vérifier le paiement FedaPay.'
    });
  }
});

if (isProduction) {
  app.use(express.static('dist'));
  app.get('*', (_request: Request, response: Response) => response.sendFile('index.html', { root: 'dist' }));
} else {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {}
    },
    appType: 'spa'
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Chez OSI server listening at http://localhost:${port}`);
});
