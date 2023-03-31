'use strict';

var xmlblobopts={'endings':'native','type':'application/xml;charset=UTF-8'},binblobopts={'endings':'transparent','type':'application/octet-stream'};

function cc_save_modal(buffers,name,blobopts){
	tbd_set_disabled(false);
	var g=gui_div_with_html('display:flex;flex-direction:column;','<a rel="noreferrer" class="btn" style="padding:10px;">save <strong></strong></a><input class="thiccb" type="button" value="back" onclick="window.URL.revokeObjectURL(current_gui().bloburl);pop_gui();"/>'),a=g.firstChild;
	g.bloburl=a.href=URL.createObjectURL(new Blob(buffers,blobopts));
	a.lastChild.textContent=a.download=name;
	push_gui(g);
}

function cc_gui_push_loading_modal(file_name){
	var g=gui_div_with_html('display:flex;flex-direction:column;','<h2 style="white-space:pre-wrap;margin:0 0 5px;"><span class="loading"></span> loading</h2><input class="thiccb" type="button" value="reload" onclick="location.reload();"/>');
	g.dataset.ccFileName=file_name;
	g.error_tag=g.firstChild;
	push_gui(g);
}

var valid_type_re=RegExp('^[a-z]$','');

function cc_parse_dict(chl){
	var i=0,len=chl.length,k,v,out=[],vt;
	if(len&1)throw Error('odd number of children: '+len);
	while(len>i){
		k=chl[i++];
		if(k.tagName!=='k')throw Error('tag is not <k>');
		if(k.children.length)throw Error('<k> contains elements (expected only text)');
		if(k.attributes.length)throw Error('<k> has attributes');
		v=chl[i++];
		vt=v.tagName;
		if(v.attributes.length)throw Error('<'+vt+'> has attributes');
		if('d'===vt)out.push({
			'key':k.textContent,
			'type':'d',
			'value':cc_parse_dict(v.children)
		});else{
			if(!valid_type_re.test(vt))throw Error('invalid value type: '+vt);
			if(v.firstElementChild)throw Error('<'+vt+'> contains elements (expected only text)');
			out.push({
				'key':k.textContent,
				'type':vt,
				'value':v.textContent
			});
		}
	}
	return out;
}

function cc_load_xml_string(plist){
	try{
		plist=new DOMParser().parseFromString(plist,'application/xml').documentElement;
		if(plist.tagName!=='plist')throw Error('not <plist>');
		var domattrs=plist.attributes;
		plist=plist.children;
		if(plist.length!==1)throw Error('number of children in <plist> is not 1');
		plist=plist[0];
		if(plist.tagName!=='dict')throw Error('not <dict>');
		if(plist.attributes.length)throw Error('<dict> has attributes');
		var i=0,len=domattrs.length,a,attrs=[];
		while(len>i){
			a=domattrs[i++];
			attrs.push(a.name,a.value);
		}
		load_cc_data({
			'attrs':attrs,
			'dict':cc_parse_dict(plist.children)
		});
	}catch(error){
		say_error('xml parse',error);
		return;
	}
}

function load_cc_data(cc_data){
	set_loading(false);
	var a=current_gui();
	a.error_tag=null;
	a.cc_data=cc_data;
	a.innerHTML=
'<input class="thiccb" type="button" value="back"/>\
<h2 style="margin:5px 0;">done</h2>\
<input class="thiccb" type="button" value="open in dict editor" onclick="var g=current_gui();if(g.dict_editor){push_gui(g.dict_editor);current_gui().dropb.selectedIndex=-1;}else{cc_gui_push_dict_editor(g.cc_data.dict,g.dataset.ccFileName);(g.dict_editor=current_gui()).dataset.reusable=&quot;&quot;;}"/>\
<input class="thiccb" type="button" value="save encrypted (windows and android)" '+(window.CompressionStream?'onclick="var g=current_gui();tbd_set_disabled(true);cc_save_gzip(g.cc_data,g.dataset.ccFileName);"':'title="your browser doesn&apos;t support CompressionStream" disabled=""')+'/>\
<input class="thiccb" type="button" value="save encrypted (mac os) (slow)" '+(typeof subtlecrypto==='object'?'onclick="var g=current_gui();tbd_set_disabled(true);cc_save_aes(g.cc_data,g.dataset.ccFileName,this.nextSibling);"/><progress title="encrypting (mac os) (slow)" aria-label="encrypting (mac os) (slow)" max="64" value="0" style="display:none;"':subtlecrypto)+'/>\
<input class="thiccb" type="button" value="save xml" onclick="var a=[],g=current_gui();tbd_set_disabled(true);try{cc_make_xml(a.push.bind(a),g.cc_data);cc_save_modal(a,g.dataset.ccFileName,xmlblobopts);}catch(error){say_error(&quot;save xml&quot;,error);}"/>\
<input class="thiccb" type="button" value="open copy in new tab"/>';
	a=a.tbd=a.querySelectorAll('input:enabled');
	a[0].addEventListener('click',pop_gui,onceel);
	a[a.length-1].addEventListener('click',copy_to_new_tab,passiveel);
}

function copy_to_new_tab(){
	try{
		var win=window.open(location.href,'_blank','');
		if(!win){
			alert('window.open returned not object\n\nmaybe because popup blocker');
			return;
		}
		try{
			win.opener=null;
		}catch(error){}
		var g=current_gui(),name=g.dataset.ccFileName,json=JSON.stringify(g.cc_data);
		win.addEventListener('DOMContentLoaded',function ld(){
			try{
				if(no_support_once)win.removeEventListener('DOMContentLoaded',ld,onceel);
				var g=win.cre('div');
				g.dataset.isModal='display:flex;flex-direction:column;';
				g.dataset.ccFileName=name;
				win.push_gui(g);
				win.load_cc_data(win.JSON.parse(json));
			}catch(error){
				say_error('open copy in new tab (ld)',error);
			}
		},onceel);
	}catch(error){
		say_error('open copy in new tab',error);
	}
}

function cc_load_file_reader_onerror(){
	say_error('FileReader',this.error);
}

function cc_load_gzip_text_promise_error(error){
	say_error('ungzip (text)',error);
}

var xor2chr,chr2xor;
(function(){
	var i=new ArrayBuffer(512),chr;
	xor2chr=new Uint8Array(i,0,256);
	chr2xor=new Uint8Array(i,256,256);
	i=63;
	xor2chr[chr2xor['+'.charCodeAt(0)]='-'.charCodeAt(0)^11]='+'.charCodeAt(0);
	xor2chr[chr2xor['/'.charCodeAt(0)]='_'.charCodeAt(0)^11]='/'.charCodeAt(0);
	while(i){
		chr='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789='.charCodeAt(--i);
		xor2chr[chr2xor[chr]=0x0B^chr]=chr;
	}
})();

function cc_load_gzip_file_reader_onload(){
	try{
		var str,pos=0,ch=xor2chr,cc=this.result;
		//force len to be mulple of 4 because sometimes there is junk at the end
		var len=Math.floor(cc.byteLength/4)*4;
		cc=new Uint8Array(cc,0,len);
		while(len>pos)cc[pos]=ch[cc[pos++]];
		if(len>8192){
			str=(ch=String.fromCharCode).apply(null,cc.subarray(0,pos=8192));
			while(len>pos)str+=ch.apply(null,cc.subarray(pos,pos+=8192));
		}else str=String.fromCharCode.apply(null,cc);
		cc=cc.subarray(pos=0,(str=atob(str)).length);
		while(len>pos)cc[pos]=str.charCodeAt(pos++);
	}catch(error){
		say_error('xor 11+base64 decode',error);
		return;
	}
	try{
		str=new window.DecompressionStream('gzip');
		ch=str.writable.getWriter();
		ch.write(cc);
		ch.close();
		new Response(str.readable).text().then(cc_load_xml_string,cc_load_gzip_text_promise_error);
	}catch(error){
		say_error('ungzip',error);
	}
}

function cc_load_xml_file_reader_onload(){
	cc_load_xml_string(this.result);
}

function cc_load_gzip(file){
	try{
		cc_gui_push_loading_modal(file.name);
		var fr=new FileReader();
		fr.addEventListener('error',cc_load_file_reader_onerror,onceel);
		fr.addEventListener('load',cc_load_gzip_file_reader_onload,onceel);
		fr.readAsArrayBuffer(file);
	}catch(error){
		say_error('FileReader',error);
	}
}

function cc_load_aes(file){
	try{
		cc_gui_push_loading_modal(file.name);
		if((fr=file.size)<16)throw Error('file size < 16');
		if(fr%16)throw Error('file size not divisible by 16');
		var fr=new FileReader();
		fr.addEventListener('error',cc_load_file_reader_onerror,onceel);
		fr.addEventListener('load',cc_load_aes_file_reader_onload,onceel);
		fr.readAsArrayBuffer(new Blob([file,'\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10'],binblobopts));
	}catch(error){
		say_error('FileReader',error);
	}
}

try{
	var aeskey,subtlecrypto=window.crypto.subtle;
}catch(error){
	console.warn('can\'t get window.crypto.subtle:\n\n',error);
}
if(!subtlecrypto||typeof subtlecrypto!=='object')subtlecrypto='disabled="" title="can&apos;t use window.crypto.subtle'+('https:'===location.protocol?'"':'&#10;&#10;try using https:"');

function ensure_aeskey(callback,onerror){
	//key from https://github.com/Wyliemaster/GD-Save-Decryptor/blob/main/saves.py
	return aeskey?callback():subtlecrypto.importKey('raw',string_to_uint8array('ipu9TUv54yv]isFMh5@;t.5w34E2Ry@{').buffer,{'name':'AES-CBC'},false,['encrypt','decrypt']).then(function(k){
		aeskey=k;
		return callback();
	},onerror);
}

function cc_load_aes_file_reader_onload(){
	try{
		//this code is weird because javascript doesn't support AES-ECB
		//so it uses AES-CBC mode and fixes output (first 16 bytes are already correct)
		//see https://www.highgo.ca/2019/08/08/the-difference-in-five-modes-in-the-aes-encryption-algorithm/
		var encryptedi32=new Int32Array(this.result),aesalg={'iv':encryptedi32.subarray(-8,-4),'name':'AES-CBC'},d=encryptedi32.subarray(-4);
		ensure_aeskey(function(){
			//add fake padding:
			//encrypt 16 16s with iv=last 16 bytes of files
			return subtlecrypto.encrypt(aesalg,aeskey,d);
		}).then(function(pad){
			//put first 16 bytes result at end file
			pad=new Int32Array(pad);
			d[0]=pad[0];
			d[1]=pad[1];
			d[2]=pad[2];
			d[3]=pad[3];
			//decrypt with fake padding:
			aesalg.iv=new ArrayBuffer(16);
			return subtlecrypto.decrypt(aesalg,aeskey,encryptedi32);
		}).then(function(decryptedbuf){
			var decrypted=new Int32Array(decryptedbuf),i=decrypted.length;
			//fix output
			while(i>4)decrypted[--i]^=encryptedi32[i-4];
			i=(decrypted=new Uint8Array(decryptedbuf)).length;
			if((decryptedbuf=decrypted[i-1])>16)throw Error('padding > 16');
			if(!decryptedbuf)throw Error('padding = 0');
			var m=i---decryptedbuf;
			while(i>m)if(decryptedbuf!==decrypted[--i])throw Error('padding bytes not all equal');
			cc_load_xml_string(new TextDecoder('utf-8',{
				'fatal':true,
				'ignoreBOM':false
			}).decode(decrypted.subarray(0,m)));
		}).catch(cc_load_aes_onerror);
	}catch(error){
		cc_load_aes_onerror(error);
	}
}

function cc_load_aes_onerror(error){
	say_error('AES-ECB 256 decrypt',error);
}

function cc_save_aes(data,name,prog){
	function onerror(error){
		o=1;
		say_error('AES-ECB 256 encrypt',error);
	}
	try{
		var chunks=[],o=0,i,done=0,pdone=prog.value=0,sc=subtlecrypto,ak;
		cc_make_xml(function(chunk){
			o+=chunk.length;
			chunks.push(chunk);
		},data);
		i=chunks.length;
		data=new Uint8Array(16*(1+Math.floor(o/16)));
		data.fill(data.length-o,o);//padding
		while(i)data.set(chunks[--i],o-=chunks[i].length);//data
		chunks={'iv':new ArrayBuffer(16),'name':'AES-CBC'};
		data=new Int32Array(data.buffer);
		i=data.length;
		prog.setAttribute('style','width:100%;');
		//javascript doesn't support AES-ECB
		//so AES-CBC encrypt each 16 byte chunk individually
		function write_encrypted(e){
			try{
				e=new Int32Array(e);
				var f=this[1];
				data[f]=e[0];
				data[1+f]=e[1];
				data[2+f]=e[2];
				data[3+f]=e[3];
				if(o!==1){
					if(pdone!==(f=Math.floor((done+=4)/i*64)))pdone=prog.value=f;
					if(i===done){
						o=1;
						prog.setAttribute('style','display:none;');
						cc_save_modal([data],name,binblobopts);
					}else if(o<i)encrypt(this);
				}
			}catch(error){
				onerror(error);
			}
		}
		function encrypt(oa){
			sc.encrypt(chunks,ak,data.subarray(oa[1]=o,o+=4)).then(oa[0],onerror);
		}
		ensure_aeskey(function(){
			try{
				ak=aeskey;
				var a,c=0;
				while(c<8&&o<i){
					++c;
					a=[null,0];
					a[0]=write_encrypted.bind(a);
					encrypt(a);
				}
			}catch(error){
				onerror(error);
			}
		},onerror);
	}catch(error){
		onerror(error);
	}
}

function cc_load_xml(file){
	try{
		cc_gui_push_loading_modal(file.name);
		var fr=new FileReader();
		fr.addEventListener('error',cc_load_file_reader_onerror,onceel);
		fr.addEventListener('load',cc_load_xml_file_reader_onload,onceel);
		fr.readAsText(file);
	}catch(error){
		say_error('FileReader',error);
	}
}

function write_string_to_uint8array(string,uint8array,offset){
	var i=0,len=string.length;
	while(len>i)uint8array[i+offset]=string.charCodeAt(i++);
	return len+offset;
}

function string_to_uint8array(string){
	if(has_unicode_re.test(string))throw Error('string has characters > U+00FF');
	var len=string.length,i=0,u=new Uint8Array(len);
	while(len>i)u[i]=string.charCodeAt(i++);
	return u;
}

var xml_escape_re=RegExp('[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[^ !#-%\\(-;=?-~]','g'),has_unicode_re=RegExp('[\\u0100-\\uFFFF]','');

function xml_escape_replacer(chr){
	switch(chr){
		case '"':return '&quot;';
		case '\'':return '&apos;';
		case '<':return '&lt;';
		case '>':return '&gt;';
		case '&':return '&amp;';
		default:return '&#'+chr.codePointAt(0)+';';
	}
}

function escape_xml(string){
	return string.replace(xml_escape_re,xml_escape_replacer);
}

var xmlbuf1=string_to_uint8array('<?xml version=\'1.0\' encoding=\'UTF-8\' standalone=\'yes\'?>\n<plist'),
	xmlbuf2=string_to_uint8array('>\n\t<dict>\n'),
	xmlbuf3=string_to_uint8array('\t</dict>\n</plist>');

function cc_make_xml_push_dict_contents(write,indent,dict,endl){
	var i=0,len=dict.length,item,u,k,v,t,offset,needn;
	while(len>i){
		item=dict[i];
		needn=len>++i||endl;
		k=escape_xml(item.key);
		offset=indent;
		t=item.type;
		if(t==='d'){
			u=new Uint8Array(indent*3+k.length+needn+16);
			u.fill(9,0,indent);
			u[offset++]=60;//<
			u[offset++]=47;///
			u[offset++]=100;//d
			u[offset++]=62;//>
			if(needn)u[offset++]=10;
			t=offset;
			//split here
			u.fill(9,offset,offset+=indent);
			u[offset++]=60;//<
			u[offset++]=107;//k
			u[offset++]=62;//>
			offset=write_string_to_uint8array(k,u,offset);
			u[offset++]=60;//<
			u[offset++]=47;///
			u[offset++]=107;//k
			u[offset++]=62;//>
			u[offset++]=10;//\n
			u.fill(9,offset,offset+=indent);
			u[offset++]=60;//<
			u[offset++]=100;//d
			u[offset++]=62;//>
			u[offset++]=10;//\n
			write(u.subarray(t,offset));
			cc_make_xml_push_dict_contents(write,indent+1,item.value,true);
			write(u.subarray(0,t));
			continue;
		}
		v=escape_xml(item.value);
		u=new Uint8Array((indent<<1)+15+k.length+v.length+needn);
		u.fill(9,0,indent);
		u[offset++]=60;//<
		u[offset++]=107;//k
		u[offset++]=62;//>
		offset=write_string_to_uint8array(k,u,offset);
		u[offset++]=60;//<
		u[offset++]=47;///
		u[offset++]=107;//k
		u[offset++]=62;//>
		u[offset++]=10;//\n
		u.fill(9,offset,offset+=indent);
		u[offset++]=60;//<
		u[offset++]=t=t.charCodeAt(0);
		u[offset++]=62;//>
		offset=write_string_to_uint8array(v,u,offset);
		u[offset++]=60;//<
		u[offset++]=47;///
		u[offset++]=t;
		u[offset++]=62;//>
		if(needn)u[offset]=10;//\n
		write(u);
	}
}

function cc_make_xml(write,cc_data){
	var plist='',attrs=cc_data.attrs,i=0,len=attrs.length;
	while(len>i)plist+=' '+attrs[i++]+'=\''+escape_xml(attrs[i++])+'\'';
	write(xmlbuf1);
	write(string_to_uint8array(plist));
	write(xmlbuf2);
	cc_make_xml_push_dict_contents(write,2,cc_data.dict,true);
	write(xmlbuf3);
}

function cc_gzip_promise_error(error){
	say_error('gzip',error);
}

function cc_save_gzip(cc_data,name){
	try{
		var c=new window.CompressionStream('gzip'),s=c.writable.getWriter(),out='',c2x=chr2xor,chr=String.fromCharCode;
		cc_make_xml(s.write.bind(s),cc_data);
		s.close();
		s=c.readable.getReader();
		s.read().then(function ondata(u){
			try{
				var len,i=0;
				if(u.done){
					out=btoa(out);
					u=new Uint8Array(len=out.length);
					while(len>i)u[i]=c2x[out.charCodeAt(i++)];
					cc_save_modal([u.buffer],name,binblobopts);
					return;
				}
				u=u.value;
				len=u.length;
				if(len>8192)while(len>i)out+=chr.apply(null,u.subarray(i,i+=8192));
				else out+=chr.apply(null,u);
				s.read().then(ondata,cc_gzip_promise_error);
			}catch(error){
				say_error('base64 encode+xor 11',error);
			}
		},cc_gzip_promise_error);
	}catch(error){
		say_error('gzip',error);
	}
}

push_gui(gui_div_with_html(false,
'<div style="display:flex;flex-direction:column;">\
<h1><a href="https://gdccdated.glitch.me/index.xhtml" rel="noreferrer" style="text-decoration:none;" title="link to myself">CCGameManager.dat or CCLocalLevels.dat editor</a></h1>\
<hr style="margin:0;"/>\
<h2>make a backup of CCGameManager.dat and CCLocalLevels.dat to be able to unbreak geometry dash</h2>\
<input class="thiccb" type="file"/>\
<input class="thiccb" type="button" value="load encrypted (windows and android)" '+(window.DecompressionStream?'onclick="var f=current_gui().drop_file_input.files[0];if(f){set_loading(true);cc_load_gzip(f);}else window.alert(&quot;no file&quot;);"':'title="your browser doesn&apos;t support DecompressionStream" disabled=""')+'/>\
<input class="thiccb" type="button" value="load encrypted (mac os)" '+(typeof subtlecrypto==='object'?'onclick="var f=current_gui().drop_file_input.files[0];if(f){set_loading(true);cc_load_aes(f);}else window.alert(&quot;no file&quot;);"':subtlecrypto)+'/>\
<input class="thiccb" type="button" value="load xml" onclick="var f=current_gui().drop_file_input.files[0];if(f){set_loading(true);cc_load_xml(f);}else window.alert(&quot;no file&quot;);"/>\
<hr/>\
<input class="thiccb" type="button" value="open encoded string editor" onclick="string_editor(null,null,&quot;&quot;);"/>\
<input class="thiccb" type="button" value="open empty dict editor" onclick="cc_gui_push_dict_editor([],&quot;fake root&quot;);"/>\
<hr/>\
<input class="thiccb" type="button" value="about CC*.dat files" onclick="push_ccatricle();"/>\
<a class="btn thiccb" href="https://gdprogra.me/#/resources/client/gamesave" rel="noreferrer" target="_blank"><q cite="https://gdprogra.me/#/resources/client/gamesave">Client Gamesave Resource</q> on gdprogra.me</a>\
<a class="btn thiccb" href="https://github.com/xBZZZZ/gdccdated/issues" rel="noreferrer" target="_blank">report bug or suggestion on github.com</a>\
</div>'));
current_gui().drop_file_input=current_gui().querySelector('input[type=file]');
if(location.hash==='#ccarticle')push_ccatricle();

function push_ccatricle(){
	var g=cre('article');
	g.innerHTML='<input type="button" onclick="pop_gui();location.hash=&quot;&quot;;" value="back"/>\
<details open="" class="bigd">\
<summary>how to decode CC*.dat file (windows and android)?</summary><ol>\
<li>read <strong class="wp">floor(<var>file size in bytes</var> / 4) * 4</strong> bytes from file<ul><li>\
don&apos;t read entire file because there can be 1 or 2 bytes of garbage because <a href="https://github.com/gd-programming/gd.docs/pull/107#issuecomment-1380542961" rel="noreferrer" target="_blank">robtop messed up base64 length calculation</a>\
</li></ul></li>\
<li>xor all bytes with <code class="wpb">0x0B</code></li>\
<li><a href="https://docs.python.org/3/library/base64.html#base64.urlsafe_b64decode" rel="noreferrer" target="_blank">url safe base64 decode</a></li>\
<li>decompress as gzip</li>\
</ol>\
</details>\
<details open="" class="bigd">\
<summary>how to decode CC*.dat file (mac os)?</summary>\
<ol>\
<li><strong><a href="https://www.highgo.ca/2019/08/08/the-difference-in-five-modes-in-the-aes-encryption-algorithm/" rel="noreferrer" target="_blank">AES-ECB</a> 256</strong> decrypt with key=<wbr/><q class="wpb" style="quotes:none;" cite="https://github.com/Wyliemaster/GD-Save-Decryptor/blob/main/saves.py#L43">ipu9TUv54yv]isFMh5@;t.5w34E2Ry@{</q></li>\
<li>remove padding (last <var style="font-weight:bold;">value of last byte</var> bytes are equal and &lt;16 and are padding)</li>\
</ol></details>\
<details open="" class="bigd">\
<summary>geometry dash can load non-encoded XML files (windows and android)</summary><ul>\
<li>file name ends with <strong class="wp">.dat</strong>, not <strong class="wp">.xml</strong>!</li>\
<li>doesn&apos;t work with mac os version</li>\
</ul></details>\
<details style="background-color:#f0f3f3;" open="" class="bigd">\
<summary>linux shell command to decode CC*.dat file (windows and android)</summary>\
<code style="white-space:pre-wrap;color:#000;"><span style="color: #0099FF; font-style: italic"># replace $CCFILE with input file path&#10;# replace $DECODEDCCFILE with output file path</span>&#10;xxd -p -c4 <span style="color: #CC3300">&quot;$CCFILE&quot;</span> | gawk <span style="color: #CC3300">&#39;length($0)==8{printf&quot;%08x&quot;,xor(0xb0b0b0b,strtonum(&quot;0x&quot;$0))}&#39;</span> | xxd -p -r | tr <span style="color: #CC3300">&#39;_-&#39;</span> <span style="color: #CC3300">&#39;/+&#39;</span> | base64 -d | zcat &gt; <span style="color: #CC3300">&quot;$DECODEDCCFILE&quot;</span></code>\
</details>\
<details style="background-color:#f0f3f3;" open="" class="bigd">\
<summary>mac os and linux shell command to decode CC*.dat file (mac os)</summary>\
<code style="white-space:pre-wrap;color:#000;"><span style="color: #0099FF; font-style: italic"># replace $CCFILE with input file path&#10;# replace $DECODEDCCFILE with output file path</span>&#10;openssl aes-256-ecb -in <span style="color: #CC3300">&quot;$CCFILE&quot;</span> -out <span style="color: #CC3300">&quot;$DECODEDCCFILE&quot;</span> -d -K 69707539545576353479765D6973464D6835403B742E3577333445325279407B</code>\
</details>\
<details open="" class="bigd">\
<summary>other CC*.dat file tools</summary><strong>WARNING (doesn&apos;t apply to mac os saves):</strong> some of these sometimes don&apos;t work because they read entire file instead of just <strong class="wp">floor(<var>file size in bytes</var> / 4) * 4</strong> bytes<ul>\
<li>'+linkf('https://www.youtube.com/watch?v=OA4918DQxG0')+'</li>\
<li>'+linkf('https://gdcolon.com/gdsave/')+'</li>\
<li>'+linkf('https://github.com/WEGFan/Geometry-Dash-Savefile-Editor')+'</li>\
<li>'+linkf('https://github.com/Wyliemaster/GD-Save-Tools')+'</li>\
<li>'+linkf('https://github.com/Wyliemaster/GD-Save-Decryptor')+' (can decrypt mac os saves, doesn&apos;t remove padding when padding=16)</li>\
<li>'+linkf('https://github.com/GDColon/GD-Save-Decoder')+'</li>\
<li>'+linkf('https://geometry-dash.fandom.com/wiki/User:XBZZZZALT#backup_of_useful_stuff_from_Save_Files_page')+'</li>\
<li>'+linkf('https://gdprogra.me/#/topics/localfiles_encrypt_decrypt')+'</li>\
</ul></details>';
	push_gui(g);
	location.hash='#ccarticle';
}