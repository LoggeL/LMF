/** GLSL for the Esse (WebGL2) [WP3]. Panel units: y 0‥1 bottom→top, x 0‥A. Linear colour; tone() → display. */
const HEAD = "#version 300 es\nprecision highp float;\n";

const RAMP = `uniform vec3 R[6];
vec3 ramp(float x){x=clamp(x,0.,1.)*5.;float i=min(floor(x),4.);int j=int(i);return mix(R[j],R[j+1],x-i);}
vec3 tone(vec3 c){return pow(1.-exp(-max(c,0.)),vec3(.4545));}
`;

const NOISE = `float h1(vec2 p){vec3 a=fract(p.xyx*.1031);a+=dot(a,a.yzx+33.33);return fract((a.x+a.y)*a.z);}
vec2 h2(vec2 p){vec3 a=fract(p.xyx*vec3(.1031,.103,.0973));a+=dot(a,a.yzx+33.33);return fract((a.xx+a.yz)*a.zy);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f*=f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+1.),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n2(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
`;

/** Full-screen triangle, attribute-less. */
export const TRI = HEAD + "out vec2 v;void main(){vec2 p=vec2(gl_VertexID&1,gl_VertexID>>1)*2.;v=p;gl_Position=vec4(p*2.-1.,0.,1.);}";

/** Heat (¼ res): R heat, G "was hot"; blur, rise, decay k.x, splats S. k.z = RGBA8 floor quantum. */
export const HEAT = HEAD + `in vec2 v;out vec4 o;uniform sampler2D T;uniform vec2 px;uniform vec3 k;uniform vec4 S[4];uniform float A;
void main(){vec2 u=v-vec2(0.,px.y*.6);
vec2 h=texture(T,u).rg*.36+(texture(T,u+vec2(px.x,0.)).rg+texture(T,u-vec2(px.x,0.)).rg+texture(T,u+vec2(0.,px.y)).rg+texture(T,u-vec2(0.,px.y)).rg)*.16;
h.r=max(h.r*k.x-k.z,0.);h.g=max(max(h.g*k.y-k.z,0.),h.r);
for(int i=0;i<4;i++){vec2 d=v-S[i].xy;d.x*=A;h.r+=S[i].w*exp(-dot(d,d)/(S[i].z*S[i].z));}
o=vec4(min(h,vec2(3.)),0.,1.);}`;

/** Sky → coal bed (Voronoi coals lit by the repo density D) → metal (billet↔logo SDF L) → flash → tone.
 *  G=(A,bedTop,margin,t) M=(logo cx,cy,hw,forge) K=(squash,temp,freeze,rest heat) F=(flash x,y,amount,-)
 *  rest heat: amber emissive floor on the lower edges and bevels of the cooled logo (gl/esse.js). */
export const MAIN = HEAD + RAMP + NOISE + `in vec2 v;out vec4 o;uniform sampler2D H,D,L;uniform vec4 G,M,K,F;uniform vec3 P[3];
vec3 vor(vec2 c){vec2 i=floor(c),f=fract(c);float a=8.,b=8.;vec2 id=i;
for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(x,y);vec2 r=g+h2(i+g)*.85-f;float d=dot(r,r);if(d<a){b=a;a=d;id=i+g;}else if(d<b)b=d;}
return vec3(sqrt(a),sqrt(b),h1(id*1.7));}
float sdb(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
float logo(vec2 q){vec2 u=vec2(.5+q.x*.4375,.5-q.y*.6731);vec2 e=max(abs(u-.5)-.5,0.);
return (.5-texture(L,clamp(u,0.,1.)).r)*.2857+length(e*vec2(2.286,1.486));}
float shape(vec2 q){float b=sdb(vec2(q.x+q.y*.12,q.y+.03),vec2(.62,.19),.07);return mix(b,logo(q),M.w);}
void main(){float A=G.x,bt=G.y,mg=G.z,t=G.w*(1.-K.z);
vec2 p=vec2(v.x*A,v.y);vec2 hs=texture(H,v).rg;float hp=hs.r;
float dens=texture(D,vec2(clamp((p.x-mg)/(A-2.*mg),0.,1.),.5)).r;
float dl=texture(D,vec2(clamp((M.x-mg)/(A-2.*mg),0.,1.),.5)).r;
float ab=max(p.y-bt,0.),hz=exp(-ab*5.5);
vec3 c=vec3(.0045,.0038,.0034)+ramp(.45)*dens*hz*.12+ramp(.3)*exp(-ab*1.4)*.025+ramp(.5)*hp*.02;
c+=ramp(.4)*smoothstep(.35,.9,fbm(p*vec2(2.6,1.3)-vec2(0.,t*.07)))*exp(-ab*2.2)*(.3+dens)*.05;
float xc=(p.x-A*.5)/(A*.5),top=bt+.035*(1.-xc*xc)+(fbm(vec2(p.x*6.,2.))-.5)*.045,dy=top-p.y;
if(dy>-.03){float dep=clamp(dy/top,0.,1.);
vec2 cc=vec2(p.x,dy*1.5)*mix(44.,20.,sqrt(dep));cc+=(vec2(fbm(cc*.2),fbm(cc*.2+7.))-.5)*2.6;
vec3 f=vor(cc);float edge=f.y-f.x,lump=1.-f.x;
float pk=smoothstep(.28,.8,fbm(vec2(p.x*5.,dy*8.)+vec2(0.,t*.04)));
float fl=.75+.5*fbm(vec2(p.x*3.+f.z*4.,t*.22));
float hl=clamp((.12+dens*.95)*(.35+.65*dep)*(.4+.95*pk)*fl+hp*.8,0.,1.6);
float rim=exp(-edge*mix(26.,9.,min(hl,1.)));
vec3 bed=vec3(.0028,.0026,.0025)*(.3+lump*.9);
bed+=ramp(.16+.5*hl)*rim*hl*1.25+ramp(.14+.3*hl)*smoothstep(.55,1.,lump)*hl*hl*step(.8,f.z)*.9;
bed*=.2+.8*smoothstep(-.03,.05,dy);
c=mix(c,bed,smoothstep(-.03,.006,dy));}
vec2 w=vec2(n2(p*vec2(7.,4.)-vec2(0.,t*1.3)),n2(p*vec2(6.,3.)+vec2(3.,-t*1.1)))-.5;
vec2 q=(p+w*.008*hz*(.5+dens)-M.xy)/M.z;q.y*=1.+K.x*1.6;q.x*=1.-K.x*.4;
float d=shape(q),aa=fwidth(d)*.8+1e-4,T=K.y+hp*.85,m=smoothstep(aa,-aa,d),lo=smoothstep(.3,-.75,q.y);
vec3 am=vec3(1.,.197,.023)*K.w*(.8+.4*n2(vec2(q.x*4.,t*.5)));
if(m>0.){vec2 e=vec2(.004,0.);vec2 g=vec2(shape(q+e.xy)-d,shape(q+e.yx)-d)/.004;
float bev=smoothstep(0.,.045,-d);vec3 n=normalize(vec3(g*(1.-bev)*1.3,1.));
vec3 Lc=normalize(vec3(.1,-.85,.5)),Lt=normalize(vec3(-.45,.75,.55)),r=reflect(vec3(0.,0.,-1.),n);
float br=fbm(vec2(q.x*1.4,q.y*70.)),dc=max(dot(n,Lc),0.),dt=max(dot(n,Lt),0.);
vec3 cl=ramp(.62)*(.3+.7*dl);
vec3 lit=vec3(.028,.029,.031)*(.85+.3*br)*(.3+dc*cl*3.+dt*vec3(.3,.31,.33))+pow(max(dot(r,Lc),0.),12.)*cl*1.2+pow(max(dot(r,Lt),0.),24.)*vec3(.34,.35,.38)*(.6+.4*br);
float s=clamp(q.x*.32+.5+(n2(q*5.)-.5)*.5,0.,1.);vec3 tc=s<.5?mix(P[0],P[1],s*2.):mix(P[1],P[2],s*2.-1.);
float band=smoothstep(.03,.08,T)*(1.-smoothstep(.2,.3,T));
lit+=tc*band*(.06+.1*bev)+am*lo*((1.-bev)*(1.+max(-n.y,0.)*2.)+.2);
vec3 em=ramp(min(T,1.)*(.7+.22*bev)+.04)*min(pow(clamp(T,0.,1.3),1.7)*2.6,1.5)*(.45+.55*bev+.35*dt*(1.-bev));
c=mix(c,mix(lit,em,clamp(T*2.4,0.,1.))+em*.35,m);}
c+=ramp(T*.85)*min(pow(clamp(T,0.,1.3),2.),.45)*exp(-max(d,0.)*38.)*smoothstep(.14,.07,d)*(1.-m)*1.2;
c+=am*lo*exp(-max(d,0.)*40.)*(1.-m)*.6;
vec2 fd=p-F.xy;c+=R[5]*F.z*exp(-dot(fd,fd)*36.)*2.5;
vec2 vg=(v-.5)*vec2(1.,.85);c*=1.-.5*dot(vg,vg);
o=vec4(tone(c*1.15)+(h1(gl_FragCoord.xy+fract(t*7.)*97.)-.5)*(2./255.),1.);}`;

/** Embers: one point per repo. a = (x, y, heat, seed). hv = hovered index. */
export const EMBER_V = HEAD + RAMP + `layout(location=0) in vec4 a;uniform vec4 G;uniform float s,hv;uniform sampler2D H;out vec3 c;out float r;
void main(){vec2 u=vec2(a.x/G.x,a.y);float hp=texture(H,u).r,hov=float(gl_VertexID)==hv?1.:0.;
float fl=1.+.16*sin(G.w*(1.1+a.w*1.7)+a.w*50.)*sin(G.w*.63+a.w*13.);
c=ramp(clamp(.4+.52*a.z+hp*.35,0.,1.))*(.8+1.6*a.z*a.z+hp*1.5+hov*1.2)*fl;r=hov;
gl_PointSize=(2.+3.2*a.z+hp*2.+hov*2.5)*s*3.5;gl_Position=vec4(u*2.-1.,0.,1.);}`;

export const EMBER_F = HEAD + RAMP + `in vec3 c;in float r;out vec4 o;
void main(){float l=length(gl_PointCoord*2.-1.)*3.5;
float e=max(0.,1.-l/3.5);vec3 col=c*(smoothstep(1.,.5,l)*1.6+exp(-l*l*.45)*e*e*.5)+r*smoothstep(.3,0.,abs(l-2.3))*vec3(1.,.75,.45);
o=vec4(tone(col),1.);}`;

/** Sparks: a = (x, y, life, tail). Lines fade towards the tail; heads drawn again as points. */
export const SPARK_V = HEAD + `layout(location=0) in vec4 a;uniform vec4 G;uniform float ps;out float l,k;
void main(){l=a.z;k=a.w;gl_PointSize=ps;gl_Position=vec4(a.x/G.x*2.-1.,a.y*2.-1.,0.,1.);}`;

export const SPARK_F = HEAD + RAMP + `in float l,k;out vec4 o;
void main(){float L=clamp(l,0.,1.);o=vec4(tone(ramp(.45+.55*L)*(1.1+3.2*L)*(1.-k*.93)),1.);}`;
