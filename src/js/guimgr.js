'use strict';

var body=document.body,drag_arrow=document.getElementById('drag_arrow'),drag_cover=document.getElementById('drag_cover'),guis_div=document.getElementById('guis'),modals=document.getElementById('modals'),guis=[],modal_style='margin:auto;overflow:auto;max-width:calc(100% - 20px);max-height:calc(100% - 20px);border:2px solid rgb(50,0,50);background-color:rgb(200,200,200);padding:8px;border-radius:8px;contain:content;',cre=document.createElementNS.bind(document,'http://www.w3.org/1999/xhtml'),passiveel=false,nonpassiveel=false,onceel=false,capel=true,no_support_once=true;

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
	try{
		document.documentElement.classList[is_loading?'add':'remove']('loading_cursor');
	}catch(error){}
}

function hide_drag_arrow(){
	drag_cover.setAttribute('style','display:none;');
}

function handle_drag(e){
	var dt=current_gui().drop_file_input;
	if(!dt)return;
	var arr=e.dataTransfer.items,l=arr.length,i=0;
	while(l>i)if(arr[i++].kind==='file'){
		dt=dt.getBoundingClientRect();
		var y=(dt.top+dt.bottom)/2,x=(dt.left+dt.right)/2,ly=e.clientY-y,lx=e.clientX-x;
		drag_arrow.setAttribute('style','top:'+(y-2)+'px;left:'+x+'px;width:'+Math.hypot(ly,lx)+'px;transform:rotate('+Math.atan2(ly,lx)+'rad);');
		drag_cover.setAttribute('style','');
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

function tbd_set_disabled(d){
	set_loading(d);
	var tbd=current_gui().tbd,i=tbd.length;
	while(i)tbd[--i].disabled=d;
}

function say_error(name,error){
	var g=current_gui();
	(g.tbd?tbd_set_disabled:set_loading)(false);
	name+=' error:\n\n';
	console.error(name,error);
	if(g=g.error_tag)g.textContent=name+error;
	else alert(name+error);
}

var cc_gzip_error=say_error.bind(null,'gzip');

function gui_div_with_html(is_modal,html){
	var div=cre('div');
	div.innerHTML=html;
	if(is_modal)div.dataset.isModal=typeof is_modal==='string'?is_modal:'';
	return div;
}

function current_gui(){
	return guis[guis.length-1];
}

function focus_current_gui(){
	current_gui().focus();
}

function show_modals(){
	body.setAttribute('style','overflow:hidden;');
	modals.setAttribute('style','position:fixed;left:0;top:0;right:0;bottom:0;background-color:rgba(50,0,50,.25);display:flex;contain:strict;');
	guis_div.setAttribute('style','pointer-events:none;-moz-user-select:none;-webkit-user-select:none;user-select:none;');
	guis_div.setAttribute('aria-hidden','true');
	guis_div.setAttribute('inert','');
	guis_div.addEventListener('focus',focus_current_gui,capel);
	focus_current_gui();
}

function hide_modals(){
	body.setAttribute('style','');
	modals.setAttribute('style','display:none;');
	guis_div.setAttribute('style','');
	guis_div.setAttribute('aria-hidden','false');
	guis_div.removeAttribute('inert');
	guis_div.removeEventListener('focus',focus_current_gui,capel);
}

function push_gui(gui){
	hide_drag_arrow();
	var prev_id=guis.push(gui)-2,mcss=gui.dataset.isModal,lc;
	if(mcss!=null){
		if(lc=modals.lastChild)lc.setAttribute('style','display:none;');
		gui.setAttribute('style',modal_style+mcss);
		gui.setAttribute('tabindex','0');
		gui.setAttribute('role','dialog');
		gui.setAttribute('aria-modal','true');
		modals.appendChild(gui);
		if(guis[prev_id].dataset.isModal==null)show_modals();
		return;
	}
	if(prev_id<0){
		guis_div.appendChild(gui);
		return;
	}
	if(guis[prev_id].dataset.isModal!=null){
		lc=guis_div.lastChild;
		if(lc.do_before_hide)lc.do_before_hide();
		lc.setAttribute('style','display:none;');
		guis_div.appendChild(gui);
		hide_modals();
		return;
	}
	guis_div.appendChild(gui);
	lc=guis[prev_id];
	if(lc.do_before_hide)lc.do_before_hide();
	lc.setAttribute('style','display:none;');
}

function pop_gui(){
	hide_drag_arrow();
	var gui=guis.pop(),prev_gui=current_gui(),prev_modal=prev_gui.dataset.isModal;
	if(gui.dataset.isModal!=null){
		modals.removeChild(gui);
		if(prev_modal!=null)prev_gui.setAttribute('style',modal_style+prev_modal);
		else hide_modals();
		return;
	}
	if(gui.dataset.reusable!=null)gui.do_before_hide();
	guis_div.removeChild(gui);
	if((gui=guis_div.lastChild).handle_resize)setTimeout(gui.handle_resize,0);
	if(prev_modal!=null){
		prev_gui.setAttribute('style',modal_style+prev_modal);
		show_modals();
		guis_div.lastChild.setAttribute('style','');
		return;
	}
	prev_gui.setAttribute('style','');
}

function input_in_fieldset(append_to,fieldset_legend,input_type,fstyle){
	var f=append_to.appendChild(cre('fieldset'));
	if(fstyle)f.setAttribute('style',fstyle);
	f.appendChild(cre('legend')).textContent=fieldset_legend;
	f=f.appendChild(cre('input'));
	f.type=input_type;
	return f;
}

function textarea_in_fieldset(append_to,fieldset_legend,fstyle){
	var f=append_to.appendChild(cre('fieldset'));
	if(fstyle)f.setAttribute('style',fstyle);
	f.appendChild(cre('legend')).textContent=fieldset_legend;
	return f.appendChild(cre('textarea'));
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

function hattr(attr,val){
	hcurr().setAttribute(attr,val);
}

function hset(prop,val){
	hcurr()[prop]=val;
}

function hbutton(value,onclick,eopts){
	var b=hopen('input');
	b.addEventListener('click',onclick,eopts||passiveel);
	b.type='button';
	b.value=value;
	return b;
}

function hfieldset(legend){
	hopen('fieldset');
	hopen('legend').textContent=legend;
	hclose();
}

function focus_element(e){
	e.focus();
}

window.addEventListener('resize',function(){
	var lc=guis_div.lastChild;
	if(lc.handle_resize)lc.handle_resize();
},passiveel);

function XSizer(par,onsize){
	var c=par.childNodes,s=this.s=cre('div');
	this.onsize=onsize;
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
	s.addEventListener('pointerup',this,passiveel);
	s.addEventListener('pointercancel',this,passiveel);
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
			if(event.pointerId===this.pointerid){
				if((r=this.get_prog(event.clientX))!==this.ps.getPropertyValue('--prog')){
					this.ps.setProperty('--prog',r,'');
					if(this.onsize)this.onsize();
				}
			}
			return;
		default://case 'pointerup':case 'pointercancel':
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