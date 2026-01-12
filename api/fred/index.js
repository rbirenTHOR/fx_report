export default async function (context, req) {
  const path = req.params.path || '';
  const queryString = new URL(req.url).search;
  const fredUrl = `https://api.stlouisfed.org/fred/${path}${queryString}`;

  try {
    const response = await fetch(fredUrl);
    const data = await response.text();

    context.res = {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
      body: data,
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
