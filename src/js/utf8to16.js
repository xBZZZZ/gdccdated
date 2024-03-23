'use strict';

//https://encoding.spec.whatwg.org/#utf-8-decoder

function utf8to16(callback_ok,callback_abort,buf,outstr,i){
	var l=buf.length,chr=String.fromCharCode,b1,b2,b3,b4,j;
	oof:do{
		for(;i!==l;++i){
			if(buf[j=i]<128){
				if((b1=l-i)>8192)b1=8192;
				while(++i,--b1&&buf[i]<128);
				outstr+=chr.apply(null,buf.subarray(j,i--));
				continue;
			}
			if((b1=buf[i])<194||b1>244
				||++i===l)continue oof;
			b2=buf[i];
			//b1 is valid start of multi-byte code point
			if(b1<224){
				//110xxxxx (2 byte code point)
				if(b2<128||b2>191)continue oof;
				outstr+=chr(b2^(b1<<6)^12416);
				continue;
			}
			if(b1<240){
				//1110xxxx (3 byte code point)
				if(b2<(b1===224?160:128)||b2>(b1===237?159:191)
					||++i===l
					||(b3=buf[i])<128||b3>191)continue oof;
				outstr+=chr(b3^(b2<<6)^(b1<<12)^925824);
				continue;
			}
			//11110xxx (4 byte code point)
			if(b2<(b1===240?144:128)||b2>(b1===244?143:191)
				||++i===l
				||(b3=buf[i])<128||b3>191
				||++i===l
				||(b4=buf[i])<128||b4>191)continue oof;
			outstr+=chr(
				(b3>>4)+(b2<<2)+(b1<<8)-6728,
				b4^((b3&15)<<6)^56448
			);
		}
		callback_ok(outstr);
		return;
	}while(!callback_abort&&(i+=i===j,outstr+='\uFFFD'));

	//ask how to handle error
	//don't set tbl.innerHTML because browser adds <tbody> in html mode (non-xhtml)
	var tbl=cre('table'),tr=cre('tr');
	tbl.className='tableborder';
	tr.innerHTML='<th colspan="2" style="background-color:var(--Bad);">bad UTF-8</th>';
	tbl.appendChild(tr);
	(tr=cre('tr')).innerHTML='<td>code point offset inside data:</td><td>'+j+'</td>';
	tbl.appendChild(tr);
	(tr=cre('tr')).innerHTML='<td>error offset inside code point:</td><td>'+(i-j)+'</td>';
	tbl.appendChild(tr);
	(tr=cre('tr')).innerHTML='<td>data length:</td><td>'+l+'</td>';
	tbl.appendChild(tr);
	(tr=cre('tr')).innerHTML='<td colspan="2"><input value="abort" data-a="a" type="button"/><input value="replace errors" title="replace errors with U+FFFD like str(data,&apos;utf-8&apos;,&apos;replace&apos;) in python3" data-a="r" type="button"/><a data-a="s" download="bad_utf8.bin" href="javascript:;" class="btn" style="display:inline-block;">save data</a></td>';
	tr.firstChild.addEventListener('click',function(e){
		switch((e=e.target).dataset.a){
			case 'a':
				pop_gui();
				callback_abort();
				set_loading(false);
				return;
			case 'r':
				set_loading(true);
				pop_gui();
				utf8to16(callback_ok,null,buf,outstr+'\uFFFD',i+(i===j));
				return;
			case 's':
				setTimeout(revoke_href,0,e);
				e.href=URL.createObjectURL(new Blob([buf],binblobopts));
		}
	},capel);
	tbl.appendChild(tr);
	push_gui(tbl,true);
	set_loading(false);
}

function revoke_href(a){
	URL.revokeObjectURL(a.href);
	a.href='javascript:;';
}