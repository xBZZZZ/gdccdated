//this is not included in index.xhtml and gdccdated_standalone.xhtml
//instead this js script is converted to sed script in out.sh:
//	"//" and everything after until "\n" is removed
//	empty line is removed
//	"var AAA=BBB;" -> "s=\bAAA\b=BBB=g"
//and that sed script is executed on all other js files when generating index.xhtml and gdccdated_standalone.xhtml

//CSelect
var CS_ITEM_HEIGHT=24;

var CS_SEL=1;
var CS_ITEMS=2;

//AdvTextArea
var MAX_SHOW_CHARS=65536;