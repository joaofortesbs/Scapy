/**
 * Autenticação local-first.
 *
 * As contas e a sessão usam namespaces próprios para que o formato legado
 * continue disponível somente como uma camada de compatibilidade. Nenhum
 * segredo é registrado no console.
 */

export const AUTH_ACCOUNTS_KEY = 'scapy_auth_accounts_v1';
export const AUTH_SESSION_KEY = 'scapy_auth_session_v1';

const PASSWORD_HASH_VERSION = 'pbkdf2-sha256-v1';
const PASSWORD_HASH_ITERATIONS = 120_000;
const MIN_PASSWORD_LENGTH = 6;

export type AuthSource = 'local' | 'server';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  full_name: string;
  fullName: string;
  nomeCompleto?: string;
  startDate: string | null;
  timerStartDate: string | null;
  timerIsActive: boolean;
  bestStreak: number;
  relapseCount: number;
  scapyPoints: number;
  quizCompleted: boolean;
  genero: string | null;
  frequencia: string | null;
  motivacao: string | null;
  gatilhos: string | null;
  religiao: string | null;
  imagemAvatar?: string | null;
  profileImage?: string | null;
}

interface LocalAccount {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  source: AuthSource;
  createdAt: string;
  updatedAt: string;
  user: AuthUser;
}

export interface AuthSession {
  accountId: string;
  source: AuthSource;
  user: AuthUser;
  authenticatedAt: string;
  needsQuiz?: boolean;
  remoteToken?: string;
}

export interface AuthSuccess {
  user: AuthUser;
  isNewUser: boolean;
  source: AuthSource;
  warning?: string;
}

export class AuthError extends Error {
  constructor(
    public readonly code:
      | 'VALIDATION'
      | 'DUPLICATE_LOCAL'
      | 'INVALID_CREDENTIALS'
      | 'SERVER_UNAVAILABLE'
      | 'SERVER_ERROR'
      | 'STORAGE_ERROR',
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

interface RemoteUser {
  id?: string | number;
  email?: string;
  fullName?: string;
  full_name?: string;
  nomeCompleto?: string;
  startDate?: string | null;
  quizCompleted?: boolean;
  timerStartDate?: string | null;
  timerIsActive?: boolean;
  bestStreak?: number;
  relapseCount?: number;
  scapyPoints?: number;
  genero?: string | null;
  frequencia?: string | null;
  motivacao?: string | null;
  gatilhos?: string | null;
  religiao?: string | null;
  imagemAvatar?: string | null;
  profileImage?: string | null;
}

interface RemoteResponse {
  user?: RemoteUser;
  token?: string;
  message?: string;
}

const getStorage = (): Storage => {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new AuthError('STORAGE_ERROR', 'O armazenamento local não está disponível neste navegador.');
  }
  return window.localStorage;
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const normalizeName = (name: string): string => name.trim().replace(/\s+/g, ' ');

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateCredentials = (email: string, password: string, fullName?: string) => {
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    throw new AuthError('VALIDATION', 'Digite um e-mail válido.');
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError('VALIDATION', 'A senha deve ter pelo menos 6 caracteres.');
  }

  if (fullName !== undefined) {
    const normalizedName = normalizeName(fullName);
    if (!normalizedName) {
      throw new AuthError('VALIDATION', 'Digite seu nome completo.');
    }
    if (normalizedName.length > 255) {
      throw new AuthError('VALIDATION', 'O nome informado é muito longo.');
    }
  }

  return normalizedEmail;
};

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const fromBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const bytesEqual = (left: Uint8Array, right: Uint8Array): boolean => {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left[index] ^ right[index];
  }
  return result === 0;
};

const getCrypto = (): Crypto => {
  if (typeof crypto === 'undefined' || !crypto.subtle || !crypto.getRandomValues) {
    throw new AuthError('STORAGE_ERROR', 'Este navegador não oferece criptografia local suficiente.');
  }
  return crypto;
};

const hashPassword = async (password: string): Promise<string> => {
  const webCrypto = getCrypto();
  const salt = webCrypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await webCrypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derivedBits = await webCrypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PASSWORD_HASH_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  );

  return [
    PASSWORD_HASH_VERSION,
    PASSWORD_HASH_ITERATIONS,
    toBase64(salt),
    toBase64(new Uint8Array(derivedBits)),
  ].join('$');
};

const comparePassword = async (password: string, encodedHash: string): Promise<boolean> => {
  try {
    const [version, iterationsText, saltText, expectedText] = encodedHash.split('$');
    const iterations = Number(iterationsText);
    if (
      version !== PASSWORD_HASH_VERSION ||
      !Number.isInteger(iterations) ||
      iterations <= 0 ||
      !saltText ||
      !expectedText
    ) {
      return false;
    }

    const webCrypto = getCrypto();
    const keyMaterial = await webCrypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const derivedBits = await webCrypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: fromBase64(saltText),
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      256,
    );

    return bytesEqual(new Uint8Array(derivedBits), fromBase64(expectedText));
  } catch {
    return false;
  }
};

const createLocalId = (): string => {
  const webCrypto = typeof crypto !== 'undefined' ? crypto : undefined;
  if (webCrypto?.randomUUID) {
    return `local-${webCrypto.randomUUID()}`;
  }
  const randomPart = webCrypto?.getRandomValues
    ? toBase64(webCrypto.getRandomValues(new Uint8Array(16))).replace(/[^a-zA-Z0-9]/g, '')
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `local-${randomPart}`;
};

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = getStorage().getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown): void => {
  try {
    getStorage().setItem(key, JSON.stringify(value));
  } catch {
    throw new AuthError('STORAGE_ERROR', 'Não foi possível salvar os dados locais. Verifique o espaço do navegador.');
  }
};

const readAccounts = (): LocalAccount[] => {
  const accounts = readJson<unknown>(AUTH_ACCOUNTS_KEY, []);
  if (!Array.isArray(accounts)) return [];
  return accounts.filter((account): account is LocalAccount => {
    return Boolean(
      account &&
      typeof account === 'object' &&
      typeof (account as LocalAccount).id === 'string' &&
      typeof (account as LocalAccount).email === 'string' &&
      typeof (account as LocalAccount).passwordHash === 'string' &&
      (account as LocalAccount).user,
    );
  });
};

const saveAccounts = (accounts: LocalAccount[]): void => writeJson(AUTH_ACCOUNTS_KEY, accounts);

const saveLegacyAliases = (session: AuthSession | null): void => {
  const storage = getStorage();
  if (!session) {
    storage.removeItem('authToken');
    storage.removeItem('user');
    storage.removeItem('isAuthenticated');
    return;
  }

  storage.setItem('user', JSON.stringify(session.user));
  storage.setItem('isAuthenticated', 'true');
  if (session.remoteToken) {
    storage.setItem('authToken', session.remoteToken);
  } else {
    storage.removeItem('authToken');
  }
};

const normalizeUser = (
  rawUser: RemoteUser | Partial<AuthUser> | undefined,
  accountId: string,
  fallbackEmail: string,
  fallbackName: string,
): AuthUser => {
  const email = normalizeEmail(String(rawUser?.email || fallbackEmail));
  const fullName = normalizeName(
    String(rawUser?.fullName || rawUser?.nomeCompleto || rawUser?.full_name || fallbackName || 'Usuário'),
  ) || 'Usuário';
  const timerStartDate = rawUser?.timerStartDate || rawUser?.startDate || null;

  return {
    id: accountId,
    email,
    username: email,
    full_name: fullName,
    fullName,
    startDate: timerStartDate,
    timerStartDate,
    timerIsActive: Boolean(rawUser?.timerIsActive),
    bestStreak: Number(rawUser?.bestStreak || 0),
    relapseCount: Number(rawUser?.relapseCount || 0),
    scapyPoints: Number(rawUser?.scapyPoints || 0),
    quizCompleted: Boolean(rawUser?.quizCompleted),
    genero: rawUser?.genero || null,
    frequencia: rawUser?.frequencia || null,
    motivacao: rawUser?.motivacao || null,
    gatilhos: rawUser?.gatilhos || null,
    religiao: rawUser?.religiao || null,
    imagemAvatar: rawUser?.imagemAvatar || rawUser?.profileImage || null,
    profileImage: rawUser?.profileImage || rawUser?.imagemAvatar || null,
  };
};

const parseRemoteResponse = async (response: Response): Promise<RemoteResponse> => {
  try {
    const data = await response.json();
    return data && typeof data === 'object' ? data as RemoteResponse : {};
  } catch {
    return {};
  }
};

const establishSession = (
  account: LocalAccount,
  needsQuiz = false,
  remoteToken?: string,
): AuthSession => {
  const session: AuthSession = {
    accountId: account.id,
    source: account.source,
    user: account.user,
    authenticatedAt: new Date().toISOString(),
    needsQuiz,
    ...(remoteToken ? { remoteToken } : {}),
  };
  writeJson(AUTH_SESSION_KEY, session);
  saveLegacyAliases(session);
  return session;
};

const getAccountByEmail = (email: string): LocalAccount | undefined =>
  readAccounts().find((account) => normalizeEmail(account.email) === email);

const updateAccount = (account: LocalAccount): void => {
  const accounts = readAccounts();
  const index = accounts.findIndex((item) => item.id === account.id);
  if (index === -1) {
    accounts.push(account);
  } else {
    accounts[index] = account;
  }
  saveAccounts(accounts);
};

export const getStoredSession = (): AuthSession | null => {
  const session = readJson<unknown>(AUTH_SESSION_KEY, null);
  if (!session || typeof session !== 'object') return null;

  const candidate = session as Partial<AuthSession>;
  if (
    typeof candidate.accountId !== 'string' ||
    !candidate.user ||
    typeof candidate.user !== 'object' ||
    typeof candidate.user.id !== 'string' ||
    typeof candidate.user.email !== 'string'
  ) {
    clearStoredSession();
    return null;
  }

  const account = readAccounts().find((item) => item.id === candidate.accountId);
  if (!account) {
    clearStoredSession();
    return null;
  }

  return candidate as AuthSession;
};

export const clearStoredSession = (): void => {
  try {
    const storage = getStorage();
    storage.removeItem(AUTH_SESSION_KEY);
    saveLegacyAliases(null);
  } catch {
    // A logout must remain best-effort even if storage was already unavailable.
  }
};

export const getSessionToken = (): string | null => getStoredSession()?.remoteToken || null;

export const isLocalAccountId = (id: unknown): boolean =>
  typeof id === 'string' && id.startsWith('local-');

export const registerAccount = async (
  email: string,
  password: string,
  fullName: string,
): Promise<AuthSuccess> => {
  const normalizedEmail = validateCredentials(email, password, fullName);
  const normalizedName = normalizeName(fullName);

  if (getAccountByEmail(normalizedEmail)) {
    throw new AuthError('DUPLICATE_LOCAL', 'Este e-mail já está cadastrado neste navegador.');
  }

  const now = new Date().toISOString();
  const accountId = createLocalId();
  const user = normalizeUser(undefined, accountId, normalizedEmail, normalizedName);
  const account: LocalAccount = {
    id: accountId,
    email: normalizedEmail,
    fullName: normalizedName,
    passwordHash: await hashPassword(password),
    source: 'local',
    createdAt: now,
    updatedAt: now,
    user,
  };

  // A conta local é criada antes da sincronização para que o modo offline
  // continue funcionando mesmo quando a tabela remota estiver indisponível.
  updateAccount(account);
  establishSession(account, true);

  let warning: string | undefined;
  try {
    const response = await fetch('/api/usuarios/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password, fullName: normalizedName }),
    });
    const data = await parseRemoteResponse(response);

    if (response.ok) {
      const remoteUser = data.user;
      const syncedUser = normalizeUser(remoteUser, account.id, normalizedEmail, normalizedName);
      const syncedAccount: LocalAccount = {
        ...account,
        user: syncedUser,
        updatedAt: new Date().toISOString(),
      };
      updateAccount(syncedAccount);
      establishSession(syncedAccount, true, typeof data.token === 'string' ? data.token : undefined);
    } else if (response.status === 409) {
      warning = 'Conta criada neste navegador. O e-mail já existe no servidor e poderá ser sincronizado depois.';
    } else {
      warning = 'Conta criada neste navegador. A sincronização com o servidor ficará para depois.';
    }
  } catch {
    warning = 'Conta criada neste navegador. Você pode continuar mesmo sem conexão com o servidor.';
  }

  return { user: getStoredSession()!.user, isNewUser: true, source: 'local', warning };
};

export const loginAccount = async (
  email: string,
  password: string,
): Promise<AuthSuccess> => {
  const normalizedEmail = validateCredentials(email, password);
  const localAccount = getAccountByEmail(normalizedEmail);

  if (localAccount) {
    const validPassword = await comparePassword(password, localAccount.passwordHash);
    if (!validPassword) {
      throw new AuthError('INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
    }

    const session = establishSession(localAccount);
    return { user: session.user, isNewUser: false, source: localAccount.source };
  }

  let response: Response;
  let data: RemoteResponse;
  try {
    response = await fetch('/api/usuarios/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });
    data = await parseRemoteResponse(response);
  } catch {
    throw new AuthError(
      'SERVER_UNAVAILABLE',
      'Não foi possível conectar ao servidor. Tente novamente ou crie uma conta local.',
    );
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 404) {
      throw new AuthError('INVALID_CREDENTIALS', 'E-mail ou senha inválidos. Você também pode criar uma conta local.');
    }
    throw new AuthError(
      'SERVER_ERROR',
      'Não foi possível concluir o login agora. Tente novamente ou crie uma conta local.',
    );
  }

  if (!data.user || typeof data.user.id !== 'number' && typeof data.user.id !== 'string') {
    throw new AuthError('SERVER_ERROR', 'O servidor retornou uma resposta de login inválida.');
  }

  const accountId = createLocalId();
  const user = normalizeUser(data.user, accountId, normalizedEmail, data.user.fullName || 'Usuário');
  const account: LocalAccount = {
    id: accountId,
    email: normalizedEmail,
    fullName: user.full_name,
    passwordHash: await hashPassword(password),
    source: 'server',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user,
  };

  updateAccount(account);
  const session = establishSession(account, false, typeof data.token === 'string' ? data.token : undefined);
  return { user: session.user, isNewUser: false, source: 'server' };
};

export const updateAuthenticatedUser = (updates: Partial<AuthUser>): AuthUser | null => {
  const session = getStoredSession();
  if (!session) return null;

  const user = normalizeUser(
    { ...session.user, ...updates },
    session.user.id,
    session.user.email,
    session.user.full_name,
  );
  const account = readAccounts().find((item) => item.id === session.accountId);
  if (account) {
    updateAccount({ ...account, user, updatedAt: new Date().toISOString() });
  }

  const updatedSession = { ...session, user };
  writeJson(AUTH_SESSION_KEY, updatedSession);
  saveLegacyAliases(updatedSession);
  return user;
};

export const completeQuiz = (): AuthUser | null => {
  const session = getStoredSession();
  if (!session) return null;
  const user = updateAuthenticatedUser({ quizCompleted: true });
  if (!user) return null;
  const updatedSession = {
    ...getStoredSession()!,
    needsQuiz: false,
  };
  writeJson(AUTH_SESSION_KEY, updatedSession);
  saveLegacyAliases(updatedSession);
  return user;
};

export const logoutLocalSession = (): void => {
  clearStoredSession();
};