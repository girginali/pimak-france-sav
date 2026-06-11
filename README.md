# Pimak France — SAV

Teknik servis iş akışı yönetim sistemi.

## Kurulum

```bash
npm install
npm start
```

## Yayınlama (Vercel)

```bash
npm install -g vercel
vercel
```

## EmailJS Aktivasyonu

`src/App.jsx` içinde `EJS` bloğunu doldurun:

```js
const EJS = {
  publicKey:   "...",
  serviceId:   "...",
  tplNew:      "...",
  tplDelivery: "...",
  to:          "admin@pimak.fr",
};
```

## Demo PIN

| Kullanıcı   | PIN  | Rol            |
|-------------|------|----------------|
| Admin       | 1234 | Administrateur |
| Jean-Pierre | 2222 | Technicien     |
| Sophie      | 3333 | Technicien     |
| Marc        | 4444 | Technicien     |
