# Draws the original diagrams in assets/images/diagram-*.jpg. Run: python3 tools/diagrams.py, then
# convert each SVG to JPEG (macOS: qlmanage -t -s 600 -o . *.svg, then sips -s format jpeg).
F='font-family="Helvetica, Arial, sans-serif"'
INK='#171717'; BLUE='#01AAE5'; MUTED='#8a8a8a'; LIGHT='#e6f6fc'
def svg(body): return f'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="#ffffff"/>{body}</svg>'
def chip(x,y,w,label,fill=LIGHT,stroke=BLUE,tc=INK,size=26):
    return f'<rect x="{x}" y="{y}" width="{w}" height="56" rx="10" fill="{fill}" stroke="{stroke}" stroke-width="3"/><text x="{x+w/2}" y="{y+37}" {F} font-size="{size}" text-anchor="middle" fill="{tc}">{label}</text>'
out={}
# Token
b=f'<text x="300" y="90" {F} font-size="30" text-anchor="middle" fill="{MUTED}">"Unbelievable design"</text>'
b+=f'<path d="M300 115 v40" stroke="{INK}" stroke-width="3"/><path d="M288 145 l12 14 l12 -14" fill="none" stroke="{INK}" stroke-width="3"/>'
b+=chip(40,190,110,'Un')+chip(160,190,140,'believ')+chip(310,190,110,'able')+chip(430,190,130,' design')
for x,w,n in [(40,110,'1844'),(160,140,'32017'),(310,110,'481'),(430,130,'2770')]:
    b+=f'<text x="{x+w/2}" y="290" {F} font-size="22" text-anchor="middle" fill="{MUTED}">{n}</text>'
b+=f'<text x="300" y="380" {F} font-size="28" text-anchor="middle" fill="{INK}">2 words → 4 tokens</text>'
b+=f'<text x="300" y="425" {F} font-size="22" text-anchor="middle" fill="{MUTED}">The model reads the numbered pieces,</text><text x="300" y="455" {F} font-size="22" text-anchor="middle" fill="{MUTED}">not whole words. (Illustrative split.)</text>'
out['token']=svg(b)
# Next token
b=f'<text x="60" y="100" {F} font-size="34" fill="{INK}">The sky is</text><rect x="232" y="72" width="22" height="36" fill="{BLUE}" opacity="0.6"/>'
rows=[('blue',0.62),('clear',0.21),('grey',0.09),('falling',0.04),('purple',0.02)]
for i,(w,p) in enumerate(rows):
    y=170+i*70
    b+=f'<text x="60" y="{y+30}" {F} font-size="28" fill="{INK}">{w}</text>'
    b+=f'<rect x="200" y="{y}" width="{int(300*p/0.62)}" height="40" rx="6" fill="{BLUE if i==0 else "#b8e6f7"}"/>'
    b+=f'<text x="{210+int(300*p/0.62)}" y="{y+29}" {F} font-size="24" fill="{MUTED}">{int(p*100)}%</text>'
b+=f'<text x="300" y="545" {F} font-size="22" text-anchor="middle" fill="{MUTED}">Pick a likely next token, add it, repeat.</text>'
out['next-token']=svg(b)
# Context window
b=''
msgs=['Brief: brand is calm','Use 8px grid','Tone: friendly','Audience: nurses','Make it shorter','Add a CTA','Try dark mode']
for i,m in enumerate(msgs):
    y=40+i*72; inside = i>=3
    b+=f'<rect x="80" y="{y}" width="440" height="54" rx="10" fill="{"#ffffff" if inside else "#f2f2f2"}" stroke="{"#cfcfcf"}" stroke-width="2"/>'
    b+=f'<text x="104" y="{y+35}" {F} font-size="24" fill="{INK if inside else "#b5b5b5"}">{m}</text>'
b+=f'<rect x="60" y="246" width="480" height="300" rx="16" fill="none" stroke="{BLUE}" stroke-width="5"/>'
b+=f'<text x="540" y="236" {F} font-size="22" text-anchor="end" fill="{BLUE}">context window</text>'
b+=f'<text x="540" y="580" {F} font-size="21" text-anchor="end" fill="{MUTED}">Older messages fall outside and are forgotten.</text>'
out['context-window']=svg(b)
# Temperature
def bars(x0,title,ps):
    s=f'<text x="{x0+110}" y="80" {F} font-size="28" text-anchor="middle" fill="{INK}">{title}</text>'
    for i,p in enumerate(ps):
        h=int(360*p); s+=f'<rect x="{x0+i*44}" y="{470-h}" width="34" height="{h}" rx="5" fill="{BLUE if i==0 else "#b8e6f7"}"/>'
    s+=f'<line x1="{x0-6}" y1="472" x2="{x0+222}" y2="472" stroke="#cfcfcf" stroke-width="3"/>'
    return s
b=bars(50,'Low temperature',[0.85,0.1,0.03,0.015,0.005])+bars(330,'High temperature',[0.3,0.25,0.2,0.15,0.1])
b+=f'<text x="160" y="515" {F} font-size="22" text-anchor="middle" fill="{MUTED}">predictable</text><text x="440" y="515" {F} font-size="22" text-anchor="middle" fill="{MUTED}">surprising</text>'
b+=f'<text x="300" y="570" {F} font-size="21" text-anchor="middle" fill="{MUTED}">Same choices, different odds for the next token.</text>'
out['temperature']=svg(b)
# Hallucination
b=f'<rect x="70" y="80" width="460" height="300" rx="16" fill="#fafafa" stroke="#cfcfcf" stroke-width="3"/>'
b+=f'<text x="100" y="140" {F} font-size="24" fill="{MUTED}">The assistant says:</text>'
b+=f'<text x="100" y="195" {F} font-size="28" fill="{INK}">"As shown in Rivera et al.</text><text x="100" y="235" {F} font-size="28" fill="{INK}">(2021), Journal of Color</text><text x="100" y="275" {F} font-size="28" fill="{INK}">Science, users prefer…"</text>'
b+=f'<rect x="100" y="305" width="250" height="44" rx="22" fill="#fde8e8"/><text x="225" y="335" {F} font-size="22" text-anchor="middle" fill="#b42318">Source not found</text>'
b+=f'<text x="300" y="455" {F} font-size="28" text-anchor="middle" fill="{INK}">Confident ≠ correct</text>'
b+=f'<text x="300" y="500" {F} font-size="22" text-anchor="middle" fill="{MUTED}">It writes what sounds plausible, not what</text><text x="300" y="530" {F} font-size="22" text-anchor="middle" fill="{MUTED}">it checked. Show sources; make checking easy.</text>'
out['hallucination']=svg(b)
# Human in the loop
def box(x,y,w,label,sub,fill='#ffffff',stroke='#cfcfcf'):
    return f'<rect x="{x}" y="{y}" width="{w}" height="110" rx="14" fill="{fill}" stroke="{stroke}" stroke-width="3"/><text x="{x+w/2}" y="{y+48}" {F} font-size="26" text-anchor="middle" fill="{INK}">{label}</text><text x="{x+w/2}" y="{y+82}" {F} font-size="20" text-anchor="middle" fill="{MUTED}">{sub}</text>'
b=box(40,120,150,'AI drafts','an email')+box(225,120,150,'You review','edit or stop',LIGHT,BLUE)+box(410,120,150,'Then send','only if approved')
for x in (190,375):
    b+=f'<path d="M{x+4} 175 h28" stroke="{INK}" stroke-width="3"/><path d="M{x+24} 167 l10 8 l-10 8" fill="none" stroke="{INK}" stroke-width="3"/>'
b+=f'<rect x="150" y="320" width="300" height="70" rx="12" fill="{INK}"/><text x="300" y="364" {F} font-size="26" text-anchor="middle" fill="#ffffff">Review and send</text>'
b+=f'<text x="300" y="460" {F} font-size="22" text-anchor="middle" fill="{MUTED}">A person approves actions that are</text><text x="300" y="490" {F} font-size="22" text-anchor="middle" fill="{MUTED}">hard to undo. Where that step sits</text><text x="300" y="520" {F} font-size="22" text-anchor="middle" fill="{MUTED}">is a design decision.</text>'
out['human-in-the-loop']=svg(b)
for k,v in out.items(): open(k+'.svg','w').write(v)
print(list(out))
