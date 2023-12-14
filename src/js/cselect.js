'use strict';

//console.assert(cs instanceof CSelect);
//cs.onchange=function(flags){
//console.assert(flags>0);
//if(flags&CSSEL){/*selected other item*/}
//if(flags&CSITEMS){/*amount or order of items changed*/}
//};

function CSelect(parent,items,itemstr,itemdefualt,onchange){
	(this.p=parent).innerHTML='<canvas class="cselcover cselcanvas"></canvas><div class="cselcover cselcover2" tabindex="0"><div class="cseltall"></div></div>';
	(this.s=parent.lastChild).addEventListener('scroll',this,passiveel);
	this.s.addEventListener('keydown',this,nonpassiveel);
	var t=this.s.firstChild;
	t.addEventListener('click',this,passiveel);
	this.ts=t.style;
	this.cont=(this.canv=parent.firstChild).getContext('2d',this.copts);
	this.m=this.rw=this.rh=this.cw=this.ch=this.oldlen=this.sel=-1;
	this.items=items;
	this.itemstr=itemstr;
 	this.itemdefualt=itemdefualt;
	this.onchange=onchange;
	if(!this.selgrad){
		(CSelect.prototype.selgrad=this.cont.createLinearGradient(0,0,0,1)).addColorStop(0,'rgb(100,50,100)');
		this.selgrad.addColorStop(1,'rgb(50,0,50)');
	}
}

CSelect.prototype.copts={
	'alpha':false,
	'desynchronized':true,
	'colorSpace':'srgb',
	'willReadFrequently':false
};

CSelect.prototype.draw=function(){
	var s=this.s.scrollTop;
	if(this.oldlen!==this.items.length){
		this.fixscroll();
		if(s!==this.s.scrollTop)return;
	}
	this.drawforreal(s);
};

CSelect.prototype.drawifdeformed=function(){
	var w=this.p.clientWidth,h=this.p.clientHeight,m=window.devicePixelRatio||1,s;
	if(m===this.m){
		s=true;
		if(w!==this.cw){
			s=false;
			this.canv.width=this.rw=Math.round((this.cw=w)*m)||1;
		}
		if(h!==this.ch){
			s=false;
			this.canv.height=this.rh=Math.round((this.ch=h)*m)||1;
		}
		if(s)return;
	}else{
		this.m=m;
		this.canv.width=this.rw=Math.round((this.cw=w)*m)||1;
		this.canv.height=this.rh=Math.round((this.ch=h)*m)||1;
	}
	s=this.s.scrollTop;
	if(this.oldlen!==this.items.length){
		this.fixscroll();
		if(s!==this.s.scrollTop)return;
	}
	this.drawforreal(s);
};

CSelect.prototype.drawforreal=function(vy){
	var items=this.items,
		w=this.rw,
		h=this.rh,
		sel=this.sel+1,
		is=this.itemstr,
		c=this.cont,
		m=this.m,
		ih=m*CSITEMHEIGHT,
		o=vy%CSITEMHEIGHT*m,
		i=Math.floor(vy/CSITEMHEIGHT),
		cap=Math.min(Math.ceil((o+h)/ih)+i,items.length),
		i2=i,
		y,y2;
	if(items.length*ih<h){
		c.fillStyle=CSBGCOLOR;
		c.fillRect(0,0,w,h);
		c.fillStyle=CSODDCOLOR;
		c.fillRect(0,0,w,Math.round((cap-i)*ih-o));
	}else{
		c.fillStyle=CSODDCOLOR;
		c.fillRect(0,0,w,h);
	}
	c.fillStyle=CSEVENCOLOR;
	y2=Math.round(-o);
	i2=i;
	while(i<cap){
		y=y2;
		y2=Math.round((++i-i2)*ih-o);
		if(i===sel){
			c.setTransform(1,0,0,y2-y,0,y);
			c.fillStyle=this.selgrad;
			c.fillRect(0,0,w,1);
			c.fillStyle=CSEVENCOLOR;
			c.setTransform(1,0,0,1,0,0);
		}else if(i&1)c.fillRect(0,y,w,y2-y);
	}
	c.fillStyle=CSTXTCOLOR;
	c.fontKerning='none';
	c.textRendering='optimizeSpeed';
	c.textBaseline='middle';
	c.font=Math.round(m*CSTXTFONT)+'px monospace';
	--sel;
	i=i2;
	while(i<cap)if(i===sel){
		c.fillStyle=CSTXTSELCOLOR;
		c.fillText(is(items[i]),CSTXTLEFT,Math.round((++i-i2-.5)*ih-o));
		c.fillStyle=CSTXTCOLOR;
	}else c.fillText(is(items[i]),CSTXTLEFT,Math.round((++i-i2-.5)*ih-o));
};

CSelect.prototype.handleEvent=function(event){
	switch(event.type){
		case 'scroll':
			this.draw();
			return;
		case 'click':
			var t=Math.floor(event.offsetY/CSITEMHEIGHT);
			if(t>=0&&t!==this.sel&&t<this.items.length){
				this.sel=t;
				this.draw();
				this.onchange(CSSEL);
			}
			return;
		default://case 'keydown':
			keysw:switch(event.code){
				case 'ArrowUp':
					event.preventDefault();
					switch(this.items.length){
						case 1:
							if(this.sel!==(this.sel=0))break keysw;
						case 0:
							return;
						default:
							this.sel=(this.sel<1?this.items.length:this.sel)-1;
							break keysw;
					}
				case 'ArrowDown':
					event.preventDefault();
					switch(this.items.length){
						case 1:
							if(this.sel!==(this.sel=0))break keysw;
						case 0:
							return;
						default:
							this.sel=(this.sel+1)%this.items.length;
							break keysw;
					}
				default:
					return;
			}
			this.selinview();
			this.onchange(CSSEL);
	}
};

CSelect.prototype.fixscroll=function(){
	this.ts.height=(this.oldlen=this.items.length)*CSITEMHEIGHT+'px';
};

CSelect.prototype.selinview=function(){
	var s=this.sel,t;
	if(s>=0){
		if((t=this.s.scrollTop)>(s*=CSITEMHEIGHT)){
			this.s.scrollTop=s;
			return;
		}
		if(t<(s=s-this.ch+CSITEMHEIGHT)){
			this.s.scrollTop=s;
			return;
		}
	}
	this.draw();
};

CSelect.prototype.swapup=function(){
	if(this.sel>0){
		var t=this.items[this.sel];
		this.items[this.sel]=this.items[--this.sel];
		this.items[this.sel]=t;
		this.selinview();
		this.onchange(CSITEMS);
	}
};

CSelect.prototype.swapdown=function(){
	if(this.sel>=0&&this.sel+1<this.items.length){
		var t=this.items[this.sel];
		this.items[this.sel]=this.items[++this.sel];
		this.items[this.sel]=t;
		this.selinview();
		this.onchange(CSITEMS);
	}
};

CSelect.prototype.del=function(){
	if(this.sel>=0){
		this.items.splice(this.sel,1);
		var l=this.items.length-1;
		if(this.sel>l)this.sel=l;
		this.fixscroll();
		this.selinview();
		this.onchange(3);//CSSEL|CSITEMS
	}
};

CSelect.prototype.dup=function(){
	if(this.sel>=0){
		this.items.splice(this.sel,0,JSON.parse(JSON.stringify(this.items[this.sel++])));
		this.fixscroll();
		this.selinview();
		this.onchange(CSITEMS);
	}
};

CSelect.prototype.add=function(){
	if(this.items!==Array.prototype){
		this.items.splice(++this.sel,0,this.itemdefualt.slice());
		this.fixscroll();
		this.selinview();
		this.onchange(3);//CSSEL|CSITEMS
	}
};

CSelect.prototype.getsitem=function(){
	return this.sel<0?null:this.items[this.sel];
};