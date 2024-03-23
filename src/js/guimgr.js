'use strict';

var bodystyle=document.body.style,drag_arrow=document.getElementById('drag_arrow'),drag_cover=document.getElementById('drag_cover'),guis_div=document.getElementById('guis'),modals=document.getElementById('modals'),guis=[],passiveel=false,nonpassiveel=false,onceel=false,capel=true,no_support_once=true;

try{
	cre('div').addEventListener('passivetest',null,Object.create(null,{
		'passive':{
			'configurable':true,
			'enumerable':true,
			'get':function(){
				if(!onceel){
					passiveel={'passive':true,'once':false,'capture':false};
					nonpassiveel={'passive':false,'once':false,'capture':false};
					onceel={'passive':true,'once':true,'capture':false};
					capel={'passive':true,'once':false,'capture':true};
				}
				return false;
			}
		},
		'once':{
			'configurable':true,
			'enumerable':true,
			'get':function(){
				return no_support_once=this.passive;
			}
		}
	}));
}catch(error){
	console.warn('error detecting support for passive event listener:',error);
}

function set_loading(is_loading){
	document.documentElement.classList[is_loading?'add':'remove']('loading_cursor');
	if(tbd=current_gui().tbd){
		var i=tbd.length,tbd;
		while(i)tbd[--i].disabled=is_loading;
	}
}

function hide_drag_arrow(){
	drag_cover.style.display='none';
}

function handle_drag(e){
	var dt=current_gui().drop_file_input;
	if(!dt)return;
	var arr=e.dataTransfer.items,l=arr.length,i=0;
	while(l>i)if(arr[i++].kind==='file'){
		dt=dt.getBoundingClientRect();
		var y=(dt.top+dt.bottom)/2,x=(dt.left+dt.right)/2,ly=e.clientY-y,lx=e.clientX-x;
		drag_arrow.setAttribute('style','top:'+(y-2)+'px;left:'+x+'px;width:'+Math.hypot(ly,lx)+'px;transform:rotate('+Math.atan2(ly,lx)+'rad);');
		drag_cover.style.display='';
		e.preventDefault();
		return;
	}
}

drag_cover.addEventListener('dragleave',hide_drag_arrow,passiveel);
document.documentElement.addEventListener('dragenter',handle_drag,nonpassiveel);
drag_cover.addEventListener('dragover',handle_drag,nonpassiveel);
drag_cover.addEventListener('drop',function(e){
	var dt=current_gui().drop_file_input;
	if(!dt)return;
	hide_drag_arrow();
	var f=e.dataTransfer.files;
	if(!f.length)return;
	e.preventDefault();
	if(f.length===1)dt.files=f;
	else alert('dropped too many files');
},nonpassiveel);

function say_error(name,error){
	set_loading(false);
	name+=' error:\n';
	console.error(name,error);
	var g=current_gui().error_tag;
	if(g)g.textContent=name+error;
	else alert(name+error);
}

var cc_gzip_error=say_error.bind(null,'gzip');

function div_with_html(html){
	var div=cre('div');
	div.innerHTML=html;
	return div;
}

function current_gui(){
	return guis[guis.length-1];
}

function focus_current_gui(){
	current_gui().focus();
}

function show_modals(){
	bodystyle.overflow='hidden';
	modals.style.display='';
	guis_div.setAttribute('aria-hidden','true');
	guis_div.setAttribute('inert','');
	guis_div.addEventListener('focus',focus_current_gui,capel);
	focus_current_gui();
}

function hide_modals(){
	bodystyle.overflow='';
	modals.style.display='none';
	guis_div.setAttribute('aria-hidden','false');
	guis_div.removeAttribute('inert');
	guis_div.removeEventListener('focus',focus_current_gui,capel);
}

function push_gui(gui,modal){
	hide_drag_arrow();
	var prev_id=guis.push(gui)-2,lc;
	if(modal){
		gui.setAttribute('tabindex','0');
		gui.setAttribute('role','dialog');
		gui.setAttribute('aria-modal','true');
		modals.appendChild(gui);
		if(guis[prev_id].parentNode===guis_div)show_modals();
		return;
	}
	if(prev_id<0){
		guis_div.appendChild(gui);
		return;
	}
	if(guis[prev_id].parentNode===modals){
		if((lc=guis_div.lastChild).do_on_hide)lc.do_on_hide();
		guis_div.appendChild(gui);
		hide_modals();
		return;
	}
	guis_div.appendChild(gui);
	if((lc=guis[prev_id]).do_on_hide)lc.do_on_hide();
}

function pop_gui(){
	hide_drag_arrow();
	var gui=guis.pop(),prev_gui=current_gui();
	if(gui.parentNode===modals){
		modals.removeChild(gui);
		if(prev_gui.parentNode===guis_div)hide_modals();
		return;
	}
	guis_div.removeChild(gui);
	if(gui.dataset.reusable!=null)gui.do_on_hide();
	if((gui=guis_div.lastChild).handle_resize)setTimeout(gui.handle_resize,0);
	if(prev_gui.parentNode===modals)show_modals();
}

function toggler_onchange(){
	if(this.checked)this.parentNode.insertBefore(this.toggles_el,this.nextSibling);
	else this.parentNode.removeChild(this.toggles_el);
}

function add_toggler(el){
	var tog=cre('input');
	tog.type='checkbox';
	tog.addEventListener('change',toggler_onchange,passiveel);
	tog.toggles_el=el;
	tog.checked=true;
	return el.toggler=el.parentNode.insertBefore(tog,el);
}

function set_toggler_and_val(el,val){
	var tog=el.toggler;
	if(val.length>16384){
		if(tog.checked){
			tog.parentNode.removeChild(tog.toggles_el);
			tog.checked=false;
		}
		el.value=val;
	}else{
		el.value=val;
		if(!tog.checked){
			tog.parentNode.insertBefore(tog.toggles_el,tog.nextSibling);
			tog.checked=true;
		}
	}
}

var hstack=[];

function hcurr(){
	return hstack[hstack.length-1];
}

function hopen(tagname){
	var el=cre(tagname);
	hstack.push(el);
	return el;
}

function hclose(tagname){
	var el=hstack.pop(),sl=hstack.length;
	if(tagname){
		var t=el.tagName.toLowerCase();
		if(t!==tagname)console.warn('<%s>...</%s>',t,tagname);
	}
	if(sl)hstack[sl-1].appendChild(el);
	return el;
}

function htext(text){
	return hcurr().appendChild(document.createTextNode(text));
}

function hstyle(prop,val){
	hcurr().style.setProperty(prop,val,'');
}

function hbutton(value,onclick,eopts){
	var b=hopen('input');
	b.addEventListener('click',onclick,eopts||passiveel);
	b.type='button';
	b.value=value;
	return b;
}

function hfieldset(legend,help){
	var f=hopen('fieldset'),l=cre('legend');
	if(help){
		l.style.cursor='help';
		l.title=help;
	}
	l.textContent=legend;
	f.appendChild(l);
	return f;
}

function focus_element(e){
	e.focus();
}

window.addEventListener('resize',function(){
	var lc=guis_div.lastChild;
	if(lc.handle_resize)lc.handle_resize();
},passiveel);

function XSizer(par){
	var c=par.childNodes,s=this.s=cre('div');
	this.x=this.w=Number.NaN;
	this.p=par;
	(this.ps=par.style).setProperty('--prog','50%','');
	this.pointerid=null;
	s.className='XSizer';
	c[0].classList.add('XSizerA');
	c[1].classList.add('XSizerB');
	par.classList.add('XSizerContainer');
	s.addEventListener('pointerdown',this,passiveel);
	s.addEventListener('pointermove',this,passiveel);
	s.addEventListener('lostpointercapture',this,passiveel);
	par.appendChild(s);
}

XSizer.prototype.handleEvent=function(event){
	switch(event.type){
		case 'pointerdown':
			if(null===this.pointerid&&'mouse'===event.pointerType){
				this.s.setPointerCapture(this.pointerid=event.pointerId);
				var r=this.p.getBoundingClientRect();
				this.w=r.width;
				this.x=r.x;
			}
			return;
		case 'pointermove':
			if(event.pointerId===this.pointerid)this.ps.setProperty('--prog',this.get_prog(event.clientX),'');
			return;
		default://case 'lostpointercapture':
			if(event.pointerId===this.pointerid)this.pointerid=null;
	}
};

XSizer.prototype.get_prog=function(x){
	var prog=(x-this.x)*100/this.w;
	if(prog<=1)return '1%';
	if(prog>=99)return '99%';
	if(prog!==prog)return '50%';
	return prog.toFixed(0)+'%';
};

function AdvTextArea(parent,show){
	this.onchange=null;
	AdvTextArea.initselect();
	(c=this.select=AdvTextArea.select.cloneNode(true)).addEventListener('change',this,passiveel);
	var c=c.firstChild;
	this.chars=c.firstChild;
	this.showhide=c.nextSibling.firstChild;
	(this.parent=parent).appendChild(this.select).selectedIndex=0;
	(c=this.textarea=cre('textarea')).addEventListener('input',this,passiveel);
	if(show)this.addtextarea();else this.val='';
}

AdvTextArea.initselect=function(){
	AdvTextArea.initselect=Function.prototype;
	var s=AdvTextArea.select=cre('select');
	s.innerHTML='<option>0 characters</option>\
<option>show</option>\
<option>open in string editor</option>\
<option>open in object editor</option>\
<option>save file (ISO-8859-1)</option>\
<option>save file (UTF-8)</option>\
<option>load file (ISO-8859-1)</option>\
<option>load file (UTF-8)</option>\
<option>clear</option>';
	s.firstChild.firstChild.splitText(1);
};

AdvTextArea.prototype.getval=function(){
	return null===this.val?this.textarea.value:this.val;
};

AdvTextArea.prototype.setval=function(val){
	if(MAX_SHOW_CHARS<(this.chars.data=val.length)||-1!==val.indexOf('\r')){
		if(null===this.val)this.deltextarea();
		this.val=val;
	}else{
		this.textarea.value=val;
		if(null!==this.val)this.addtextarea();
	}
};

AdvTextArea.prototype.setvalchg=function(val){
	this.setval(val);
	if(this.onchange)this.onchange();
};

AdvTextArea.prototype.addtextarea=function(){
	this.parent.appendChild(this.textarea);
	this.val=null;
	this.showhide.data='hide';
};

AdvTextArea.prototype.deltextarea=function(){
	this.parent.removeChild(this.textarea);
	this.textarea.value='';
	this.showhide.data='show';
};

AdvTextArea.prototype.togsh=function(){
	if(null===(v=this.val)){
		this.val=this.textarea.value;
		this.deltextarea();
		return;
	}
	var b=MAX_SHOW_CHARS<v.length,l=-1!==v.indexOf('\r'),m,v;
	if(b||l){
		m='show? reasons to not show:';
		if(b)m+='\n  value is big ('+v.length+' characters), showing might freeze browser';
		if(l)m+='\n  value contains \\r, showing will not preserve those';
		if(!confirm(m))return;
		this.textarea.value=v;
		if(l){
			this.chars.data=this.textarea.value.length;
			if(this.onchange)this.onchange();
		}
	}else this.textarea.value=v;
	this.addtextarea();
};

AdvTextArea.prototype.saveraw=function(){
	var u=URL.createObjectURL(new Blob([string_to_uint8array(this.getval())],binblobopts)),a;
	setTimeout(URL.revokeObjectURL,0,u);
	(a=cre('a')).href=u;
	a.download='ISO-8859-1';
	a.style.display='none';
	this.parent.appendChild(a);
	a.click();
	this.parent.removeChild(a);
};

AdvTextArea.prototype.saveutf=function(){
	var u=URL.createObjectURL(new Blob([string_to_uint8array(unescape(encodeURIComponent(this.getval())))],binblobopts)),a;
	setTimeout(URL.revokeObjectURL,0,u);
	(a=cre('a')).href=u;
	a.download='UTF-8';
	a.style.display='none';
	this.parent.appendChild(a);
	a.click();
	this.parent.removeChild(a);
};

AdvTextArea.prototype.handleEvent=function(e){
	if(this.textarea===e.target){
		this.chars.data=this.getval().length;
		if(this.onchange)this.onchange();
		return;
	}
	var i=this.select.selectedIndex;
	this.select.selectedIndex=0;
	switch(i){
		case 1:
			this.togsh();
			return;
		case 2:
			string_editor(this.setvalchg.bind(this),this.getval());
			return;
		case 3:
			try{
				new ObjEditor(this.getval(),this.setvalchg.bind(this));
			}catch(error){
				say_error('object editor',error);
			}
			return;
		case 4:
			try{
				this.saveraw();
			}catch(error){
				say_error('save file (ISO-8859-1)',error);
			}
			return;
		case 5:
			try{
				this.saveutf();
			}catch(error){
				say_error('save file (UTF-8)',error);
			}
			return;
		case 6:
			new AdvFileLoader(true,this);
			return;
		case 7:
			new AdvFileLoader(false,this);
			return;
		case 8:
			this.chars.data='0';
			this.textarea.value='';
			if(null!==this.val)this.addtextarea();
			if(this.onchange)this.onchange();
	}
};

function AdvFileLoader(raw,out){
	this.raw=raw;
	this.out=out;
	var i=cre('input');
	i.type='file';
	i.addEventListener('change',this,onceel);
	try{
		if(i.showPicker)i.showPicker();
		else i.click();
	}catch(error){
		say_error('open file picker',error);
	}
}

AdvFileLoader.prototype.handleEvent=function(e){
	switch(e.type){
		case 'load':
			if(this.raw){
				this.out.setvalchg(e.target.result);
				set_loading(false);
				return;
			}
			var r=this.out;
			utf8to16(AdvFileLoader.utf8to16_callback.bind(this.out),Function.prototype,new Uint8Array(e.target.result),'',0);
			return;
		case 'error':
			say_error('FileReader',e.target.error);
			return;
		default://case 'change':
			if(e=e.target.files[0]){
				set_loading(true);
				try{
					r=new FileReader();
					r.addEventListener('load',this,onceel);
					r.addEventListener('error',this,onceel);
					r[this.raw?'readAsBinaryString':'readAsArrayBuffer'](e);
				}catch(error){
					say_error('FileReader',error);
				}
			}
	}
};

AdvFileLoader.utf8to16_callback=function(str){
	this.setvalchg(str);
	set_loading(false);
};