'use strict';

//console.assert(cs instanceof CSelect);
//cs.onchange=function(flags){
//console.assert(flags>0);
//if(flags&CSSEL){/*selected other item*/}
//if(flags&CSITEMS){/*amount or order of items changed*/}
//};

function CSelect(parent,items,itemstr,itemdefualt,onchange){
	(this.p=parent).innerHTML='<canvas class="cselcover"></canvas><div class="cselcover cselcover2" tabindex="0"><div class="cseltall"></div></div>';
	(this.s=parent.lastChild).addEventListener('scroll',this,passiveel);
	this.s.addEventListener('keydown',this,nonpassiveel);
	var t=this.s.firstChild;
	t.addEventListener('click',this,passiveel);
	this.ts=t.style;
	this.cont=(this.canv=parent.firstChild).getContext('2d',this.copts);
	this.w=this.h=this.oldlen=this.sel=-1;
	this.items=items;
	this.itemstr=itemstr;
 	this.itemdefualt=itemdefualt;
	this.onchange=onchange;
	if(!this.sel_grad){
		CSelect.prototype.sel_grad=this.cont.createLinearGradient(0,0,0,CSITEMHEIGHT);
		this.sel_grad.addColorStop(0,'rgb(100,50,100)');
		this.sel_grad.addColorStop(1,'rgb(50,0,50)');
	}
}

CSelect.prototype.copts={
	'alpha':false,
	'desynchronized':true,
	'colorSpace':'srgb',
	'willReadFrequently':false
};

CSelect.prototype.draw=function(){
	s=this.s.scrollTop;
	if(this.oldlen!==this.items.length){
		this.fixscroll();
		if(s!==this.s.scrollTop)return;
	}
	var p=this.p,w=Math.max(1,p.clientWidth),h=Math.max(1,p.clientHeight),dpr=window.devicePixelRatio||1,s;
	if(w!==this.w)this.canv.width=(this.w=w)*dpr;
	if(h!==this.h)this.canv.height=(this.h=h)*dpr;
	this.drawforreal(dpr,s);
};

CSelect.prototype.drawifdeformed=function(){
	var p=this.p,w=Math.max(1,p.clientWidth),h=Math.max(1,p.clientHeight),dpr,s;
	if(w!==this.w){
		dpr=window.devicePixelRatio||1;
		this.canv.width=(this.w=w)*dpr;
	}
	if(h!==this.h){
		if(!dpr)dpr=window.devicePixelRatio||1;
		this.canv.height=(this.h=h)*dpr;
	}
	if(!dpr)return;
	s=this.s.scrollTop;
	if(this.oldlen!==this.items.length){
		this.fixscroll();
		if(s!==this.s.scrollTop)return;
	}
	this.drawforreal(dpr,s);
};

CSelect.prototype.drawforreal=function(dpr,vy){
	var items=this.items,
		w=this.w,
		h=this.h,
		sel=this.sel,
		cap=Math.min(items.length,Math.ceil((vy+h)/CSITEMHEIGHT)),
		i=Math.floor(vy/CSITEMHEIGHT),
		i2=i,
		itemstr=this.itemstr,
		c=this.cont;
	c.setTransform(dpr,0,0,dpr,0,0);
	c.fillStyle='rgb(200,200,200)';
	c.fillRect(0,0,w,h);
	while(i<cap)if(i===sel){
		c.save();
		c.fillStyle=this.sel_grad;
		c.translate(0,i++*CSITEMHEIGHT-vy);
		c.fillRect(0,0,w,CSITEMHEIGHT);
		c.restore();
	}else{
		c.fillStyle=(i&1)?'rgb(210,210,210)':'rgb(220,220,220)';
		c.fillRect(0,i++*CSITEMHEIGHT-vy,w,CSITEMHEIGHT);
	}
	c.textBaseline='middle';
	c.font='16px monospace';
	c.fillStyle='rgb(50,0,50)';
	while(i2<cap)if(i2===sel){
		c.fillStyle='rgb(255,255,255)';
		c.fillText(itemstr(items[i2]),2,++i2*CSITEMHEIGHT-vy-CSITEMHEIGHTHALF);
		c.fillStyle='rgb(50,0,50)';
	}else c.fillText(itemstr(items[i2]),2,++i2*CSITEMHEIGHT-vy-CSITEMHEIGHTHALF);
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
		if(t<(s=s-this.h+CSITEMHEIGHT)){
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