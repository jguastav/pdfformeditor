CoreControls.setWorkerPath('../../../lib/html5');

//(function(exports){
    //"use strict";

function saveBufferAsPDFDoc(buf, name)
{
    var blob = new Blob([buf], {
        type: 'application/pdf'
    });
    saveAs(blob, name);
}

function saveBufferAsPNG(buf, name)
{
    var blob = new Blob([buf], {
        type: 'image/png'
    });
    saveAs(blob, name);
}