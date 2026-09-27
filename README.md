# Weather, wherever you are


A full-stack React weather app. The React client calls a small Express API, which looks up locations and retrieves a five-day forecast from [Open-Meteo](https://open-meteo.com/). No API key is required.


## Requirements


- Node.js 20.19+ or 22.12+


## Run locally


```sh
npm install
npm run dev
```


Vite serves the app at `http://localhost:4173` and proxies `/api` requests to the Express server at port `3001`.


For production, run `npm run build`, then set `NODE_ENV=production` and start the Express server with `npm start`.

# Weather, wherever you are

A full-stack React weather app. The React client calls a small Express API, which looks up locations and retrieves a five-day forecast from [Open-Meteo](https://open-meteo.com/). No API key is required.

## Requirements

- Node.js 20.19+ or 22.12+

## Run locally

```sh
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173` and proxies `/api` requests to the Express server at port `3001`.

For production, run `npm run build`, then set `NODE_ENV=production` and start the Express server with `npm start`.
