'use strict';

function ObjEditor(string,write){
	var objs_arr=this.parse_string(string);
	this.write=write;
	ObjEditor.init_prop_display();
	for(var gui=div_with_html(
'<div style="display:flex;overflow:hidden;contain:content;">\
<input type="button" value="back" style="flex:1;"/>\
<input type="button" value="back (no write)" style="flex:1;"/>\
</div>\
<div style="flex:1;overflow:hidden;contain:strict;">\
<div class="objeditorcol">\
<div style="grid-template-areas:\
&quot;dup add up&quot;\
&quot;sort del down&quot;\
;" class="objeditorbtnbox">\
<input type="button" value="dup" style="grid-area:dup;"/>\
<input type="button" value="sort" style="grid-area:sort;"/>\
<input type="button" value="add" style="grid-area:add;"/>\
<input type="button" value="del" style="grid-area:del;"/>\
<input type="button" value="&#8593;" style="grid-area:up;"/>\
<input type="button" value="&#8595;" style="grid-area:down;"/>\
</div>\
<div class="objeditorsbox" tabindex="0"></div>\
</div>\
<div class="objeditorcol">\
<div style="grid-template-areas:\
&quot;edit add up&quot;\
&quot;edit del down&quot;\
;" class="objeditorbtnbox">\
<input type="button" value="edit" style="grid-area:edit;"/>\
<input type="button" value="add" style="grid-area:add;"/>\
<input type="button" value="del" style="grid-area:del;"/>\
<input type="button" value="&#8593;" style="grid-area:up;"/>\
<input type="button" value="&#8595;" style="grid-area:down;"/>\
</div>\
<div class="objeditorsbox" tabindex="0"></div>\
</div>\
</div>'),els=gui.getElementsByTagName('input'),bts=this.button_names,i=bts.length;i;this['b_'+bts[--i]]=els[i]);
	gui.className='objeditor vbox';
	els=gui.getElementsByClassName('objeditorsbox');
	this.s_objs=new CSelect(els[0],objs_arr,this.str_obj,Array.prototype,this.s_objs_onchange.bind(this));
	this.s_props=new CSelect(els[1],Array.prototype,ObjEditor.prop_display,this.default_prop,this.s_props_onchange.bind(this));
	gui.handle_resize=this.updateh.bind(this);
	gui.obj_editor=this;
	new XSizer(this.s_objs.p.parentNode.parentNode);
	this.init_edit_dialog();
	this.init_event_listeners();
	push_gui(gui);
	setTimeout(this.updatefull,0,this);
}

ObjEditor.prototype.default_prop=['key','value'];

ObjEditor.prototype.button_names=[
	'back',
	'back_no_write',
	'dup_obj',
	'sort_objs',
	'add_obj',
	'del_obj',
	'up_obj',
	'down_obj',
	'edit_prop',
	'add_prop',
	'del_prop',
	'up_prop',
	'down_prop'
];

ObjEditor.prototype.updatefull=function(o){
	o.s_objs.updatefull();
	o.s_props.updatefull();
};

ObjEditor.prototype.updateh=function(){
	this.s_objs.updateh();
	this.s_props.updateh();
};

ObjEditor.prototype.init_event_listeners=function(){
	this.b_back_no_write.addEventListener('click',pop_gui,onceel);
	this.b_back.addEventListener('click',this.back.bind(this),onceel);
	this.b_up_obj.addEventListener('click',this.s_objs.swapup.bind(this.s_objs),passiveel);
	this.b_down_obj.addEventListener('click',this.s_objs.swapdown.bind(this.s_objs),passiveel);
	this.b_del_obj.addEventListener('click',this.s_objs.del.bind(this.s_objs),passiveel);
	this.b_dup_obj.addEventListener('click',this.s_objs.dup.bind(this.s_objs),passiveel);
	this.b_sort_objs.addEventListener('click',this.open_sort_objs_dialog.bind(this),passiveel);
	this.b_add_obj.addEventListener('click',this.s_objs.add.bind(this.s_objs),passiveel);
	this.b_up_prop.addEventListener('click',this.s_props.swapup.bind(this.s_props),passiveel);
	this.b_down_prop.addEventListener('click',this.s_props.swapdown.bind(this.s_props),passiveel);
	this.b_del_prop.addEventListener('click',this.s_props.del.bind(this.s_props),passiveel);
	this.b_add_prop.addEventListener('click',this.add_prop.bind(this),passiveel);
	this.b_edit_prop.addEventListener('click',this.open_edit_dialog.bind(this),passiveel);
};

ObjEditor.prototype.add_prop=function(){
	this.s_props.add();
	this.open_edit_dialog();
};

ObjEditor.prototype.s_objs_onchange=function(s){
	if(s&CS_SEL){
		(s=this.s_props).sel=-1;
		s.items=this.s_objs.getsitem()||Array.prototype;
		s.updatelen();
	}
};

ObjEditor.prototype.s_props_onchange=function(s){
	if(s&CS_ITEMS)this.s_objs.updateitemdivs();
};

ObjEditor.prototype.parse_string=function(string){
	if(!string)return [];
	if((string=string.split(';')).length<2)throw Error('object string isn\'t empty but there is no ";"');
	if(string.pop())throw Error('object string has extra data after ";"');
	var sl=string.length,si=0,props,objs=[],pl,pi;
	while(sl>si){
		if(string[si]){
			if((pl=(props=string[si].split(',')).length)&1)throw Error('odd number of props in object');
			pi=0;
			while(pl>pi)props[pi>>1]=props.slice(pi,pi+=2);
			props.length=pl>>1;
		}else props=[];
		string[si++]=props;
	}
	return string;
};

ObjEditor.prototype.str_obj=function(obj){
	//Array.prototype.toString joins array with ','
	return obj+';';
};

ObjEditor.prototype.dialog_value_oninput=function(){
	this.s_dialog_value.value=this.i_dialog_value.value;
};

ObjEditor.prototype.dialog_value_onchange=function(){
	this.i_dialog_value.value=this.s_dialog_value.value;
};

ObjEditor.prototype.update_value_opts=function(){
	var o=this.s_dialog_key.selectedOptions[0],h;
	if(o){
		o=o.dataset;
		h=o.valhtml;
		if(typeof h==='string'){
			this.s_dialog_value.innerHTML=h;
			this.dialog_value_oninput();
			this.s_dialog_value.style.display='';
		}else{
			this.s_dialog_value.innerHTML='';
			this.s_dialog_value.style.display='none';
		}
		h=o.valhelp;
		if(typeof h==='string'){
			this.dialog_value_help_pre.innerHTML=h;
			this.dialog_value_help_fieldset.style.display='';
		}else{
			this.dialog_value_help_pre.innerHTML='';
			this.dialog_value_help_fieldset.style.display='none';
		}
	}else{
		this.s_dialog_value.innerHTML='';
		this.s_dialog_value.style.display='none';
		this.dialog_value_help_pre.innerHTML='';
		this.dialog_value_help_fieldset.style.display='none';
	}
};

ObjEditor.prototype.dialog_key_oninput=function(){
	this.s_dialog_key.value=this.i_dialog_key.value;
	this.update_value_opts();
};

ObjEditor.prototype.dialog_key_onchange=function(){
	this.i_dialog_key.value=this.s_dialog_key.value;
	this.update_value_opts();
};

ObjEditor.prototype.open_edit_dialog=function(){
	var prop=this.s_props.getsitem();
	if(prop){
		this.s_dialog_key.value=this.i_dialog_key.value=prop[0].replace(ObjEditor.re1,';');
		this.i_dialog_value.value=prop[1].replace(ObjEditor.re1,';');
		this.update_value_opts();
		push_gui(this.dialog,true);
	}
};

ObjEditor.re1=RegExp('\\r','g');
ObjEditor.re2=RegExp(';','g');

ObjEditor.prototype.dialog_back=function(){
	var nk=this.i_dialog_key.value;
	if(-1!==nk.indexOf(',')){
		alert('invalid key (contains ",")');
		return;
	}
	var nv=this.i_dialog_value.value;
	if(-1!==nv.indexOf(',')){
		alert('invalid value (contains ",")');
		return;
	}
	var prop=this.s_props.getsitem();
	prop[0]=nk.replace(ObjEditor.re2,'\r');
	prop[1]=nv.replace(ObjEditor.re2,'\r');
	this.s_objs.updateitemdivs();
	this.s_props.updateitemdivs();
	pop_gui();
};

ObjEditor.prototype.back=function(){
	pop_gui();
	var i=this.s_objs.items;
	this.write(i.length?i.join(';')+';':'');
};

ObjEditor.prototype.open_in_string_editor=function(){
	var s=this.s_dialog_value,i=this.i_dialog_value;
	string_editor(function(newval){
		s.value=i.value=newval.replace(ObjEditor.re1,';');
	},i.value.replace(ObjEditor.re2,'\r'));
};

ObjEditor.prototype.toggle_dialog_help=function(){
	if(this.dialog_help_cb.checked)this.dialog_value_help_fieldset.appendChild(this.dialog_value_help_pre);
	else this.dialog_value_help_fieldset.removeChild(this.dialog_value_help_pre);
};

ObjEditor.prototype.init_edit_dialog=function(){
	var root=cre('div'),el=this.dialog_help_cb=cre('input'),el2=cre('label'),el3=cre('legend');
	root.dataset.guiType='objeditordialog';
	root.className='grid2';
	el.type='checkbox';
	el.addEventListener('change',this.toggle_dialog_help.bind(this),passiveel);
	el.setAttribute('style','margin:auto 0;width:18px;height:18px;');
	el2.className='btn';
	el2.style.display='inline-flex';
	el2.appendChild(el);
	el=cre('span');
	el.style.margin='auto 0';
	el.textContent=' help';
	el2.appendChild(el);
	el3.appendChild(el2);
	el=cre('input');
	el2=cre('select');
	el.type='button';
	el.value='back';
	root.appendChild(el).addEventListener('click',this.dialog_back.bind(this),passiveel);
	el=cre('input');
	el.type='button';
	el.value='back (no write)';
	root.appendChild(el).addEventListener('click',pop_gui,passiveel);
	el2.innerHTML=ObjEditor.key_html;
	el=cre('fieldset');
	el.className='objeditorfs';
	el.innerHTML='<legend title="; is \\r escape&#10;use in JS console:&#10;  ok - key as string" style="cursor:help;">key</legend>';
	el.appendChild(this.s_dialog_key=el2).addEventListener('change',this.dialog_key_onchange.bind(this),passiveel);
	el.appendChild(this.i_dialog_key=cre('textarea')).addEventListener('input',this.dialog_key_oninput.bind(this),passiveel);
	root.appendChild(el);
	el=cre('fieldset');
	el.className='objeditorfs';
	el.innerHTML='<legend title="; is \\r escape&#10;use in JS console:&#10;  ovs - value as string&#10;  ov - value as number" style="cursor:help;">value</legend>';
	el.appendChild(this.s_dialog_value=cre('select')).addEventListener('change',this.dialog_value_onchange.bind(this),passiveel);
	el.appendChild(this.i_dialog_value=cre('textarea')).addEventListener('input',this.dialog_value_oninput.bind(this),passiveel);
	el2=cre('input');
	el2.type='button';
	el2.value='open in string editor';
	el.appendChild(el2).addEventListener('click',this.open_in_string_editor.bind(this),passiveel);
	(el2=cre('fieldset')).appendChild(el3);
	(this.dialog_value_help_pre=cre('pre')).setAttribute('style','margin:0;white-space:pre-wrap;');
	el.appendChild(this.dialog_value_help_fieldset=el2);
	root.appendChild(el);
	root.insertAdjacentHTML('beforeend','<a href="https://wyliemaster.github.io/gddocs/#/resources/client/level-components/level-object" rel="noreferrer" target="_blank" style="grid-column:1/3;margin-right:auto;"><q cite="https://wyliemaster.github.io/gddocs/#/resources/client/level-components/level-object">Level Object</q> on wyliemaster.github.io/gddocs</a>');
	this.dialog=root;
};

ObjEditor.prototype.open_sort_objs_dialog=function(){
	var g=div_with_html(
'<ul style="grid-column:1/4;" class="linside">\
<li>objects are sorted smaller x (2) to top</li>\
<li>objects with equal x (2) are sorted smaller y (3) to top</li>\
<li>objects with equal x (2) and y (3) are sorted to same order as before sorting</li>\
<li>use <strong>sort all except first</strong> for levels because first object is special</li>\
</ul>\
<input class="npnb" value="don&apos;t sort" type="button"/>\
<input class="npnb" value="sort all excecpt first" type="button"/>\
<input class="npnb" value="sort all" type="button"/>'),sortex=g.childNodes,sort=sortex[3],itemcount=this.s_objs.items.length;
	sortex[1].addEventListener('click',pop_gui,onceel);
	sortex=sortex[2];
	g.className='sortdialog';
	if(itemcount>1){
		sort.s_objs=this.s_objs;
		sort.exfirst=false;
		sort.addEventListener('click',ObjEditor.sort_option_onclick,onceel);
	}else{
		sort.disabled=true;
		sort.title='need more than 1 object';
	}
	if(itemcount>2){
		sortex.s_objs=this.s_objs;
		sortex.exfirst=true;
		sortex.addEventListener('click',ObjEditor.sort_option_onclick,onceel);
	}else{
		sortex.disabled=true;
		sortex.title='need more than 2 objects';
	}
	push_gui(g,true);
};

ObjEditor.sort_option_onclick=function(){
	var s_objs=this.s_objs,items=s_objs.items,selitem=s_objs.getsitem();
	if(this.exfirst){
		var i=items.shift();
		items.sort(ObjEditor.sort_comparitor).unshift(i);
	}else items.sort(ObjEditor.sort_comparitor);
	if(selitem){
		s_objs.sel=items.indexOf(selitem);
		s_objs.selinview();
	}else s_objs.updateitemdivs();
	pop_gui();
};

ObjEditor.sort_comparitor=function(a,b){
	for(var ax='',ay='',bx='',by='',i=0,l=a.length;l>i;++i)switch(a[i][0]){
		case '2':
			ax=a[i][1];
			continue;
		case '3':
			ay=a[i][1];
	}
	for(i=0,l=b.length;l>i;++i)switch(b[i][0]){
		case '2':
			bx=b[i][1];
			continue;
		case '3':
			by=b[i][1];
	}
	return ax-bx||ay-by;
};

var sof_re=RegExp('\\$[_0-9A-Za-z]+','g');

function sof(fmt,obj){
	return fmt.replace(sof_re,function(v){
		return obj[v.substring(1)];
	});
}

function linkf(url){
	return '<a rel="noreferrer" target="_blank" href="'+url+'">'+url+'</a>';
}

ObjEditor.init_prop_display=function(){
var k2d={'__proto__':null};
ObjEditor.init_prop_display=Function.prototype;
ObjEditor.prop_display=function(prop){
	var k=prop[0],v=prop[1],d=k2d[k];
	switch(typeof d){
		case 'object':
			var vd=d[1][v];
			if(typeof vd==='string')return d[0]+'='+vd+'\u23F5'+k+','+v;
			return d[0]+'\u23F5'+k+','+v;
		case 'string':
			return d+'\u23F5'+k+','+v;
		default:
			return k+','+v;
	}
};
(function(){
for(var img=function(x,y,w,h){
	return '<div style="background-position:'+-x+'px '+-y+'px;width:'+w+'px;height:'+h+'px;" role="img" class="helpimg"></div>';
},rimg=function(x,y,w,h){
	return '<div style="--x:'+-x+'px;--y:'+-y+'px;--w:'+w+'px;--h:'+h+'px;" role="img" class="helprimg"></div>';
},scalef='<ul class="linside"><li>= 0 is same as not existing (scale $a = 0 object impossible)</li><li>makes scale (32) meaningless if exists</li><li>= 1 if doesn&apos;t exist (only matters if scale $o exists)</li><li>see '+linkf('https://www.desmos.com/calculator/mugxsxvruf')+'</li></ul>',
fwarn='<li>beware of <a style="font-weight:bold;" href="https://h-schmidt.net/FloatConverter/IEEE754.html" rel="noreferrer" target="_blank">float32</a> imprecision (69.000001 = 68.999999 = 69)!</li>',
rotatef='<ul><li>= 0 if doesn&apos;t exist</li><li>makes rotate (6) meaningless if rotate x (131) &#8800; rotate y (132)<ul>'+fwarn+'</ul></li><li>see '+linkf('https://www.desmos.com/calculator/mugxsxvruf')+'</li></ul>',
xyf='block (id: 1, scale: 1) is <strong>30</strong>x<strong>30</strong>',
colors=['0','default','1000','bg','1001','g1','1002','l','1003','3dl','1004','obj','1005','p1','1006','p2','1007','lbg','1009','g2','1010','black','1011','white','1012','lighter',
	'<strong>0</strong> is default&#10;[<strong>1</strong>;<strong>999</strong>] display like number&#10;<strong>1012</strong> (<em>lighter</em>) as main color (21) crashes or freezes gd (demonstrated in level <a style="font-weight:bold;" href="https://gdbrowser.com/87647796" rel="noreferrer" target="_blank">87647796</a>)'],
arr=['objects',
	['1','id','play level <a style="font-weight:bold;" href="https://gdbrowser.com/58079690" rel="noreferrer" target="_blank">58079690</a> for list of all ids'],
	['2','x',xyf],
	['3','y',xyf],
	['6','rotate','<ul><li>= 0 if doesn&apos;t exist</li><li>unit is degrees</li><li><strong class="when">(2.2) </strong>ignored if rotate x (131) &#8800; rotate y (132)<ul>'+fwarn+'</ul></li></ul>'+img(0,431,400,278)],
	['13','portal checkbox','0','no','1','yes',img(0,0,400,341)],
	Array.prototype.concat('21','main color',colors),
	Array.prototype.concat('22','secondary color',colors),
	['25','z order','0','default','0 means default&#10;<a href="https://gdforum.freeforums.net/thread/66686/object-678-order" rel="noreferrer" target="_blank">for some objects 0 is default z order</a>'],
	['31','encoded text','encoded without gzip'],
	['32','scale','<ul class="linside"><li>= 1 if doesn&apos;t exist</li><li>= 0 is same as not existing (scale = 0 object impossible)</li><li><strong class="when">(2.2) </strong>ignored if scale x (128) or scale y (129) exist</li></ul>'],
	['54','orange teleporter y offset','<table class="tableborder"><thead><tr><th>0 (resets to 100 when level loaded in editor)</th><th>100 (default)</th></tr></thead><tbody><tr><td align="center">'+img(502,661,102,102)+'</td><td align="center">'+img(400,525,102,238)+'</td></tr></tbody></table>'],
	['57','groups','groups are separated by &quot;.&quot;'],
	['96','glow','0','yes','1','no','default is yes (0)'],
	['99','multi activate','0','no','1','yes','works with orbs, pads and portals&#10;doesn&apos;t work with mirror, speed and dual portals'],
	['108','link controls id','0','no link'],
	['128','scale x (2.2)',sof(scalef,{'a':'x','o':'y (129)'})],
	['129','scale y (2.2)',sof(scalef,{'a':'y','o':'x (128)'})],
	['131','rotate x (2.2)',rotatef],
	['132','rotate y (2.2)',rotatef],
'start pos and level start',
	['kA2','start gamemode',
		'0','square',
		'1','ship',
		'2','ball',
		'3','ufo',
		'4','wave',
		'5','robot',
		'6','spider',
		'7','swing copter (2.2)',
		'<strong>invalid</strong> values are <strong>square</strong> but gamemode button in editor is not <strong style="color:cyan;" class="tstroke">cyan</strong>'],
	['kA3','start mini','0','no','1','yes'],
	['kA4','start speed',
		'1','<',
		'0','>',
		'2','>>',
		'3','>>>',
		'4','>>>>',
		'<strong>invalid</strong> values are <strong style="color:cyan;" class="tstroke">&gt;</strong> but speed button in editor is not highlighted'],
	['kA6','BG','<strong>0</strong> is same as <strong>1</strong>'+rimg(400,0,525,204)],
	['kA7','G','<strong>0</strong> is same as <strong>1</strong>'+img(0,763,525,204)],
	['kA8','start dual','0','no','1','yes'],
	['kA9','menu type','0','level','1','start pos','default is <strong>menu type=level&#9205;kA9,0</strong><hr/><strong>menu type=level&#9205;kA9,0</strong> is like gear button in editor&#10;<strong>menu type=start pos&#9205;kA9,1</strong> is like start pos edit object<hr/>first object in level having <strong>menu type=start pos&#9205;kA9,1</strong> will make:<ul><li>editor gear button open menu like start pos edit object</li><li>colors (kS38) don&apos;t work</li><li>lots of properties don&apos;t survive editor saving</li></ul>start pos having <strong>menu type=level&#9205;kA9,0</strong> will crash game when you click edit object'],
	['kA11','start flipped gravity','0','no','1','yes'],
	['kA14','music lines',linkf('https://wyliemaster.github.io/gddocs/#/resources/client/level-components/guideline-string')],
	['kA15','song fade in','0','no','1','yes'],
	['kA16','song fade out','0','no','1','yes'],
	['kA17','G/Line','<strong>0</strong> in data is <strong>1</strong> in editor&#10;<strong>1</strong> in data is <strong>1</strong> in editor&#10;<strong>2</strong> in data is <strong>2</strong> in editor'+img(421,936,137,66)],
	['kA20','start reverse (2.2)','0','no','1','yes'],
	['kA22','platformer mode (2.2)','0','no','1','yes'],
	['kA21','disable start pos (2.2)','0','no','1','yes','<ul class="linside"><li>does nothing on level start</li><li>level can be verified if there are only disabled <strong>start pos</strong>es</li></ul>'],
	['kA24','start centered camera (2.2)','0','no','1','yes'],
	['kA25','MG (2.2)','<strong>0</strong> and <strong>1</strong> are different middlegrounds (unlike BG (kA6) and G (kA7))'],
	['kS38','colors',linkf('https://wyliemaster.github.io/gddocs/#/resources/client/level-components/color-string')],
'triggers',
	['11','touch triggered','0','no','1','yes'],
	['62','spawn triggered','0','no','1','yes'],
	['87','multi trigger','0','no','1','yes'],
	['30','easing',
		'0','none',
		'1','ease in out',
		'2','ease in',
		'3','ease out',
		'4','elastic in out',
		'5','elastic in',
		'6','elastic out',
		'7','bounce in out',
		'8','bounce in',
		'9','bounce out',
		'10','exponential in out',
		'11','exponential in',
		'12','exponential out',
		'13','sine in out',
		'14','sine in',
		'15','sine out',
		'16','back in out',
		'17','back in',
		'18','back out',
		'used in <strong>MOVE</strong> and <strong>ROTATE</strong> triggers'],
	['85','easing rate',img(0,341,400,90)]
],l=arr.length,i=0,key_html='',de=function(chr){
	switch(chr){
		case '"':return '&amp;quot;';
		case '\'':return '&amp;apos;';
		case '<':return '&amp;lt;';
		case '>':return '&amp;gt;';
		case '&':return '&amp;amp;';
		default:return '&amp;#'+chr.codePointAt(0)+';';
	}
};l>i;){
	var item=arr[i++];
	if(typeof item==='string'){
		key_html+='</optgroup><optgroup label="'+item+'">';
		continue;
	}
	key_html+='<option';
	var il=item.length;
	if(il&1)key_html+=' data-valhelp="'+escape_xml(item[--il])+'"';
	if(il>2){
		key_html+=' data-valhtml="';
		for(var vals={'__proto__':null},ii=2;il>ii;ii+=2)key_html+='&lt;option value=&quot;'+item[ii]+'&quot;&gt;'+item[ii]+'&amp;#9205;'+(vals[item[ii]]=item[1+ii]).replace(xml_escape_re,de)+'&lt;/option&gt;';
		key_html+='"';
		k2d[item[0]]=[item[1],vals];
	}else k2d[item[0]]=item[1];
	key_html+=' value="'+item[0]+'">'+item[0]+'&#9205;'+item[1]+'</option>';
}
ObjEditor.key_html=key_html.substring(11)+'</optgroup>';
})();
};