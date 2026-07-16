# Quilt Layout Solver

## Development

```bash
nix develop --command npm install
nix develop --command npm run dev
```

## GitHub Pages

The production build is fully static and writes to `docs/` for GitHub Pages:

```bash
nix develop --command npm run build
```

Commit `docs/`, then configure GitHub Pages to deploy from the repository branch's `/docs` directory. Asset, service-worker, manifest, and Z3 paths are relative so they also work for a project page at `https://<account>.github.io/<repository>/`.

## Testing on a phone or tablet

PWA installation and the threaded Z3 solver require HTTPS. Generate a trusted local certificate and serve on the LAN:

```bash
nix develop --command npm run dev:https
```

The command prints the LAN IP address covered by the certificate. On each device, install and trust the local `mkcert` root certificate before opening `https://<LAN-IP>:5173`:

```bash
nix develop --command mkcert -CAROOT
```

Copy `rootCA.pem` from that directory to the device. iOS requires enabling full trust for the installed certificate in **Settings → General → About → Certificate Trust Settings**. Android Firefox may require importing it into Firefox's certificate store.

Android Chrome supports PWA installation from the browser menu. On iOS Safari, use **Share → Add to Home Screen**. Android Firefox does not provide standard PWA installation support.
