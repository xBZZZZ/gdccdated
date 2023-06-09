//this is not included in index.xhtml and index_standalone.xhtml
//instead this js script is converted to sed script in out.sh:
//	"//" and everything after until "\n" is removed
//	empty line is removed
//	"var AAA=BBB;" -> "s=\bAAA\b=BBB=g"
//and that sed script is executed on all other js files when generating index.xhtml and index_standalone.xhtml

//CSelect
var CSITEMHEIGHT=24;
var CSSCROLLBARWIDTH=16;
var CSSCROLLHANDLEMINHEIGHT=16;
var CSSEL=1;
var CSITEMS=2;