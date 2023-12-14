//this is not included in index.xhtml and gdccdated_standalone.xhtml
//instead this js script is converted to sed script in out.sh:
//	"//" and everything after until "\n" is removed
//	empty line is removed
//	"var AAA=BBB;" -> "s=\bAAA\b=BBB=g"
//and that sed script is executed on all other js files when generating index.xhtml and gdccdated_standalone.xhtml

//CSelect
var CSITEMHEIGHT=24;
var CSBGCOLOR='rgb(200,200,200)';
var CSEVENCOLOR='rgb(220,220,220)';
var CSODDCOLOR='rgb(210,210,210)';
var CSTXTCOLOR='rgb(50,0,50)';
var CSTXTSELCOLOR='rgb(255,255,255)';
var CSTXTLEFT=2;
var CSTXTFONT=16;

var CSSEL=1;
var CSITEMS=2;

//AdvTextArea
var MAX_SHOW_CHARS=65536;