export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({ok:true, service:'reactance-i-backend'});
    }
    if (request.method === 'POST' && url.pathname === '/notify') {
      const body = await request.json().catch(() => null);
      if (!body?.message) return Response.json({error:'message required'},{status:400});
      if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return Response.json({error:'notification secrets not configured'},{status:503});
      const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:env.TELEGRAM_CHAT_ID,text:`⚠️ REACTANCE I\n${body.message}`})});
      return new Response(await r.text(),{status:r.status,headers:{'content-type':'application/json'}});
    }
    return Response.json({error:'not found'},{status:404});
  }
};
