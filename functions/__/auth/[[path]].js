export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = `https://hr-website-6c387.firebaseapp.com${url.pathname}${url.search}`;

  const requestHeaders = new Headers(context.request.headers);
  requestHeaders.set('Host', 'hr-website-6c387.firebaseapp.com');

  const response = await fetch(targetUrl, {
    method: context.request.method,
    headers: requestHeaders,
    body: context.request.method !== 'GET' && context.request.method !== 'HEAD' ? context.request.body : undefined,
    redirect: 'follow'
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}
