/* מחולל מגנטים — דור פיינה צילום
   מסגרת נקייה (בלי השמות הישנים) + השמות והתאריך של הלקוח במקום המקורי → PNG ‏1800x1200 ו-1200x1800 */
const MG = (() => {
  const CREDIT = "DOR FAYNA PHOTOGRAPHY   |   050-2858162";
  const FONTS = {
    r: {n: '700 X "Frank Ruhl Libre",serif', d: '500 X "Frank Ruhl Libre",serif'},
    s: {n: '700 X "Amatic SC",cursive',      d: '700 X "Amatic SC",cursive'},
    b: {n: '400 X "Suez One",serif',         d: '500 X "Heebo",sans-serif'}
  };
  const loadImg = src => new Promise((ok,no) => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => ok(im); im.onerror = no; im.src = src; });

  async function fontsReady(){
    await Promise.all([
      '700 80px "Frank Ruhl Libre"','500 40px "Frank Ruhl Libre"','700 80px "Amatic SC"',
      '400 80px "Suez One"','500 40px "Heebo"','300 24px "Inter"'
    ].map(f => document.fonts.load(f, "אב12")));
  }

  /* שמות: "נועה & איתי" → ["נועה","איתי"] */
  function splitNames(s){
    s = (s || "").trim();
    let p = s.split(/\s*[&+]\s*/);
    if (p.length < 2){ const w = s.split(/\s+/); if (w.length === 2) p = w; }
    return p.length >= 2 ? [p[0], p.slice(1).join(" ")] : [s];
  }

  function fitText(ctx, text, tpl, maxW, maxH){
    let px = Math.max(8, Math.floor(maxH));
    for (; px > 8; px -= 1){ ctx.font = tpl.replace("X", px + "px"); if (ctx.measureText(text).width <= maxW) break; }
    return px;
  }
  function drawIn(ctx, text, tpl, box, color){
    if (!text) return;
    const [x,y,w,h] = box, px = fitText(ctx, text, tpl, w*1.08, h*1.05);
    ctx.font = tpl.replace("X", px + "px");
    ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "rtl";
    ctx.fillText(text, x + w/2, y + h/2 + px*0.04);
  }

  /* צבע ממוצע של רצועה בשולי המסגרת — למילוי השוליים כמו פספרטו */
  function edgeColor(img, side){
    const c = document.createElement("canvas"), s = 64; c.width = c.height = s;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0, s, s);
    const d = x.getImageData(0,0,s,s).data; let r=0,g=0,b=0,n=0;
    for (let yy=0; yy<s; yy++) for (let xx=0; xx<s; xx++){
      const edge = side === "lr" ? (xx < 2 || xx >= s-2) : (yy < 2 || yy >= s-2);
      const i = (yy*s+xx)*4; if (!edge || d[i+3] < 200) continue;
      r+=d[i]; g+=d[i+1]; b+=d[i+2]; n++;
    }
    return n ? `rgb(${r/n|0},${g/n|0},${b/n|0})` : "rgb(255,255,255)";
  }
  function contrastOn(rgb){
    const m = rgb.match(/\d+/g); if (!m) return "#555";
    const [r,g,b] = m.map(Number), l = (0.299*r + 0.587*g + 0.114*b);
    return l > 140 ? "rgb(" + [r,g,b].map(v => Math.round(v*0.45)).join(",") + ")" : "rgb(" + [r,g,b].map(v => Math.round(v + (255-v)*0.75)).join(",") + ")";
  }

  function credit(ctx, W, H, area, color, vertical){
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = .85;
    const px = Math.round(Math.min(W,H) * 0.02);
    ctx.font = "300 " + px + 'px "Inter",sans-serif'; ctx.direction = "ltr";
    ctx.letterSpacing = Math.round(px*0.16) + "px";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const [x,y,w,h] = area;
    if (vertical){ ctx.translate(x + w/2, y + h/2); ctx.rotate(-Math.PI/2); ctx.fillText(CREDIT, 0, 0); }
    else ctx.fillText(CREDIT, x + w/2, y + h/2);
    ctx.restore();
  }

  function render(frame, meta, W, H, d){
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d"); ctx.imageSmoothingQuality = "high";
    if (d.preview){ ctx.fillStyle = "#e9e5df"; ctx.fillRect(0,0,W,H); }
    const fw0 = frame.naturalWidth, fh0 = frame.naturalHeight;
    const r = Math.min(W/fw0, H/fh0), fw = fw0*r, fh = fh0*r, fx = (W-fw)/2, fy = (H-fh)/2;
    const side = fx >= fy ? "lr" : "tb", mat = edgeColor(frame, side);
    ctx.fillStyle = mat;
    if (side === "lr"){ ctx.fillRect(0,0,Math.ceil(fx)+1,H); ctx.fillRect(Math.floor(fx+fw)-1,0,W,H); }
    else { ctx.fillRect(0,0,W,Math.ceil(fy)+1); ctx.fillRect(0,Math.floor(fy+fh)-1,W,H); }
    ctx.drawImage(frame, fx, fy, fw, fh);
    const P = b => [fx + b[0]/100*fw, fy + b[1]/100*fh, (b[2]-b[0])/100*fw, (b[3]-b[1])/100*fh];
    const f = FONTS[meta.s] || FONTS.r, col = (d.color && readable(d.color, bgUnder(frame, meta.n.concat([meta.d])))) || meta.c || "#333333";
    const nm = splitNames(d.names);
    if (meta.n.length >= 2 && nm.length === 2){ drawIn(ctx, nm[0], f.n, P(meta.n[0]), col); drawIn(ctx, nm[1], f.n, P(meta.n[1]), col); }
    else {
      const box = meta.n.length >= 2
        ? [Math.min(meta.n[0][0],meta.n[1][0]), Math.min(meta.n[0][1],meta.n[1][1]), Math.max(meta.n[0][2],meta.n[1][2]), Math.max(meta.n[0][3],meta.n[1][3])]
        : meta.n[0];
      drawIn(ctx, nm.length === 2 ? nm[0] + " & " + nm[1] : nm[0], f.n, P(box), col);
    }
    drawIn(ctx, [d.date, d.extra].filter(Boolean).join("  ·  "), f.d, P(meta.d), col);
    const ink = contrastOn(mat);
    if (side === "lr" && fx > W*0.03) credit(ctx, W, H, [fx+fw, 0, W-(fx+fw), H], ink, true);
    else if (side === "tb" && fy > H*0.03) credit(ctx, W, H, [0, fy+fh, W, H-(fy+fh)], ink, false);
    return cv;
  }

  async function build({src, meta, names, date, extra, color}){
    await fontsReady();
    const frame = await loadImg(src);
    const d = {names, date, extra, color};
    return {land: render(frame, meta, 1800, 1200, d), port: render(frame, meta, 1200, 1800, d)};
  }

  /* PNG עם 600DPI (pHYs) */
  async function toPNG600(canvas){
    const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
    const buf = new Uint8Array(await blob.arrayBuffer());
    const ppm = Math.round(600/0.0254), chunk = new Uint8Array(21), dv = new DataView(chunk.buffer);
    dv.setUint32(0, 9); chunk.set([0x70,0x48,0x59,0x73], 4); dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1;
    let c = 0xffffffff; for (let i = 4; i < 17; i++){ c ^= chunk[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); }
    dv.setUint32(17, (c ^ 0xffffffff) >>> 0);
    const out = new Uint8Array(buf.length + 21); out.set(buf.subarray(0, 33)); out.set(chunk, 33); out.set(buf.subarray(33), 54);
    return new Blob([out], {type: "image/png"});
  }
  /* ---- צבעים ---- */
  const parse = c => (String(c).match(/\d+(\.\d+)?/g) || []).slice(0,3).map(Number);
  const hex = h => { h = h.replace("#",""); return [0,2,4].map(i => parseInt(h.substr(i,2),16)); };
  const rgbOf = c => /^#/.test(c) ? hex(c) : parse(c);
  const lum = ([r,g,b]) => { const f = v => { v /= 255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); }; return .2126*f(r) + .7152*f(g) + .0722*f(b); };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x,y)+.05) / (Math.min(x,y)+.05); };
  const css = a => "rgb(" + a.map(v => Math.round(v)).join(",") + ")";
  /* צבע הרקע מאחורי אזור הטקסט במסגרת */
  function bgUnder(img, boxes){
    const s = 120, c = document.createElement("canvas"); c.width = c.height = s;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0, s, s);
    const d = x.getImageData(0,0,s,s).data; let r=0,g=0,b=0,n=0;
    boxes.forEach(bx => {
      for (let yy = Math.floor(bx[1]/100*s); yy < Math.ceil(bx[3]/100*s); yy++)
        for (let xx = Math.floor(bx[0]/100*s); xx < Math.ceil(bx[2]/100*s); xx++){
          const i = (yy*s+xx)*4; if (d[i+3] < 200) continue; r+=d[i]; g+=d[i+1]; b+=d[i+2]; n++; }
    });
    return n ? [r/n, g/n, b/n] : [255,255,255];
  }
  /* שומרים על הגוון של ההזמנה, אבל מבטיחים שהטקסט קריא על רקע המסגרת */
  function readable(color, bg){
    let c = rgbOf(color); if (c.length < 3) return null;
    if (contrast(c, bg) >= 3) return css(c);
    const to = lum(bg) > .35 ? [0,0,0] : [255,255,255];
    for (let t = .1; t <= 1.001; t += .1){
      const m = c.map((v,i) => v + (to[i]-v)*t);
      if (contrast(m, bg) >= 3) return css(m);
    }
    return css(to);
  }
  /* צבע הדיו של ההזמנה: הרקע הוא הצבע הנפוץ ביותר, הדיו הוא הצבע הבולט שמנוגד לו */
  function inkColor(img){
    const s = 260, c = document.createElement("canvas"); c.width = c.height = s;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0, s, s);
    const d = x.getImageData(0,0,s,s).data, bins = {};
    for (let i = 0; i < d.length; i += 4){
      if (d[i+3] < 200) continue;
      const k = (d[i]>>4)+","+(d[i+1]>>4)+","+(d[i+2]>>4);
      const o = bins[k] || (bins[k] = {n:0,r:0,g:0,b:0});
      o.n++; o.r+=d[i]; o.g+=d[i+1]; o.b+=d[i+2];
    }
    const list = Object.values(bins).map(o => ({n:o.n, c:[o.r/o.n, o.g/o.n, o.b/o.n]})).sort((a,b) => b.n - a.n);
    if (!list.length) return null;
    const bg = list[0].c; let best = null, bw = 0;
    list.slice(1).forEach(o => {
      if (contrast(o.c, bg) < 2.5 || o.n < 4) return;
      const mx = Math.max(...o.c), mn = Math.min(...o.c), sat = mx ? (mx-mn)/mx : 0;
      const k = contrast(o.c, bg), w = o.n * (1 + sat*2) * k * k;
      if (w > bw){ bw = w; best = o.c; }
    });
    return best ? css(best) : null;
  }
  return {build, render, loadImg, fontsReady, toPNG600, splitNames, inkColor};
})();
