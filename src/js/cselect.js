'use strict';

//console.assert(cs instanceof CSelect);
//cs.onchange=function(flags){
//console.assert(flags>0);
//if(flags&CS_SEL){/*selected other item*/}
//if(flags&CS_ITEMS){/*amount or order of items changed*/}
//};

function CSelect(parent,items,itemstr,itemdefualt,onchange,ondblclick){
	parent.classList.add('csel');
	parent.addEventListener('scroll',this,passiveel);
	parent.addEventListener('keydown',this,nonpassiveel);
	parent.innerHTML='<div class="csel2" style="height:0px;padding-top:0px;"></div>';
	(this.itemsdiv=(this.p=parent).firstChild).addEventListener('click',this,passiveel);
	if(this.ondblclick=ondblclick)this.itemsdiv.addEventListener('dblclick',this,passiveel);
	this.itemsdivstyle=this.itemsdiv.getAttributeNode('style');
	this.h=this.sel=-1;
	this.scroll=this.min=this.size=0;
	this.items=items;
	this.itemstr=itemstr;
 	this.itemdefualt=itemdefualt;
	this.onchange=onchange;
}

CSelect.prototype.updateitemdivs=function(){
	var items=this.items,
		sel=this.sel,
		itemstr=this.itemstr,
		itemdiv=this.itemsdiv,
		itemdivs=itemdiv.childNodes,
		havedivs=itemdivs.length,
		i=this.min,min=i,
		cap=Math.min(min+this.size,items.length),
		needdivs=cap-min;
	if(havedivs<needdivs)do itemdiv.appendChild(CSelect.tdiv.cloneNode(true));while(++havedivs<needdivs);
	else if(havedivs>needdivs)do itemdiv.removeChild(itemdiv.lastChild);while(--havedivs>needdivs);
	while(i<cap){
		(itemdiv=itemdivs[i-min]).cseli=i;
		itemdiv.className=sel===i?'cselitem cselsel':i&1?'cselitem':'cselitem cselodd';
		itemdiv.firstChild.data=itemstr(items[i++]);
	}
};

CSelect.prototype.updatecss=function(){
	this.itemsdivstyle.value='height:'+this.items.length*CS_ITEM_HEIGHT+'px;padding-top:'+this.min*CS_ITEM_HEIGHT+'px;';
};

CSelect.prototype.updatemin=function(scroll){
	if(this.scroll!==scroll){
		var min=Math.max(Math.floor((this.scroll=scroll)/CS_ITEM_HEIGHT),0);
		if(this.min!==min){
			this.min=min;
			return true;
		}
	}
	return false;
};

CSelect.prototype.updateh=function(){
	if(this.h!==(h=this.p.clientHeight)){
		var s=Math.ceil((this.h=h)/CS_ITEM_HEIGHT)+1,olds=this.size,h;
		if(olds!==s&&((this.size=s)<(s=this.items.length)||olds<s)){
			if(this.updatemin(this.p.scrollTop))this.updatecss();
			this.updateitemdivs();
		}
	}
};

CSelect.prototype.updatelen=function(){
	this.updatecss();
	if(this.updatemin(this.p.scrollTop))this.updatecss();
	this.updateitemdivs();
};

CSelect.prototype.updatefull=function(){
	this.size=Math.ceil((this.h=this.p.clientHeight)/CS_ITEM_HEIGHT)+1;
	this.updatelen();
};

CSelect.prototype.handleEvent=function(event){
	switch(event.type){
		case 'scroll':
			if(this.updatemin(this.p.scrollTop)){
				this.updatecss();
				this.updateitemdivs();
			}
			return;
		case 'click':
			this.p.focus();
			var t=event.target.cseli;
			if('number'===typeof t&&t!==this.sel&&t<this.items.length){
				this.sel=t;
				this.updateitemdivs();
				this.onchange(CS_SEL);
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
			this.onchange(CS_SEL);
			return;
		case 'dblclick':
			if('number'===typeof event.target.cseli)this.ondblclick();
	}
};

CSelect.prototype.unsel=function(){
	if(this.sel>=0){
		this.sel=-1;
		this.updateitemdivs();
	}
};

CSelect.prototype.selinview=function(){
	var s=this.sel;
	if(s>=0&&(this.scroll>(s*=CS_ITEM_HEIGHT)||this.scroll<(s=s-this.h+CS_ITEM_HEIGHT))&&this.updatemin(this.p.scrollTop=s))this.updatecss();
	this.updateitemdivs();
};

CSelect.prototype.selinview2=function(){
	this.updatecss();
	var s=this.sel,t=this.p.scrollTop;
	if(s>=0&&(t>(s*=CS_ITEM_HEIGHT)||t<(s=s-this.h+CS_ITEM_HEIGHT)))this.p.scrollTop=t=s;
	if(this.updatemin(t))this.updatecss();
	this.updateitemdivs();
};

CSelect.prototype.swapup=function(){
	if(this.sel>0){
		var t=this.items[this.sel];
		this.items[this.sel]=this.items[--this.sel];
		this.items[this.sel]=t;
		this.selinview();
		this.onchange(CS_ITEMS);
	}
};

CSelect.prototype.swapdown=function(){
	if(this.sel>=0&&this.sel+1<this.items.length){
		var t=this.items[this.sel];
		this.items[this.sel]=this.items[++this.sel];
		this.items[this.sel]=t;
		this.selinview();
		this.onchange(CS_ITEMS);
	}
};

CSelect.prototype.del=function(){
	if(this.sel>=0){
		this.items.splice(this.sel,1);
		var l=this.items.length-1;
		if(this.sel>l)this.sel=l;
		this.selinview2();
		this.onchange(3);//CS_SEL|CS_ITEMS
	}
};

CSelect.prototype.dup=function(){
	if(this.sel>=0){
		this.items.splice(this.sel,0,JSON.parse(JSON.stringify(this.items[this.sel++])));
		this.selinview2();
		this.onchange(CS_ITEMS);
	}
};

CSelect.prototype.add=function(){
	if(this.items!==Array.prototype){
		this.items.splice(++this.sel,0,this.itemdefualt.slice());
		this.selinview2();
		this.onchange(3);//CS_SEL|CS_ITEMS
	}
};

CSelect.prototype.getsitem=function(){
	return this.sel<0?null:this.items[this.sel];
};

var cre=document.createElement.bind(document);

(CSelect.tdiv=cre('div')).className='cselitem';
CSelect.tdiv.appendChild(document.createTextNode(''));