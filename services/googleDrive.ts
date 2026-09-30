
import { Topic, AppSettings } from '../types';

/**
 * Global declarations for Google API (gapi) and Google Identity Services (google)
 * to fix property 'gapi'/'google' does not exist on type 'Window' errors.
 */
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const VAULT_FILENAME = 'quizmaster_vault.json';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

/**
 * Initializes the GAPI client.
 */
export const initGapiClient = async () => {
  return new Promise<void>((resolve) => {
    // Fix: Access gapi from window. Property 'gapi' is defined in global interface above.
    window.gapi.load('client', async () => {
      await window.gapi.client.init({
        discoveryDocs: [DISCOVERY_DOC],
      });
      gapiInited = true;
      resolve();
    });
  });
};

/**
 * Initializes the Google Identity Services client.
 */
export const initGisClient = (clientId: string) => {
  // Fix: Access google from window. Property 'google' is defined in global interface above.
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: '', // defined at login
  });
  gisInited = true;
};

/**
 * Requests an access token from the user.
 */
export const signInWithGoogle = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        reject(resp);
      }
      resolve(resp.access_token);
    };

    // Fix: Access gapi from window to satisfy TypeScript.
    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

export const isDriveConnected = (): boolean => {
  try {
    return Boolean(window.gapi?.client?.getToken()?.access_token);
  } catch {
    return false;
  }
};

/**
 * Finds the vault file in Google Drive.
 */
const findVaultFile = async () => {
  if (!isDriveConnected() || !window.gapi?.client?.drive) {
    return null;
  }
  try {
    const response = await window.gapi.client.drive.files.list({
      q: `name = '${VAULT_FILENAME}' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });
    return response.result.files?.[0] || null;
  } catch (e) {
    console.warn("Could not find Drive vault file:", e);
    return null;
  }
};

/**
 * Loads data from the Google Drive vault.
 */
export const loadFromDrive = async (): Promise<any | null> => {
  if (!isDriveConnected()) {
    return null;
  }
  try {
    const file = await findVaultFile();
    if (!file) return null;

    const response = await window.gapi.client.drive.files.get({
      fileId: file.id,
      alt: 'media',
    });
    return response.result;
  } catch (e) {
    console.error("Error loading from Drive", e);
    return null;
  }
};

/**
 * Saves data to the Google Drive vault.
 */
export const saveToDrive = async (data: any) => {
  if (!isDriveConnected()) {
    return;
  }
  try {
    const file = await findVaultFile();
    const metadata = {
      name: VAULT_FILENAME,
      mimeType: 'application/json',
    };
    const content = JSON.stringify(data);

    if (file) {
      // Update existing file
      // Fix: Access gapi from window to satisfy TypeScript.
      await window.gapi.client.request({
        path: `/upload/drive/v3/files/${file.id}`,
        method: 'PATCH',
        params: { uploadType: 'media' },
        body: content,
      });
    } else {
      // Create new file
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        content +
        close_delim;

      // Fix: Access gapi from window to satisfy TypeScript.
      await window.gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: {
          'Content-Type': 'multipart/related; boundary="' + boundary + '"',
        },
        body: multipartRequestBody,
      });
    }
  } catch (e) {
    console.error("Error saving to Drive", e);
  }
};

/**
 * Revokes the token and clears the session.
 */
export const signOutFromGoogle = () => {
  // Fix: Access gapi from window to satisfy TypeScript.
  const token = window.gapi.client.getToken();
  if (token !== null) {
    // Fix: Access google from window to satisfy TypeScript.
    window.google.accounts.oauth2.revoke(token.access_token);
    // Fix: Access gapi from window to satisfy TypeScript.
    window.gapi.client.setToken(null);
  }
};

export const getUserProfile = async () => {
  // Fix: Access gapi from window to satisfy TypeScript.
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${window.gapi.client.getToken().access_token}` },
  });
  return response.json();
};

// Legacy shim for existing calls
export const updateDataFile = async (id: string, data: any) => saveToDrive(data);
export const getLocalDataForUser = async () => loadFromDrive();
