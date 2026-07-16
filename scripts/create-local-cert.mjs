import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { networkInterfaces } from 'node:os';

const certificateDirectory = '.local-certs';
const certificate = `${certificateDirectory}/dev.pem`;
const key = `${certificateDirectory}/dev-key.pem`;
const addresses = Object.values(networkInterfaces()).flat().filter((address) => address && address.family === 'IPv4' && !address.internal).map((address) => address.address);
if (!addresses.length) throw new Error('No LAN IPv4 address found. Connect to a local network before starting HTTPS development.');
mkdirSync(certificateDirectory, { recursive: true });
if (!existsSync(certificate) || !existsSync(key)) {
  execFileSync('mkcert', ['-install'], { stdio: 'inherit' });
  execFileSync('mkcert', ['-cert-file', certificate, '-key-file', key, 'localhost', '127.0.0.1', '::1', ...addresses], { stdio: 'inherit' });
}
console.log(`Local HTTPS certificate covers: ${addresses.join(', ')}`);
