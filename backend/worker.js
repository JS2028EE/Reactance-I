function corsHeaders(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'};}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json',...corsHeaders()}});}

export default {
  async fetch(request, env) {
    const url=new URL(request.url);
    if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
    if(request.method==='GET' && url.pathname==='/health') return json({ok:true,service:'reactance-i-notification-gateway'});
    if(request.method==='POST' && url.pathname==='/notify'){
      const auth=request.headers.get('Authorization')||'';
      if(!env.REACTANCE_DEVICE_KEY || auth !== `Bearer ${env.REACTANCE_DEVICE_KEY}`) return json({error:'unauthorized'},401);
      const body=await request.json().catch(()=>null);
      if(!body?.message) return json({error:'message required'},400);
      if(!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json({error:'notification secrets not configured'},503);
      const text=`⚠️ REACTANCE I\n${body.message}`;
      const telegram=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:env.TELEGRAM_CHAT_ID,text,disable_web_page_preview:true})});
      const result=await telegram.json().catch(()=>({}));
      return json({ok:telegram.ok,telegram:result},telegram.ok?200:502);
    }
    return json({error:'not found'},404);
  }
};
