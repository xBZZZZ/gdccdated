'use strict';

function short_json_str(s){
	s=JSON.stringify(s);
	if(s.length>31)return s.substring(0,30)+'\u2026';
	return s;
}

function dict_item_display_string(p){
	var s=short_json_str(p.key)+' <'+p.type+'> ';
	if(p.type==='d')return s+'('+p.value.length+' items)';
	return s+short_json_str(p.value);
}

function dict_editor_fix_cl(g){
	var n=1+Math.ceil(Math.log10(1+g.cc_dict.length));
	if(n!==g.cl)g.items_list.style.setProperty('--cl',(g.cl=n)+'ch','');
}

function dict_editor_add_lis(){
	var b=current_gui(),ul=b.items_list,d=b.cc_dict,i=0,item,len=d.length,div,frag=document.createDocumentFragment();
	dict_editor_fix_cl(b);
	while(len>i){
		item=d[i++];
		b=cre('input');
		div=cre('div');
		div.draggable=true;
		div.setAttribute('role','listitem');
		b.type='button';
		b.cc_dict_item=item;
		b.value=dict_item_display_string(item);
		div.appendChild(b);
		frag.appendChild(div);
	}
	if(ul.replaceChildren)ul.replaceChildren(frag);
	else{
		ul.textContent='';
		ul.appendChild(frag);
	}
}

function dict_editor_update_inputs(g){
	var divs=g.items_list.childNodes,items=g.cc_dict,len=items.length,i=0,inp;
	while(len>i)(inp=divs[i].firstChild).value=dict_item_display_string(inp.cc_dict_item=items[i++]);
}

function dict_editor_select_mode_on(){
	var g=current_gui();
	g.dropb.disabled=true;
	g.dataset.selectMode='1';
}

function dict_editor_clear_selection(){
	var divs=current_gui().items_list.childNodes,len=divs.length,i=0;
	while(len>i)divs[i++].firstChild.classList.remove('stuckactive');
}

function dict_editor_select_mode_off(){
	dict_editor_clear_selection();
	var g=current_gui();
	g.dropb.disabled=false;
	g.dataset.selectMode='0';
}

function dict_editor_invert_selection(){
	var divs=current_gui().items_list.childNodes,len=divs.length,i=0;
	while(len>i)divs[i++].firstChild.classList.toggle('stuckactive');
}

function dict_editor_delete_selected(){
	var tbd=[],g=current_gui(),items_list=g.items_list,divs=items_list.childNodes,i=divs.length,div;
	while(i)if((div=divs[--i]).firstChild.classList.contains('stuckactive'))tbd.push(div);
	if(!((i=tbd.length)&&confirm('delete '+i+' selected items?')))return;
	tbd.forEach(items_list.removeChild,items_list);
	dict_editor_update_from_dom(g=current_gui());
	dict_editor_fix_cl(g);
}

function dict_editor_do_on_hide(){
	var a=this.items_list.childNodes,i=a.length;
	while(i)a[--i].classList.remove('itemanim');
}

function dict_editor_update_from_dom(g){
	var dict=g.cc_dict,divs=g.items_list.childNodes,i=divs.length;
	if(dict.length>i)dict.length=i;
	while(i)dict[--i]=divs[i].firstChild.cc_dict_item;
}

function dict_editor_do_menu(){
	var v=this.value;
	this.selectedIndex=0;
	if(v)window[v]();
}

function push_dict_editor(dict,root_name){
	var g=div_with_html(
'<select class="dropb" title="menu" aria-label="menu">\
<option value="">menu</option>\
<option value="pop_gui">exit dict editor</option>\
<option value="dict_editor_add_d_item">add &lt;d&gt; item</option>\
<option value="dict_editor_add_s_item">add &lt;s&gt; item</option>\
<option value="dict_editor_recursive_find_structures_onclick">recursive find structures</option>\
<option value="dict_editor_edit_as_structure_onclick">edit as structure</option>\
<option value="push_xml_ie">XML (im|ex)port dict contects</option>\
<option value="dict_editor_sort_keys">sort items by key</option>\
<option value="push_search">recursive RegExp search</option>\
<option value="push_rename_helper">rename helper</option>\
<option value="dict_editor_select_mode_on">select mode on</option>\
<option value="dict_editor_toggle_wrap">[yes</option>\
</select>\
<div class="pathcontainer">\
<div class="path"></div>\
<div class="sopts">\
<input type="button" value="select mode off"/>\
<input type="button" value="invert selection"/>\
<input type="button" value="clear selection"/>\
<input type="button" value="delete selected"/>\
</div>\
</div>\
<div class="dict_items_list_container">\
<div class="dict_items_list dict_items_list_wrap" role="list"></div>\
</div>'),s=g.querySelector('.sopts').childNodes;
	s[0].addEventListener('click',dict_editor_select_mode_off,passiveel);
	s[1].addEventListener('click',dict_editor_invert_selection,passiveel);
	s[2].addEventListener('click',dict_editor_clear_selection,passiveel);
	s[3].addEventListener('click',dict_editor_delete_selected,passiveel);
	g.wrap_opt_text=(g.dropb=s=g.querySelector('.dropb')).lastChild.appendChild(document.createTextNode('] wrap items')).previousSibling;
	s.selectedIndex=0;
	s.addEventListener('change',dict_editor_do_menu,passiveel);
	g.items_list=s=g.querySelector('.dict_items_list');
	s.addEventListener('dragstart',dict_item_div_ondragstart,passiveel);
	s.addEventListener('dragend',dict_item_div_ondragend,passiveel);
	s.addEventListener('dragover',dict_item_div_ondragover,nonpassiveel);
	s.addEventListener('dragenter',dict_item_div_ondragenter,nonpassiveel);
	s.addEventListener('dragleave',dict_item_div_ondragleave,passiveel);
	s.addEventListener('drop',dict_item_div_ondrop,nonpassiveel);
	s.addEventListener('contextmenu',dict_item_oncontextmenu,nonpassiveel);
	s.addEventListener('click',dict_item_onclick,passiveel);
	(g.path_list=g.querySelector('.path')).addEventListener('click',path_link_onclick,passiveel);
	g.dataset.selectMode='0';
	g.do_on_hide=dict_editor_do_on_hide;
	g.dragging_item=null;
	g.cl=-1;
	push_gui(g);
	g=dict_editor_add_path_link(dict,root_name);
	g.style.fontWeight='bold';
	g.click();
}

var ints_re=RegExp('(-?[0-9]+)','');

function dict_compare_items(item1,item2){
	if((item1=item1.key)!==(item2=item2.key)){
		item1=item1.split(ints_re);
		item2=item2.split(ints_re);
		var l=Math.min(item1.push(Number.NEGATIVE_INFINITY),item2.push(Number.NEGATIVE_INFINITY)),i=0;
		while(l>i){
			if(i&1){
				item1[i]-=0;
				item2[i]-=0;
			}
			if(item1[i]!==item2[i])return item1[i]<item2[i]?-1:1;
			++i;
		}
	}
	return 0;
}

function dict_editor_toggle_wrap(){
	var g=current_gui();
	g.wrap_opt_text.nodeValue=g.items_list.classList.toggle('dict_items_list_wrap')?'[yes':'[no';
}

function dict_editor_sort_keys(){
	var g=current_gui(),dict=g.cc_dict;
	if(dict.length>1){
		dict.sort(dict_compare_items);
		dict_editor_update_inputs(g);
	}
}

function push_xml_ie(){
	var g=hopen('div');
	g.last_blob_url='';
	g.new_items=null;
	g.className='grid2 xmlie';
	hbutton('back',xml_ie_back,onceel).className='npnb';var tbd=g.tbd=[hclose()];
	hbutton('back (no write)',xml_ie_back_no_write,onceel).className='npnb';tbd.push(hclose());
	g.drop_file_input=hopen('input');hcurr().className='npnb';hcurr().type='file';hstyle('grid-column','1/3');tbd.push(hclose());
	hbutton('import',xml_ie_import).className='npnb';tbd.push(hclose());
	hbutton('export',xml_ie_export).className='npnb';tbd.push(hclose());
	hfieldset('status');
	hstyle('grid-column','1/3');
		(g.status=hopen('ul')).className='linside';
		hclose('ul');
	hclose('fieldset');
	push_gui(hclose('div'),true);
}

function xml_ie_back_no_write(){
	var b=current_gui().last_blob_url;
	if(b)URL.revokeObjectURL(b);
	pop_gui();
}

function xml_ie_back(){
	var new_items=current_gui().new_items;
	xml_ie_back_no_write();
	if(!new_items)return;
	var old_items=current_gui().cc_dict,i=new_items.length;
	if(old_items.length>i)old_items.length=i;
	while(i)old_items[--i]=new_items[i];
	dict_editor_add_lis();
}

function xml_ie_show_error(e){
	console.error(e);
	var li=cre('li'),g=current_gui();
	li.style.backgroundColor='#F00';
	li.textContent=e;
	g.status.appendChild(li);
	set_loading(false);
}

function xml_ie_filereader_onerror(){
	xml_ie_show_error(this.error);
}

function xml_ie_filereader_onload(){
	try{
		var d=document.implementation.createDocument(null,'d',null).documentElement;
		d.innerHTML=this.result;
		var g=current_gui();
		g.new_items=cc_parse_dict(d.children);
		d=cre('li');
		d.style.backgroundColor='#0F0';
		d.textContent='imported';
		g.status.appendChild(d);
		set_loading(false);
	}catch(error){
		xml_ie_show_error(error);
	}
}

function xml_ie_import(){
	var g=current_gui(),f=g.last_blob_url;
	if(f){
		URL.revokeObjectURL(f);
		g.last_blob_url='';
	}
	f=g.drop_file_input.files[0];
	g.status.innerHTML='<li>importing</li>';
	if(!f){
		f=cre('li');
		f.style.backgroundColor='#F00';
		f.textContent='no file';
		g.status.appendChild(f);
		return;
	}
	set_loading(true);
	try{
		g=new FileReader();
		g.addEventListener('error',xml_ie_filereader_onerror,onceel);
		g.addEventListener('load',xml_ie_filereader_onload,onceel);
		g.readAsText(f);
	}catch(error){
		xml_ie_show_error(error);
	}
}

function xml_ie_export(){
	var l=guis.length,g=guis[l-1],blob=g.last_blob_url,x;
	if(blob){
		URL.revokeObjectURL(blob);
		g.last_blob_url='';
	}
	g.status.innerHTML='<li>exporting</li>';
	try{
		blob=[];
		if((l=guis[l-2].cc_dict).length){
			(x=new CcXmlMaker(blob.push.bind(blob),0)).d(l);
			x.f();
		}
		l=cre('a');
		l.href=g.last_blob_url=URL.createObjectURL(new Blob(blob,xmlblobopts));
		l.rel='noreferrer';
		l.download='dict.xml';
		l.textContent='exported, click me to save';
		blob=cre('li');
		blob.style.backgroundColor='#0F0';
		blob.appendChild(l);
		g.status.appendChild(blob);
	}catch(error){
		xml_ie_show_error(error);
	}
}

function path_link_onclick(e){
	var g=current_gui(),t=e.target;
	if(t.cc_dict){
		g.cc_dict=t.cc_dict;
		dict_editor_add_lis();
		t.disabled=true;
		g=t.parentNode;
		while(t!==(e=g.lastChild))g.removeChild(e);
	}
}

function dict_editor_add_path_link(dict,name){
	var p=current_gui().path_list,b=cre('input'),l=p.lastChild;
	b.type='button';
	b.value=JSON.stringify(name).slice(1,-1);
	b.cc_dict=dict;
	if(l)l.disabled=false;
	return p.appendChild(b);
}

function dict_editor_add_item(g,item,index){
	var b=cre('input'),d=cre('div'),dict=b.cc_dict=g.cc_dict,il=g.items_list;
	d.draggable=true;
	d.setAttribute('role','listitem');
	d.classList.add('itemanim');
	b.cc_dict_item=item;
	b.type='button';
	b.value=dict_item_display_string(item);
	d.appendChild(b);
	if('number'===typeof index&&index<dict.length){
		il.insertBefore(d,il.childNodes[index]);
		dict.splice(index,0,item);
	}else{
		il.appendChild(d);
		dict.push(item);
	}
	dict_editor_fix_cl(g);
	return b;
}

function dict_editor_add_d_item(){
	dict_editor_add_item(current_gui(),{'key':'key','type':'d','value':[]}).click();
}

function dict_editor_add_s_item(){
	dict_editor_add_item(current_gui(),{'key':'key','type':'s','value':'value'}).click();
}

function dict_item_oncontextmenu(e){
	var item=e.target.cc_dict_item;
	if(item){
		e.preventDefault();
		if(current_gui().dataset.selectMode==='1')return;
		if(item.type==='d')dict_editor_add_path_link(item.value,item.key).click();
	}
}

function dict_item_div_ondragstart(dt){
	var g=current_gui(),t=dt.target;
	if(t.parentNode===g.items_list){
		g.dragging_item=t;
		g.items_list.classList.add('draggingitem');
		(dt=dt.dataTransfer).clearData();
		dt.setData('text/plain',t.firstChild.value);
		dt.effectAllowed='move';
	}
}

function dict_item_div_ondragend(e){
	var g=current_gui();
	if(e.target.parentNode===g.items_list){
		g.dragging_item=null;
		g.items_list.classList.remove('draggingitem');
	}
}

function dict_item_div_ondragover(e){
	var g=current_gui();
	if(g.dragging_item&&e.target.parentNode===g.items_list)e.preventDefault();
}

function dict_item_div_ondragenter(e){
	var g=current_gui(),t=e.target;
	if(g.dragging_item&&t.parentNode===g.items_list){
		e.preventDefault();
		t.classList.add('itemdraggingover');
	}
}

function dict_item_div_ondragleave(e){
	if((e=e.target).parentNode===current_gui().items_list)e.classList.remove('itemdraggingover');
}

function dict_item_div_ondrop(e){
	var g=current_gui(),d=g.dragging_item,t=e.target;
	if(d&&t.parentNode===g.items_list){
		e.preventDefault();
		t.classList.remove('itemdraggingover');
		d.classList.add('itemanim');
		g.dragging_item=null;
		g.items_list.insertBefore(d,t);
		dict_editor_update_from_dom(g);
	}
}

function open_value_in_dict_editor_onclick(){
	var i=current_gui().edit_button.cc_dict_item;
	item_editor_back_button_onclick();
	dict_editor_add_path_link(i.value,i.key).click();
}

function dict_item_onclick(e){
	var item=(e=e.target).cc_dict_item,g,f;
	if(!item)return;
	if(current_gui().dataset.selectMode==='1'){
		e.classList.toggle('stuckactive');
		return;
	}
	(g=hopen('div')).dataset.guiType='itemeditor';
	g.className='grid2';
	(g.edit_button=e).classList.add('stuckactive');
		hbutton('back',item_editor_back_button_onclick);hclose();
		hbutton('back (no write)',item_editor_back_no_write_button_onclick,onceel);hclose();
		hopen('h2');
		hstyle('line-height','32px');
		hstyle('grid-column','1/3');
		hstyle('white-space','pre');
			htext('editing item #');
			g.item_num_tn=htext(1+current_gui().cc_dict.indexOf(item));
		hclose('h2');
		hfieldset('key','use in JS console:\n  ik - key as string').className='objeditorfs';
			(g.key_input=new AdvTextArea(hcurr())).setval(item.key);
		hclose('fieldset');
		hfieldset('type');
		hstyle('display','flex');
		hstyle('grid-column','1/3');
			(f=cre('input')).type='text';
			f.style.flexGrow='1';
			f.minLength=f.maxLength=1;
			f.pattern='[a-z]';
			f.value=item.type;
			hcurr().appendChild(g.type_input=f);
		hclose('fieldset');
		if(item.type==='d'){
			f.disabled=true;
			hbutton('open value in dict editor',open_value_in_dict_editor_onclick);
			hstyle('grid-column','1/3');
			hclose();
		}else{
			hfieldset('value','use in JS console:\n  iv - value as string').className='objeditorfs';
				(g.value_input=new AdvTextArea(hcurr())).setval(item.value);
			hclose('fieldset');
		}
		hbutton('duplicate item',item_editor_duplicate);hclose();
		hbutton('delete item',item_editor_delete_button_onclick);hclose();
	push_gui(hclose('div'),true);
}

function item_editor_duplicate(){
	var g=current_gui(),eb=g.edit_button,i=eb.cc_dict_item,t;
	if(i.type==='d')i={'key':g.key_input.getval(),'type':'d','value':JSON.parse(JSON.stringify(i.value))};
	else{
		if(!(t=g.type_input.value)){
			alert('empty type');
			return;
		}
		if(t==='d'){
			alert('can\'t set type to <d> because not dict');
			return;
		}
		if(!valid_type_re.test(t)){
			alert('invalid type '+t);
			return;
		}
		i={'key':g.key_input.getval(),'type':t,'value':g.value_input.getval()};
	}
	eb.classList.remove('stuckactive');
	(g.edit_button=dict_editor_add_item(t=guis[guis.length-2],i,(g.item_num_tn.nodeValue=2+t.cc_dict.indexOf(eb.cc_dict_item))-1)).classList.add('stuckactive');
}

function item_editor_back_no_write_button_onclick(){
	current_gui().edit_button.classList.remove('stuckactive');
	pop_gui();
}

function item_editor_back_button_onclick(){
	var g=current_gui(),b=g.edit_button,i=b.cc_dict_item;
	if(i.type!=='d'){
		var t=g.type_input.value;
		if(!t){
			alert('empty type');
			return;
		}
		if(t==='d'){
			alert('can\'t set type to <d> because not dict');
			return;
		}
		if(!valid_type_re.test(t)){
			alert('invalid type '+t);
			return;
		}
		i.type=g.type_input.value;
		i.value=g.value_input.getval();
	}
	i.key=g.key_input.getval();
	b.value=dict_item_display_string(i);
	b.classList.remove('stuckactive');
	pop_gui();
}

function item_editor_delete_button_onclick(){
	var g=current_gui(),b=g.edit_button,i=b.cc_dict_item,d;
	if(!confirm('are you sure you want to delete '+g.item_num_tn.nodeValue+'. '+b.value+'?'))return;
	pop_gui();
	(g=current_gui()).items_list.removeChild(b.parentNode);
	(d=g.cc_dict).splice(d.indexOf(i),1);
	dict_editor_fix_cl(g);
}

function search_toggle_onchange(){
	var g=current_gui();
	if(this.checked)g.appendChild(g.ul_container);
	else g.removeChild(g.ul_container);
}

function search_plus_onclick(){
	var g=current_gui();
	g.tbody.appendChild(g.tr_template.cloneNode(true));
}

function search_tbody_onclick(t){
	if((t=t.target).matches('input[type=button]'))this.removeChild(t.parentNode.parentNode);
}

function push_search(){
	var g=div_with_html(
'<div class="hbox growc">\
<input style="margin:0 1px;height:25px;padding:0;" type="button" value="back"/>\
<label class="btn" style="margin:0;display:flex;height:25px;padding:0;">\
<input style="margin:auto 0 auto auto;width:18px;height:18px;" checked="" type="checkbox"/>\
<span style="margin:auto auto auto 0;">\
 <strong>0</strong> results\
</span>\
</label>\
<input style="margin:0 1px;height:25px;padding:0;" type="button" value="search"/>\
</div>\
<table style="border-spacing:1px;width:100%;">\
<thead>\
<tr>\
<th class="tdf"><input style="font-weight:bold;" type="button" value="+"/></th>\
<th class="bor1" style="width:25px;">xor</th>\
<th class="bor1">regexp</th>\
<th class="bor1">regexp flags</th>\
<th class="bor1">target</th>\
</tr>\
</thead>\
<tbody>\
<tr>\
<td class="tdf"><input type="button" value="-"/></td>\
<td class="tdi"><input type="checkbox"/></td>\
<td class="tdi"><input type="text"/></td>\
<td class="tdi"><input type="text"/></td>\
<td class="tdi"><select>\
<option>key</option>\
<option>type</option>\
<option>value</option>\
</select></td>\
</tr>\
</tbody>\
</table>\
<div style="height:200px;flex-shrink:0;" class="resizebox">\
<ul style="white-space:pre;margin:2px 0;"></ul>\
</div>');
	g.className='vbox';
	var i=g.getElementsByTagName('input');
	i[0].addEventListener('click',pop_gui,onceel);
	i[1].addEventListener('change',search_toggle_onchange,passiveel);
	i[2].addEventListener('click',search_onclick,passiveel);
	i[3].addEventListener('click',search_plus_onclick,passiveel);
	g.tr_template=(i=g.tbody=g.querySelector('tbody')).firstChild.cloneNode(true);
	i.addEventListener('click',search_tbody_onclick,passiveel);
	g.results_count=g.firstChild.querySelector('strong');
	g.cc_dict=current_gui().cc_dict;
	g.ul=(g.ul_container=g.lastChild).firstChild;
	push_gui(g,true);
}

function search_onclick(){
	try{
		var g=current_gui(),querys=Array.prototype.map.call(g.tbody.childNodes,search_tr_to_obj),path=[],results_count=0,frag=document.createDocumentFragment(),results_ul=g.ul;
		(function f(dict){
			var ol,inp,i=0,i2,p,dict_len=dict.length,item,path_len=path.push(null)-1;
			while(dict_len>i){
				if(search_test_querys(item=dict[i++],querys)){
					if(!ol){
						ol=frag.appendChild(cre('li'));
						inp=ol.appendChild(cre('input'));
						inp.type='button';
						inp.onclick=structure_finder_dict_onclick;
						inp.dict_relative_path=path.slice(0,path_len);
						p='./';
						i2=0;
						while(path_len>i2)p+=path[i2++].key+'/';
						inp.value=p;
						ol=ol.appendChild(cre('ol'));
					}
					inp=ol.appendChild(cre('li'));
					inp.value=i;
					inp.textContent=dict_item_display_string(item);
					++results_count;
				}
				if(item.type==='d'){
					path[path_len]=item;
					f(item.value);
				}
			}
			path.pop();
		})(g.cc_dict);
		if(results_ul.replaceChildren)results_ul.replaceChildren(frag);
		else{
			results_ul.textContent='';
			results_ul.appendChild(frag);
		}
		g.results_count.textContent=results_count;
	}catch(error){
		say_error('search',error);
	}
}

function search_tr_to_obj(tr){
	tr=tr.childNodes;
	return {
		'xor':tr[1].firstChild.checked,
		'regexp':RegExp(tr[2].firstChild.value,tr[3].firstChild.value),
		'target':tr[4].firstChild.value
	};
}

function search_test_querys(item,querys){
	var i=0,l=querys.length,obj,is_dict=item.type==='d';
	while(l>i){
		obj=querys[i++];
		if(obj.xor===(!(is_dict&&obj.target==='value')&&obj.regexp.test(item[obj.target])))return false;
	}
	return true;
}

function push_rename_helper(){
	var g=div_with_html(sof(
'<input type="button" value="back"/>\
<details>\
<summary>help</summary>\
syntax: <span class="w"><em>text</em>{<wbr/><em>increment=0;<wbr/>min=$MIN_SAFE_INTEGER;<wbr/>max=$MAX_SAFE_INTEGER</em><wbr/>}</span>\
<ul style="margin:0;">\
<li>&quot;{{&quot; is &quot;{&quot; escape</li>\
<li>&quot;{}&quot; = &quot;{;;}&quot; = &quot;{;}&quot; = &quot;{0;$MIN_SAFE_INTEGER;$MAX_SAFE_INTEGER}&quot;</li>\
<li>&quot;{;2}&quot; = &quot;{0;2;$MAX_SAFE_INTEGER}&quot;</li>\
<li>&quot;{+69}&quot; = &quot;{69}&quot;</li>\
</ul>\
examples:\
<ul style="margin:0;">\
<li><span class="wp">aaa{1}bbb{-1}ccc</span> renames &quot;aaa10bbb20ccc&quot; to &quot;aaa11bbb19ccc&quot;</li>\
<li><span class="wp">{1}420</span> doesn&apos;t rename &quot;69420&quot;</li>\
<li><span class="wp">x{}x</span> doesn&apos;t rename &quot;potato&quot;</li>\
<li><span class="wp">{1;;1}</span> renames &quot;1&quot; to &quot;2&quot;</li>\
<li><span class="wp">{1;;1}</span> doesn&apos;t rename &quot;2&quot;</li>\
</ul>\
</details>\
<textarea></textarea>\
<input type="button" value="rename"/>',Number));
	g.className='vbox';
	g.command_input=g.querySelector('textarea');
	g.firstChild.addEventListener('click',pop_gui,onceel);
	g.lastChild.addEventListener('click',rename_onclick,passiveel);
	push_gui(g,true);
}

function rename_onclick(){
	var g=guis[guis.length-2],d=g.cc_dict,i=d.length,c;
	try{
		c=string_to_rename_command(current_gui().command_input.value);
	}catch(error){
		say_error('parse rename command',error);
		return;
	}
	while(i)d[--i].key=apply_rename_command(c,d[i].key);
	dict_editor_update_inputs(g);
}

function str_to_int(str){
	var int=str-0;
	if(Number.isSafeInteger(int))return int;
	throw Error('can\'t understand '+JSON.stringify(str)+' as integer');
}

function string_to_rename_command(str){
	var prev_i,i=0,tokens=[],nend,join=false,nstr;
	function add_token(t){
		if(join)tokens[tokens.length-1]+=t;
		else{
			join=true;
			tokens.push(t);
		}
	}
	while(-1!==(i=str.indexOf('{',prev_i=i))){
		if(i>prev_i)add_token(str.substring(prev_i,i));
		if(str.charAt(++i)==='{'){
			++i;
			add_token('{');
			continue;
		}
		nend=str.indexOf('}',i);
		if(-1===nend)throw Error('found "{" but no "}" after it');
		nstr=str.substring(i,nend).split(';',3);
		nstr[0]=nstr[0]?str_to_int(nstr[0]):0;
		nstr[1]=nstr[1]?str_to_int(nstr[1]):Number.MIN_SAFE_INTEGER;
		nstr[2]=nstr[2]?str_to_int(nstr[2]):Number.MAX_SAFE_INTEGER;
		tokens.push(nstr);
		join=false;
		i=nend+1;
	}
	if(str.length>prev_i)add_token(str.substring(prev_i));
	return tokens;
}

var sticky_int_re=RegExp('-?[0-9]+','y');

function apply_rename_command(tokens,str){
	var ti=0,si=0,tl=tokens.length,token,res,out='';
	while(tl>ti){
		token=tokens[ti++];
		if(typeof token==='string'){
			if(token!==str.substring(si,si+=token.length))return str;
			out+=token;
			continue;
		}
		sticky_int_re.lastIndex=si;
		res=sticky_int_re.exec(str);
		if(res===null)return str;
		res=res[0];
		si+=res.length;
		if(!Number.isSafeInteger(res-=0)||res<token[1]||res>token[2]||!Number.isSafeInteger(res+=token[0]))return str;
		out+=res;
	}
	if(str.length>si)return str;
	return out;
}