'use strict';

//console.assert(cs instanceof CSelect);
//cs.onchange=function(flags){
//console.assert(flags>0);
//if(flags&1){/*selected other item*/}
//if(flags&2){/*amount or order of items changed*/}
//};

function CSelect(canvas,items,itemstr,itemdefualt,onchange){
	this.cont=(this.canv=canvas).getContext('2d',this.copts);
	this.p=canvas.parentNode;
	canvas.addEventListener('wheel',this,nonpassiveel);
	canvas.addEventListener('keydown',this,nonpassiveel);
	canvas.addEventListener('pointerdown',this,passiveel);
	canvas.addEventListener('pointermove',this,passiveel);
	canvas.addEventListener('pointerup',this,passiveel);
	canvas.addEventListener('pointercancel',this,passiveel);
	this.dragstartvy=this.dragstarty=this.scrollhandley=this.scrollhandleh=this.w=this.h=Number.NaN;
	this.sel=-1;
	this.vy=0;
	this.hasscrollbar=false;
	this.items=items;
	this.itemstr=itemstr;
 	this.itemdefualt=itemdefualt;
	this.onchange=onchange;
	this.scrollingpointerid=null;
	if(!this.sel_grad){
		CSelect.prototype.sel_grad=this.cont.createLinearGradient(0,0,0,this.itemheight);
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

CSelect.prototype.itemheight=24;

CSelect.prototype.draw=function(){
	var p=this.p,w=Math.max(1,p.clientWidth),h=Math.max(1,p.clientHeight),dpr=window.devicePixelRatio||1;
	if(w!==this.w)this.canv.width=(this.w=w)*dpr;
	if(h!==this.h)this.canv.height=(this.h=h)*dpr;
	this.cont.setTransform(dpr,0,0,dpr,0,0);
	this.drawforreal();
};

CSelect.prototype.drawifdeformed=function(){
	var p=this.p,w=Math.max(1,p.clientWidth),h=Math.max(1,p.clientHeight),dpr;
	if(w!==this.w){
		dpr=window.devicePixelRatio||1;
		this.canv.width=(this.w=w)*dpr;
	}
	if(h!==this.h){
		if(!dpr)dpr=window.devicePixelRatio||1;
		this.canv.height=(this.h=h)*dpr;
	}
	if(dpr){
		this.cont.setTransform(dpr,0,0,dpr,0,0);
		this.drawforreal();
	}
};

CSelect.prototype.drawforreal=function(){
	var c=this.cont,
		itemheight=this.itemheight,
		items=this.items,
		i2=items.length,
		aih=i2*itemheight,
		w=this.w,
		h=this.h,
		vy=this.vy=Math.max(0,Math.min(this.vy,aih-h)),
		sel=this.sel,
		cap=Math.min(i2,Math.ceil((vy+h)/itemheight)),
		i=i2=Math.floor(vy/itemheight),
		itemstr=this.itemstr;
	c.fillStyle='rgb(200,200,200)';
	c.fillRect(0,0,w,h);
	while(i<cap)if(i===sel){
		c.save();
		c.fillStyle=this.sel_grad;
		c.translate(0,i++*itemheight-vy);
		c.fillRect(0,0,w,itemheight);
		c.restore();
	}else{
		c.fillStyle=(i&1)?'rgb(210,210,210)':'rgb(220,220,220)';
		c.fillRect(0,i++*itemheight-vy,w,itemheight);
	}
	c.textBaseline='middle';
	c.font='16px monospace';
	while(i2<cap){
		c.fillStyle=i2===sel?'rgb(255,255,255)':'rgb(50,0,50)';
		c.fillText(itemstr(items[i2]),2,(0.5+i2++)*itemheight-vy);
	}
	if(this.hasscrollbar=aih>h&&h>16){
		c.fillStyle='rgb(190,190,190)';
		c.fillRect(w,0,-16,h);
		c.fillStyle='rgb(100,100,100)';
		this.scrollhandleh=i2=Math.max(16,h*h/aih);
		c.fillRect(w,this.scrollhandley=(h-i2)*vy/(aih-h),-16,i2);
	}
};

CSelect.prototype.handleEvent=function(event){
	switch(event.type){
		case 'wheel':
			if(event.ctrlKey||event.shiftKey||event.altKey||event.metaKey)return;
			event.preventDefault();
			switch(event.deltaMode){
				case 0:
					this.vy+=event.deltaY;
					break;
				case 1:
					this.vy+=event.deltaY*this.itemheight;
					break;
				case 2:
					this.vy+=event.deltaY*this.h;
					break;
				default:
					this.vy+=Math.sign(event.deltaY)*this.itemheight;
			}
			this.draw();
			return;
		case 'keydown':
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
			this.draw();
			this.onchange(1);
			return;
		case 'pointerdown':
			if(!this.hasscrollbar||event.offsetX<this.w-16){
				var t=Math.floor((event.offsetY+this.vy)/this.itemheight);
				if(t>=0&&t!==this.sel&&t<this.items.length){
					this.sel=t;
					this.draw();
					this.onchange(1);
				}
				return;
			}
			if(this.scrollingpointerid!==null)return;
			t=event.offsetY;
			if(t<this.scrollhandley){
				this.vy-=this.h/4;
				this.draw();
				return;
			}
			if(t>this.scrollhandley+this.scrollhandleh){
				this.vy+=this.h/4;
				this.draw();
				return;
			}
			this.canv.setPointerCapture(this.scrollingpointerid=event.pointerId);
			this.dragstarty=t;
			this.dragstartvy=this.vy;
			return;
		case 'pointermove':
			if(this.scrollingpointerid!==event.pointerId)return;
			if(!this.hasscrollbar){
				this.canv.releasePointerCapture(this.scrollingpointerid);
				this.scrollingpointerid=null;
				return;
			}
			this.vy=this.dragstartvy+(event.offsetY-this.dragstarty)*(this.items.length*this.itemheight-this.h)/(this.h-this.scrollhandleh);
			this.draw();
			return;
		default://case 'pointerup':case 'pointercancel':
			if(this.scrollingpointerid===event.pointerId)this.scrollingpointerid=null;
	}
};

CSelect.prototype.selinview=function(){
	this.vy=Math.max((this.sel+1)*this.itemheight-this.h,Math.min(this.sel*this.itemheight,this.vy));
};

CSelect.prototype.swapup=function(){
	if(this.sel>0){
		var t=this.items[this.sel];
		this.items[this.sel]=this.items[--this.sel];
		this.items[this.sel]=t;
		this.selinview();
		this.draw();
		this.onchange(2);
	}
};

CSelect.prototype.swapdown=function(){
	if(this.sel>=0&&this.sel+1<this.items.length){
		var t=this.items[this.sel];
		this.items[this.sel]=this.items[++this.sel];
		this.items[this.sel]=t;
		this.selinview();
		this.draw();
		this.onchange(2);
	}
};

CSelect.prototype.del=function(){
	if(this.sel>=0){
		this.items.splice(this.sel,1);
		var l=this.items.length-1;
		if(this.sel>l)this.sel=l;
		this.selinview();
		this.draw();
		this.onchange(3);
	}
};

CSelect.prototype.dup=function(){
	if(this.sel>=0){
		this.items.splice(this.sel,0,JSON.parse(JSON.stringify(this.items[this.sel++])));
		this.selinview();
		this.draw();
		this.onchange(2);
	}
};

CSelect.prototype.add=function(){
	if(this.items!==Array.prototype){
		this.items.splice(++this.sel,0,this.itemdefualt.slice());
		this.selinview();
		this.draw();
		this.onchange(3);
	}
};

CSelect.prototype.getsitem=function(){
	return this.sel<0?null:this.items[this.sel];
};